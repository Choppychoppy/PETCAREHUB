import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button, Card, Loading } from '@/components/common'
import { publicService } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { formatVND, formatDiscountPercentage } from '@/utils'
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Truck,
  Shield,
  Award,
  Plus,
  Minus,
  Check,
  Tag
} from 'lucide-react'
import toast from 'react-hot-toast'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [product, setProduct] = useState<any>(null)
  const [category, setCategory] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProductDetail()
    }
  }, [id])

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const response = await publicService.getProduct(id)
      const productData = response.data || response
      setProduct(productData)

      // Fetch category info
      if (productData.categoryId) {
        const categoryResponse = await publicService.getCategories('product')
        const categories = categoryResponse.data || categoryResponse || []
        const productCategory = categories.find(cat => cat.id === productData.categoryId)
        setCategory(productCategory)
        
        // Fetch related products
        const productsResponse = await publicService.getProducts({ categoryId: productData.categoryId })
        const allProducts = productsResponse.data?.data || productsResponse.data || productsResponse || []
        const related = allProducts
          .filter(p => p.id !== productData.id)
          .slice(0, 4)
        setRelatedProducts(related)
      }
    } catch (error) {
      console.error('Failed to fetch product detail:', error)
      toast.error('Không thể tải thông tin sản phẩm')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription || product.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép link!')
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.imageUrl,
      stockQuantity: product.stockQuantity
    }, quantity)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
          <Link to="/products">
            <Button>Quay lại danh sách sản phẩm</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-emerald-600">Trang chủ</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-emerald-600">Sản phẩm</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[selectedImage]?.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                        selectedImage === index ? 'border-emerald-500' : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={image.imageUrl} 
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                {category && (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full mb-3">
                    {category.name}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.8)</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">120 đánh giá</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    {product.price ? formatVND(product.price) : 'Liên hệ'}
                  </div>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <>
                      <div className="text-xl text-gray-400 line-through">
                        {formatVND(product.comparePrice)}
                      </div>
                      <div className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                        {formatDiscountPercentage(product.comparePrice, product.price)}
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-700 leading-relaxed">
                  {product.shortDescription || product.description}
                </p>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Đặc điểm nổi bật</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stockQuantity > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Còn hàng ({product.stockQuantity} sản phẩm)</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">Hết hàng</span>
                  </>
                )}
              </div>

              {/* Quantity & Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    disabled={product.stockQuantity <= 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Thêm vào giỏ
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    disabled={product.stockQuantity <= 0}
                  >
                    Mua ngay
                  </Button>
                  <Button
                    onClick={() => toggleWishlist({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      comparePrice: product.comparePrice,
                      imageUrl: product.images?.[0]?.imageUrl,
                      stockQuantity: product.stockQuantity
                    })}
                    variant="outline"
                    className={`p-3 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="p-3"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-medium">Miễn phí vận chuyển</div>
                    <div className="text-gray-500">Đơn từ 500K</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Bảo hành chính hãng</div>
                    <div className="text-gray-500">12 tháng</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Award className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Chất lượng cam kết</div>
                    <div className="text-gray-500">100% chính hãng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mô tả chi tiết</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản phẩm liên quan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300 group">
                    <div className="aspect-square bg-gray-100 rounded-t-xl relative overflow-hidden">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img 
                          src={relatedProduct.images[0].imageUrl} 
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-600">
                          {relatedProduct.price ? formatVND(relatedProduct.price) : 'Liên hệ'}
                        </span>
                        <Link to={`/products/${relatedProduct.id}`}>
                          <Button size="sm" variant="outline">
                            Xem
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProductDetail