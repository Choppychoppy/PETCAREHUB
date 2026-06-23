import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import { Plus, Search, Filter, Package, Edit, Trash2, AlertTriangle, DollarSign, Archive, Eye, Star, Image } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  price: number
  comparePrice?: number
  sku: string
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  stock?: number
  stockQuantity?: number
  minStock?: number
  lowStockThreshold?: number
  maxStock?: number
  status: 'active' | 'inactive' | 'draft'
  isActive: boolean
  isFeatured: boolean
  categoryId: string
  category?: {
    id: string
    name: string
    type: string
  }
  images?: Array<string | { id: string; imageUrl: string; altText?: string; sortOrder?: number; isPrimary?: boolean }>
  variants?: any[]
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

const Products = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [minStock, setMinStock] = useState<string>('')
  const [maxStock, setMaxStock] = useState<string>('')

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  // Debounced price filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, searchQuery, categoryFilter, statusFilter, minPrice, maxPrice, minStock, maxStock)
    }, 500)

    return () => clearTimeout(timer)
  }, [minPrice, maxPrice, minStock, maxStock])

  useEffect(() => {
    fetchProducts(1, searchQuery, categoryFilter, statusFilter, minPrice, maxPrice, minStock, maxStock)
  }, [categoryFilter, statusFilter])

  useEffect(() => {
    fetchProducts(1, searchQuery, categoryFilter, statusFilter, minPrice, maxPrice, minStock, maxStock)
  }, [searchQuery])

  const fetchProducts = async (page = 1, search = '', category = '', status = '', priceMin = '', priceMax = '', stockMin = '', stockMax = '') => {
    try {
      setLoading(true)
      const params: any = { page, limit: pagination.limit }

      if (search) params.search = search
      if (category) params.categoryId = category
      if (status) params.status = status

      // Price filter
      if (priceMin && !isNaN(Number(priceMin))) {
        params.minPrice = Number(priceMin)
      }
      if (priceMax && !isNaN(Number(priceMax))) {
        params.maxPrice = Number(priceMax)
      }

      // Stock quantity range filter
      if (stockMin && !isNaN(Number(stockMin))) {
        params.minStockQuantity = Number(stockMin)
      }
      if (stockMax && !isNaN(Number(stockMax))) {
        params.maxStockQuantity = Number(stockMax)
      }

      const response = await adminService.getProducts(params)

      // Handle flexible response format
      let productData: Product[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Paginated response with data and meta
          productData = response.data
          
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
          productData = response
        }
      }
      
      setProducts(productData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    navigate('/admin/products/create')
  }

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedProduct) return
    
    const toastId = toast.loading('Đang ẩn sản phẩm...')

    try {
      await adminService.deleteProduct(selectedProduct.id)
      toast.success('Đã ẩn sản phẩm khỏi cửa hàng!', { id: toastId })
      fetchProducts(pagination.page, searchQuery, categoryFilter, statusFilter, minPrice, maxPrice, minStock, maxStock)
    } catch (error: any) {
      console.error('Failed to delete product:', error)

      // Extract error message from API response
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi ẩn sản phẩm!'

      toast.error(errorMessage, { id: toastId })
    } finally {
      // Luôn đóng popup xác nhận sau khi có thông báo (thành công hay lỗi)
      setShowDeleteModal(false)
      setSelectedProduct(null)
    }
  }

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchProducts(page, searchQuery, categoryFilter, statusFilter, minPrice, maxPrice, minStock, maxStock)
  }

  const resetFilters = () => {
    setCategoryFilter('')
    setStatusFilter('')
    setMinPrice('')
    setMaxPrice('')
    setMinStock('')
    setMaxStock('')
    setSearchQuery('')
    setSearchInput('')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      active: 'Hoạt động',
      inactive: 'Tạm dừng', 
      draft: 'Bản nháp'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: 'Hết hàng', color: 'text-red-600' }
    if (stock <= minStock) return { label: 'Sắp hết', color: 'text-orange-600' }
    return { label: 'Còn hàng', color: 'text-green-600' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const columns = [
    {
      key: 'name',
      title: 'Sản phẩm',
      render: (value: string, product: Product) => (
        <div className="flex items-center gap-3">
          {product.images && product.images.length > 0 ? (
            <div className="relative">
              <img 
                src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].imageUrl} 
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling!.classList.remove('hidden')
                }}
              />
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center hidden">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              {product.images.length > 1 && (
                <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  +{product.images.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {product.name}
            </div>
            {product.category?.name && (
              <div className="text-sm text-blue-600 truncate mb-1">
                {product.category.name}
              </div>
            )}
            {product.shortDescription && (
              <div className="text-xs text-gray-500 truncate max-w-xs mb-2">
                {product.shortDescription}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                SKU: {product.sku}
              </span>
              {product.isFeatured && (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  <Star className="w-3 h-3" />
                  Nổi bật
                </span>
              )}
              {product.weight && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {product.weight}kg
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Giá & Kho',
      render: (value: number, product: Product) => {
        const stock = product.stockQuantity ?? product.stock ?? 0
        const minStock = product.lowStockThreshold ?? product.minStock ?? 5
        const stockStatus = getStockStatus(stock, minStock)
        return (
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-[#2E86AB] text-lg">
                {formatPrice(product.price)}
              </div>
              {product.comparePrice && product.comparePrice > product.price && (
                <div className="text-sm text-gray-500 line-through">
                  {formatPrice(product.comparePrice)}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {stock} sản phẩm
              </div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                stockStatus.label === 'Hết hàng' ? 'bg-red-100 text-red-700' :
                stockStatus.label === 'Sắp hết' ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {stockStatus.label}
              </span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'status',
      title: 'Trạng thái & Thông tin',
      render: (value: string, product: Product) => (
        <div className="space-y-2">
          {getStatusBadge(product.isActive ? 'active' : 'inactive')}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Tạo: {formatDate(product.createdAt)}</div>
            <div>Cập nhật: {formatDate(product.updatedAt)}</div>
            {(product.lowStockThreshold || product.minStock) && (
              <div className="text-orange-600">
                Min: {product.lowStockThreshold || product.minStock} sp
              </div>
            )}
            {product.maxStock && (
              <div className="text-blue-600">
                Max: {product.maxStock} sp
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (value: any, product: Product) => (
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(product)}
            className="w-full"
          >
            <Edit className="w-4 h-4 mr-1" />
            Sửa
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(product)}
            className="text-red-600 hover:bg-red-50 w-full"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Xóa
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-600">Tạo và quản lý sản phẩm trong cửa hàng</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Tạo sản phẩm mới
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Archive className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Trạng thái</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: '', label: 'Tất cả' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Tạm dừng' },
              { value: 'draft', label: 'Bản nháp' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={statusFilter === option.value}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Stock Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Tồn kho</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Số lượng từ</label>
              <Input
                type="number"
                placeholder="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                min="0"
              />
              <label className="block text-xs text-gray-500">Đến</label>
              <Input
                type="number"
                placeholder="Không giới hạn"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </Card>

        {/* Price Range */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Khoảng giá</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Từ (VNĐ)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đến (VNĐ)</label>
              <Input
                type="number"
                placeholder="Không giới hạn"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="max-w-md"
            />
            {(statusFilter || searchQuery || minPrice || maxPrice || minStock || maxStock) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loading size="lg" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Chưa có sản phẩm nào"
            description="Bắt đầu thêm sản phẩm đầu tiên vào cửa hàng của bạn"
            action={
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo sản phẩm mới
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden">
            <Table 
              columns={columns} 
              data={products}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận ẩn sản phẩm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn ẩn sản phẩm "{selectedProduct?.name}"?
          </p>
          <p className="text-sm text-gray-500">
            Sản phẩm sẽ được chuyển sang trạng thái ngừng bán và không hiển thị ngoài cửa hàng. Bạn có thể bật lại bất cứ lúc nào.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Products