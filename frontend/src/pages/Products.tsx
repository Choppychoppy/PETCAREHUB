import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Card, Loading } from '@/components/common'
import { publicService } from '@/services'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { formatVND, formatSavings } from '@/utils'
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  Eye,
  Package,
  Heart,
  Tag,
  Grid,
  List,
  ChevronRight,
  Home
} from 'lucide-react'
import toast from 'react-hot-toast'

// Ảnh thay thế khi ảnh sản phẩm bị lỗi/thiếu (tránh hiển thị ảnh vỡ)
const PRODUCT_FALLBACK_IMG = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop'

const Products = () => {
  const [searchParams] = useSearchParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  // Read search param from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchInput(urlSearch)
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0]?.imageUrl,
      stockQuantity: product.stockQuantity
    })
  }

  const handleToggleWishlist = (product: any) => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice,
      imageUrl: product.images?.[0]?.imageUrl,
      stockQuantity: product.stockQuantity
    })
  }

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

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(1) // Reset to page 1 when filters change
  }, [searchQuery, selectedCategory, priceRange])

  const fetchProducts = async (page = pagination.page) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = {
        page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined
      }

      // Add price range filters
      if (priceRange === 'low') {
        params.maxPrice = 500000
      } else if (priceRange === 'medium') {
        params.minPrice = 500000
        params.maxPrice = 1500000
      } else if (priceRange === 'high') {
        params.minPrice = 1500000
      }

      const response = await publicService.getProducts(params)
      
      // Handle flexible response format from backend
      let productsData = []
      let paginationData = { page: 1, limit: 12, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Paginated response with data and meta
          productsData = response.data
          
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
          productsData = response
          paginationData.total = response.length
        }
      }
      
      setProducts(productsData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Không thể tải danh sách sản phẩm')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await publicService.getCategories('product')
      const categoriesData = response.data || response || []
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
    fetchProducts(page)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
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
          <Star className="w-8 h-8" />
        </div>
        <div className="absolute top-48 left-1/4 text-emerald-200/30 animate-pulse" style={{ animationDelay: '2s', animationDuration: '2s' }}>
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div className="absolute top-64 right-1/3 text-amber-200/40 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <Package className="w-7 h-7" />
        </div>
        <div className="absolute bottom-40 left-16 text-emerald-200/40 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
          <Heart className="w-4 h-4" />
        </div>
        <div className="absolute bottom-56 right-16 text-blue-200/30 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '4s' }}>
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-1/3 text-emerald-200/40 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '3s' }}>
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div className="absolute top-80 right-10 text-amber-200/30 animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '3.2s' }}>
          <Package className="w-6 h-6" />
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
            <span className="text-gray-900 font-medium">Sản phẩm</span>
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
                    placeholder="Tìm kiếm sản phẩm..."
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
                    <option value="low">Dưới 500K</option>
                    <option value="medium">500K - 1.5M</option>
                    <option value="high">Trên 1.5M</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex-shrink-0">
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-gray-900 font-medium">
                Tìm thấy <span className="text-emerald-600 font-bold">{pagination.total}</span> sản phẩm
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

      {/* Products Grid */}
      <section className="pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto" 
                : "space-y-6 max-w-4xl mx-auto"
              }>
                {products.map((product) => (
                  <div key={product.id} className={
                    viewMode === 'grid' 
                      ? "bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group overflow-hidden"
                      : "bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 flex gap-6"
                  }>
                    {viewMode === 'grid' ? (
                      <>
                        {/* Product Image */}
                        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                          <Link to={`/products/${product.id}`} className="block w-full h-full">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PRODUCT_FALLBACK_IMG }}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-gray-300" />
                              </div>
                            )}
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.featured && (
                              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                ⭐ Nổi bật
                              </div>
                            )}
                            {product.comparePrice && product.comparePrice > product.price && (
                              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                              </div>
                            )}
                          </div>

                          {/* Quick Action Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Link to={`/products/${product.id}`}>
                              <Button className="bg-white/90 text-gray-900 hover:bg-white border-0 shadow-lg">
                                <Eye className="w-4 h-4 mr-2" />
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <div className="p-4">

                          {/* Product Name */}
                          <Link to={`/products/${product.id}`}>
                            <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight min-h-[2.5rem] hover:text-emerald-600 transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          
                          {/* Price */}
                          <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                              <div className="text-base font-bold text-emerald-600">
                                {product.price ? formatVND(product.price) : 'Liên hệ'}
                              </div>
                              {product.comparePrice && product.comparePrice > product.price && (
                                <div className="text-xs text-gray-400 line-through">
                                  {formatVND(product.comparePrice)}
                                </div>
                              )}
                            </div>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <div className="text-xs text-red-600 font-medium">
                                {formatSavings(product.comparePrice, product.price)}
                              </div>
                            )}
                          </div>

                          {/* Rating & Reviews */}
                          <div className="flex items-center gap-1 mb-3">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">4.8</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">120 đánh giá</span>
                          </div>

                          {/* Stock Status */}
                          <div className="flex items-center mb-3">
                            {product.stockQuantity > 0 ? (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-green-700">Còn {product.stockQuantity} sản phẩm</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-xs font-medium text-red-600">Hết hàng</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                              disabled={product.stockQuantity <= 0}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddToCart(product)
                              }}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Thêm vào giỏ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`px-2 border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors ${isInWishlist(product.id) ? 'bg-red-50 border-red-200' : ''}`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleToggleWishlist(product)
                              }}
                            >
                              <Heart className={`w-3 h-3 transition-colors ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* List View */}
                        <div className="w-40 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex-shrink-0 relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].imageUrl}
                              alt={product.name}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = PRODUCT_FALLBACK_IMG }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-300" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          {product.featured && (
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ⭐
                            </div>
                          )}
                          {product.comparePrice && product.comparePrice > product.price && (
                            <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                              -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-4">
                              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-2">
                                {categories.find(c => c.id === product.categoryId)?.name || 'Sản phẩm'}
                              </span>
                              <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                                {product.name}
                              </h3>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {product.price ? formatVND(product.price) : 'Liên hệ'}
                              </div>
                              {product.comparePrice && product.comparePrice > product.price && (
                                <div className="text-base text-gray-400 line-through">
                                  {formatVND(product.comparePrice)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {product.shortDescription || product.description}
                          </p>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <div className="flex text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-700 ml-1">4.8</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {product.stockQuantity > 0 ? (
                                  <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-700">Còn hàng</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-red-700">Hết hàng</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Link to={`/products/${product.id}`}>
                                <Button variant="outline" size="sm" className="border-gray-200 hover:border-gray-300">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xem chi tiết
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                                disabled={product.stockQuantity <= 0}
                                onClick={() => handleAddToCart(product)}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Thêm vào giỏ
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`px-3 border-gray-200 hover:border-red-200 hover:bg-red-50 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200' : ''}`}
                                onClick={() => handleToggleWishlist(product)}
                              >
                                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
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
                            ? "bg-emerald-500 text-white" 
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
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn
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
    </div>
  )
}

export default Products