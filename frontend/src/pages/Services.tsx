import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Loading } from '@/components/common'
import { publicService } from '@/services'
import { formatVND } from '@/utils'
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight,
  Clock,
  MapPin,
  Star,
  MessageSquare,
  Stethoscope,
  Scissors,
  Shield,
  Microscope,
  Heart,
  Zap,
  PawPrint,
  ChevronRight,
  Home,
  Package,
  ShoppingCart
} from 'lucide-react'
import toast from 'react-hot-toast'

const Services = () => {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  // Debounced search - trigger API call after 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch services when filters change
  useEffect(() => {
    fetchServices(1) // Reset to page 1 when filters change
  }, [searchQuery, selectedCategory, priceRange])

  const fetchServices = async (page = pagination.page) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = {
        page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        isActive: 'true' // Only get active services
      }

      // Add price range filters
      if (priceRange === 'low') {
        params.maxPrice = 200000
      } else if (priceRange === 'medium') {
        params.minPrice = 200000
        params.maxPrice = 500000
      } else if (priceRange === 'high') {
        params.minPrice = 500000
      }

      const response = await publicService.getServices(params)
      
      // Handle flexible response format from backend
      let servicesData = []
      let paginationData = { page: 1, limit: 12, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Paginated response with data and meta
          servicesData = response.data
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          // Direct array response
          servicesData = response
          paginationData.total = response.length
        }
      }
      
      setServices(servicesData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Không thể tải danh sách dịch vụ')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await publicService.getCategories()
      const categoriesData = response.data || response || []
      setCategories(categoriesData.filter(cat => cat.type === 'service'))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    fetchServices(page)
  }

  const handleSearchInput = (query) => {
    setSearchInput(query)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedCategory('all')
    setPriceRange('all')
  }

  const getServiceIcon = (categoryName) => {
    const iconMap = {
      'Khám sức khỏe': Stethoscope,
      'Grooming': Scissors,
      'Tiêm phòng': Shield,
      'Phẫu thuật': Microscope,
      'Spa': Heart,
      'Chăm sóc răng': Zap
    }
    return iconMap[categoryName] || PawPrint
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600">Đang tải dịch vụ...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50/20 overflow-x-hidden relative">
      {/* Animated Background Icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Icons */}
        <div className="absolute top-20 left-10 text-emerald-200/40 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <Heart className="w-6 h-6" />
        </div>
        <div className="absolute top-32 right-20 text-blue-200/40 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <Stethoscope className="w-8 h-8" />
        </div>
        <div className="absolute top-48 left-1/4 text-emerald-200/30 animate-pulse" style={{ animationDelay: '2s', animationDuration: '2s' }}>
          <Calendar className="w-5 h-5" />
        </div>
        <div className="absolute top-64 right-1/3 text-amber-200/40 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <Scissors className="w-7 h-7" />
        </div>
        <div className="absolute bottom-40 left-16 text-emerald-200/40 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
          <Shield className="w-4 h-4" />
        </div>
        <div className="absolute bottom-56 right-16 text-blue-200/30 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '4s' }}>
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-1/3 text-emerald-200/40 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '3s' }}>
          <PawPrint className="w-5 h-5" />
        </div>
        <div className="absolute top-80 right-10 text-amber-200/30 animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '3.2s' }}>
          <Heart className="w-6 h-6" />
        </div>
        
        {/* Floating Particles */}
        <div className="absolute top-16 right-1/4 text-emerald-100/50 animate-ping" style={{ animationDelay: '2s', animationDuration: '4s' }}>
          <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
        </div>
        <div className="absolute bottom-20 left-1/5 text-blue-100/50 animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
        </div>
        <div className="absolute top-40 left-1/2 text-amber-100/50 animate-ping" style={{ animationDelay: '1s', animationDuration: '5s' }}>
          <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
        </div>
      </div>

      {/* Breadcrumb */}
      <section className="bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link 
              to="/" 
              className="flex items-center text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Home className="w-4 h-4 mr-1" />
              Trang chủ
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Dịch vụ</span>
          </nav>
        </div>
      </section>
      {/* Search & Filters */}
      <section className="py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchInput}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-3">
                {/* Category Filter */}
                <div className="min-w-0 sm:w-40 lg:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="all">Danh mục</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Filter */}
                <div className="min-w-0 sm:w-40 lg:w-48">
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="all">Khoảng giá</option>
                    <option value="low">Dưới 200K</option>
                    <option value="medium">200K - 500K</option>
                    <option value="high">Trên 500K</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-gray-900 font-medium">
                Tìm thấy <span className="text-emerald-600 font-bold">{pagination.total}</span> dịch vụ
                  {pagination.totalPages > 1 && (
                    <span className="text-gray-500 text-sm ml-2">
                      (Trang {pagination.page}/{pagination.totalPages})
                    </span>
                  )}
                </p>
                {(searchQuery || selectedCategory !== 'all' || priceRange !== 'all') && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Services Grid - Clean & Elegant */}
      <section className="pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {services.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, index) => {
                const IconComponent = getServiceIcon(categories.find(c => c.id === service.categoryId)?.name)
                
                return (
                  <div key={service.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300 p-6">
                    {/* Icon and Category */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 font-medium">
                          {categories.find(c => c.id === service.categoryId)?.name || 'Dịch vụ'}
                        </span>
                      </div>
                    </div>

                    {/* Service Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {/* Service Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration || '60'}min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Tại chỗ</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {service.price ? formatVND(service.price) : 'Liên hệ'}
                          </div>
                          {service.originalPrice && service.originalPrice > service.price && (
                            <div className="text-sm text-gray-400 line-through">
                              {formatVND(service.originalPrice)}
                            </div>
                          )}
                        </div>
                        {service.price && service.originalPrice && service.originalPrice > service.price && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                            Giảm giá
                          </span>
                        )}
                      </div>
                      
                      <Link to={`/services/${service.id}`} className="block">
                        <Button className="w-full bg-[#2E86AB] hover:bg-[#236a8a] text-white">
                          Xem chi tiết
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <nav className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2"
                    >
                      Trước
                    </Button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 ${
                          page === pagination.page 
                            ? "bg-[#2E86AB] text-white" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2"
                    >
                      Sau
                    </Button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Không tìm thấy dịch vụ
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Không có dịch vụ nào phù hợp với tiêu chí tìm kiếm của bạn
              </p>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Colorful but Elegant */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-green-50/50 to-orange-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/60">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2E86AB] to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cần tư vấn thêm?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Đội ngũ chuyên gia của chúng tôi sẵn sàng tư vấn dịch vụ phù hợp nhất cho thú cưng của bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-gradient-to-r from-[#2E86AB] to-green-500 hover:from-[#235a7a] hover:to-green-600 text-white shadow-lg">
                  Liên hệ tư vấn
                </Button>
              </Link>
              <Link to="/booking">
                <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-white bg-white/50">
                  Đặt lịch hẹn
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services