import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Dog, Info, Sparkles, BookOpen, ShoppingBag, Calendar, ArrowRight, Package, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

import { DogBreedPredictor } from '@/components/ai/DogBreedPredictor'
import { Card, Button } from '@/components/common'
import { aiService, type SinglePredictionResponse, type DogBreed } from '@/services/ai.service'
import { publicService } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { formatVND } from '@/utils'

export const DogBreedPrediction = () => {
  const { addToCart } = useCart()
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [breeds, setBreeds] = useState<DogBreed[]>([])
  const [showBreedList, setShowBreedList] = useState(false)
  const [predictionHistory, setPredictionHistory] = useState<Array<{
    timestamp: string
    breed: string
    confidence: number
  }>>([])
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  const [suggestedServices, setSuggestedServices] = useState<any[]>([])
  const [lastPredictedBreed, setLastPredictedBreed] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    checkServerStatus()
    loadBreeds()
    fetchSuggestions('chó')
  }, [])

  const checkServerStatus = async () => {
    try {
      await aiService.healthCheck()
      setServerStatus('online')
    } catch (error) {
      setServerStatus('offline')
      toast.error('AI Server đang offline. Vui lòng khởi động server trước khi sử dụng.')
    }
  }

  const loadBreeds = async () => {
    try {
      const response = await aiService.getBreeds()
      setBreeds(response.breeds)
    } catch (error) {
      console.error('Failed to load breeds:', error)
    }
  }

  // Map dog breed characteristics to product/service recommendations
  const getBreedRecommendations = (breed: string) => {
    const breedLower = breed.toLowerCase()

    // Large/Active breeds - need more food, exercise equipment
    const largeDogs = ['german shepherd', 'golden retriever', 'labrador', 'husky', 'rottweiler', 'doberman', 'great dane', 'mastiff', 'bernese', 'akita', 'malamute', 'boxer', 'dalmatian']
    // Small breeds - need small-sized products, gentle grooming
    const smallDogs = ['chihuahua', 'pomeranian', 'yorkshire', 'maltese', 'shih tzu', 'poodle', 'papillon', 'pug', 'french bulldog', 'boston terrier', 'cavalier', 'bichon']
    // Long-haired breeds - need more grooming
    const longHaired = ['golden retriever', 'husky', 'pomeranian', 'shih tzu', 'maltese', 'yorkshire', 'collie', 'afghan', 'samoyed', 'chow chow', 'bernese']
    // Active/Sport breeds - need toys and exercise
    const activeDogs = ['border collie', 'australian shepherd', 'labrador', 'golden retriever', 'husky', 'dalmatian', 'boxer', 'vizsla', 'weimaraner', 'pointer']

    const recommendations = {
      productKeywords: ['chó', 'dog'],
      serviceKeywords: ['chó', 'khám', 'grooming'],
      size: 'medium',
      needsGrooming: false,
      needsExercise: false
    }

    // Check breed characteristics
    if (largeDogs.some(b => breedLower.includes(b))) {
      recommendations.size = 'large'
      recommendations.productKeywords.push('lớn', 'large', 'adult')
    } else if (smallDogs.some(b => breedLower.includes(b))) {
      recommendations.size = 'small'
      recommendations.productKeywords.push('nhỏ', 'small', 'mini')
    }

    if (longHaired.some(b => breedLower.includes(b))) {
      recommendations.needsGrooming = true
      recommendations.productKeywords.push('lông', 'tắm', 'chải')
      recommendations.serviceKeywords.push('spa', 'cắt tỉa', 'tắm')
    }

    if (activeDogs.some(b => breedLower.includes(b))) {
      recommendations.needsExercise = true
      recommendations.productKeywords.push('đồ chơi', 'vận động', 'ball')
    }

    return recommendations
  }

  const fetchSuggestions = async (breed: string) => {
    try {
      const recommendations = getBreedRecommendations(breed)

      // Fetch products with dog-related search
      let allProducts: any[] = []
      try {
        // Try searching with 'chó' first
        const productsResponse = await publicService.getProducts({ limit: 20, search: 'chó' })
        if (productsResponse && typeof productsResponse === 'object') {
          if ('data' in productsResponse && Array.isArray(productsResponse.data)) {
            allProducts = productsResponse.data
          } else if (Array.isArray(productsResponse)) {
            allProducts = productsResponse
          }
        }

        // If no dog products found, get general products
        if (allProducts.length === 0) {
          const generalResponse = await publicService.getProducts({ limit: 20 })
          if (generalResponse && typeof generalResponse === 'object') {
            if ('data' in generalResponse && Array.isArray(generalResponse.data)) {
              allProducts = generalResponse.data
            } else if (Array.isArray(generalResponse)) {
              allProducts = generalResponse
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
      }

      // Filter and score products based on breed recommendations
      const scoredProducts = allProducts.map(product => {
        let score = 0
        const productName = (product.name || '').toLowerCase()
        const productDesc = (product.description || '').toLowerCase()
        const searchText = productName + ' ' + productDesc

        // Check for dog-related keywords
        if (searchText.includes('chó') || searchText.includes('dog')) score += 10

        // Check for size-specific keywords
        if (recommendations.size === 'large' && (searchText.includes('lớn') || searchText.includes('large') || searchText.includes('adult'))) score += 5
        if (recommendations.size === 'small' && (searchText.includes('nhỏ') || searchText.includes('small') || searchText.includes('mini'))) score += 5

        // Check for grooming products
        if (recommendations.needsGrooming && (searchText.includes('lông') || searchText.includes('tắm') || searchText.includes('chải') || searchText.includes('shampoo'))) score += 5

        // Check for exercise/toy products
        if (recommendations.needsExercise && (searchText.includes('đồ chơi') || searchText.includes('toy') || searchText.includes('ball') || searchText.includes('vận động'))) score += 5

        // Bonus for food products (always relevant)
        if (searchText.includes('thức ăn') || searchText.includes('food') || searchText.includes('hạt')) score += 3

        return { ...product, score }
      })

      // Sort by score and take top 4
      const sortedProducts = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)

      setSuggestedProducts(sortedProducts)

      // Fetch services with dog-related filter
      let allServices: any[] = []
      try {
        const servicesResponse = await publicService.getServices({ limit: 20 })
        if (servicesResponse && typeof servicesResponse === 'object') {
          if ('data' in servicesResponse && Array.isArray(servicesResponse.data)) {
            allServices = servicesResponse.data
          } else if (Array.isArray(servicesResponse)) {
            allServices = servicesResponse
          }
        }
      } catch (err) {
        console.error('Failed to fetch services:', err)
      }

      // Filter and score services
      const scoredServices = allServices.map(service => {
        let score = 0
        const serviceName = (service.name || '').toLowerCase()
        const serviceDesc = (service.description || '').toLowerCase()
        const searchText = serviceName + ' ' + serviceDesc
        const petTypes = service.petTypes || []

        // Check if service is for dogs
        if (petTypes.includes('dog') || petTypes.includes('chó')) score += 10
        if (searchText.includes('chó') || searchText.includes('dog')) score += 5

        // General pet services
        if (searchText.includes('khám') || searchText.includes('vaccine') || searchText.includes('tiêm')) score += 5

        // Grooming services for long-haired breeds
        if (recommendations.needsGrooming && (searchText.includes('grooming') || searchText.includes('spa') || searchText.includes('tắm') || searchText.includes('cắt tỉa'))) score += 8

        // Health checkup (always relevant)
        if (searchText.includes('sức khỏe') || searchText.includes('tổng quát')) score += 3

        return { ...service, score }
      })

      // Sort by score and take top 4
      const sortedServices = scoredServices
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)

      setSuggestedServices(sortedServices)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const handlePredictionComplete = (result: SinglePredictionResponse) => {
    if (result.success) {
      // Add to history
      const newEntry = {
        timestamp: new Date().toLocaleString('vi-VN'),
        breed: result.prediction.breed,
        confidence: result.prediction.confidence_percent
      }
      setPredictionHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10

      // Update last predicted breed and fetch suggestions
      setLastPredictedBreed(result.prediction.breed)
      fetchSuggestions(result.prediction.breed)
    }
  }

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.imageUrl,
      stockQuantity: product.stockQuantity
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-[#2E86AB] to-[#F18F01] rounded-2xl">
              <Dog className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Nhận diện giống chó
            </h1>
            <Sparkles className="w-8 h-8 text-[#F18F01]" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Công nghệ AI giúp bạn nhận diện giống chó chỉ từ một bức ảnh.
            Hỗ trợ hơn 120 giống chó phổ biến trên thế giới!
          </p>
        </div>

        {/* Server Status */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Trạng thái AI Server:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
                serverStatus === 'offline' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`} />
              <span className={`font-medium ${
                serverStatus === 'online' ? 'text-green-700' :
                serverStatus === 'offline' ? 'text-red-700' :
                'text-yellow-700'
              }`}>
                {serverStatus === 'online' ? 'Đang hoạt động' :
                 serverStatus === 'offline' ? 'Offline' :
                 'Đang kiểm tra...'}
              </span>
              {serverStatus === 'offline' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkServerStatus}
                  className="ml-2"
                >
                  Thử lại
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Prediction Section */}
          <div className="lg:col-span-2">
            {serverStatus === 'online' ? (
              <DogBreedPredictor
                onPredictionComplete={handlePredictionComplete}
                topK={5}
              />
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Dog className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI Server chưa sẵn sàng
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Vui lòng khởi động AI Server để sử dụng tính năng này
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-sm font-mono text-gray-700 mb-2">
                      cd AI
                    </p>
                    <p className="text-sm font-mono text-gray-700">
                      python api_server.py
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it works */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#2E86AB]" />
                <h3 className="font-semibold text-gray-900">Cách sử dụng</h3>
              </div>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">
                    1
                  </span>
                  <span>Tải lên ảnh chú chó cần nhận diện</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">
                    2
                  </span>
                  <span>Nhấn nút "Nhận diện giống chó"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">
                    3
                  </span>
                  <span>Xem kết quả với độ chính xác cao</span>
                </li>
              </ol>
            </Card>

            {/* Supported Breeds */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Dog className="w-5 h-5 text-[#F18F01]" />
                  <h3 className="font-semibold text-gray-900">Giống chó hỗ trợ</h3>
                </div>
                {breeds.length > 0 && (
                  <span className="px-2 py-1 bg-[#F18F01]/10 text-[#F18F01] rounded-full text-xs font-medium">
                    {breeds.length} giống
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Hệ thống hỗ trợ nhận diện {breeds.length || '120+'} giống chó phổ biến
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBreedList(!showBreedList)}
                className="w-full"
              >
                {showBreedList ? 'Ẩn danh sách' : 'Xem danh sách'}
              </Button>

              {showBreedList && breeds.length > 0 && (
                <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="p-2 space-y-1">
                    {breeds.map((breed) => (
                      <div
                        key={breed.index}
                        className="px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                      >
                        {breed.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Prediction History */}
            {predictionHistory.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#C73E1D]" />
                  <h3 className="font-semibold text-gray-900">Lịch sử nhận diện</h3>
                </div>
                <div className="space-y-2">
                  {predictionHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {entry.breed}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.timestamp}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#2E86AB]">
                          {entry.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mt-8 bg-gradient-to-r from-[#2E86AB]/10 to-[#F18F01]/10 border-[#2E86AB]/20">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-[#2E86AB] flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Lưu ý khi sử dụng</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Ảnh nên rõ ràng, chụp cận cảnh chú chó</li>
                <li>• Kết quả tốt nhất với ảnh chụp từ phía trước hoặc bên cạnh</li>
                <li>• Độ chính xác phụ thuộc vào chất lượng ảnh và đặc điểm chú chó</li>
                <li>• Một số giống chó có đặc điểm tương tự nhau có thể gây nhầm lẫn</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Product & Service Suggestions */}
        {(suggestedProducts.length > 0 || suggestedServices.length > 0) && (
          <div className="mt-8 space-y-8">
            {/* Section Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lastPredictedBreed ? (
                  <>Gợi ý cho giống chó <span className="text-[#2E86AB]">{lastPredictedBreed}</span></>
                ) : (
                  <>Sản phẩm & Dịch vụ <span className="text-[#2E86AB]">dành cho chó</span></>
                )}
              </h2>
              <p className="text-gray-600">
                {lastPredictedBreed
                  ? 'Sản phẩm và dịch vụ phù hợp cho thú cưng của bạn'
                  : 'Khám phá các sản phẩm và dịch vụ chăm sóc thú cưng tốt nhất'}
              </p>
            </div>

            {/* Suggested Services */}
            {suggestedServices.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-[#2E86AB]" />
                    <h3 className="text-xl font-semibold text-gray-900">Dịch vụ đề xuất</h3>
                  </div>
                  <Link to="/services" className="flex items-center gap-1 text-[#2E86AB] hover:underline">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedServices.map((service: any) => (
                    <Card key={service.id} padding="none" hover className="overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-[#2E86AB]/10 to-[#F18F01]/10 flex items-center justify-center">
                        {service.images?.[0]?.imageUrl ? (
                          <img src={service.images[0].imageUrl} alt={service.name} className="w-full h-full object-cover" />
                        ) : (
                          <Stethoscope className="w-12 h-12 text-[#2E86AB]/50" />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{service.name}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[#2E86AB] font-bold">
                            {service.price ? formatVND(service.price) : 'Liên hệ'}
                          </span>
                          <Link to={`/booking?service=${service.id}`}>
                            <Button size="sm" variant="outline">
                              <Calendar className="w-4 h-4 mr-1" />
                              Đặt lịch
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Products */}
            {suggestedProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-[#F18F01]" />
                    <h3 className="text-xl font-semibold text-gray-900">Sản phẩm đề xuất</h3>
                  </div>
                  <Link to="/products" className="flex items-center gap-1 text-[#F18F01] hover:underline">
                    Xem tất cả <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestedProducts.map((product: any) => (
                    <Card key={product.id} padding="none" hover className="overflow-hidden">
                      <div className="h-32 bg-gray-100 flex items-center justify-center">
                        {product.images?.[0]?.imageUrl ? (
                          <img src={product.images[0].imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-12 h-12 text-gray-300" />
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h4>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.shortDescription || product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[#F18F01] font-bold">
                            {product.price ? formatVND(product.price) : 'Liên hệ'}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stockQuantity <= 0}
                          >
                            <ShoppingBag className="w-4 h-4 mr-1" />
                            Mua
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DogBreedPrediction
