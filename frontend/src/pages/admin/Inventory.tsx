import { useState, useEffect, useCallback } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services'
import type { Product, PaginatedResponse } from '@/types'
import { formatVND } from '@/utils'
import { Package, AlertTriangle, Plus, Minus, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface InventoryItem extends Product {
  availableStock: number
  reservedStock: number
  lowStockThreshold: number
}

export default function Inventory() {
  // State management
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Modal states
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  
  // Form data
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: 'add' as 'add' | 'subtract',
    reason: ''
  })

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Load inventory data
  const fetchInventory = async (page = 1, search = '', filter = 'all') => {
    try {
      setLoading(true)
      
      // Sử dụng getProducts từ adminService để lấy inventory
      let params: any = {
        page,
        limit: pagination.limit,
        search
      }

      const response = await adminService.getProducts(params)

      let itemData: InventoryItem[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Transform products to inventory items
          itemData = response.data.map((product: Product) => ({
            ...product,
            availableStock: product.stockQuantity || 0,
            reservedStock: 0, // Có thể lấy từ pending orders
            // Dùng ngưỡng tồn kho thấp thực tế của từng sản phẩm (cột lowStockThreshold trong DB)
            lowStockThreshold: (product as any).lowStockThreshold ?? 10
          }))
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          itemData = response.map((product: Product) => ({
            ...product,
            availableStock: product.stockQuantity || 0,
            reservedStock: 0,
            lowStockThreshold: (product as any).lowStockThreshold ?? 10
          }))
        }
      }

      // Apply frontend filtering
      if (filter === 'low-stock') {
        itemData = itemData.filter(item => item.availableStock <= item.lowStockThreshold && item.availableStock > 0)
      } else if (filter === 'out-of-stock') {
        itemData = itemData.filter(item => item.availableStock === 0)
      } else if (filter === 'in-stock') {
        itemData = itemData.filter(item => item.availableStock > item.lowStockThreshold)
      }

      setInventory(itemData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch when search or filter changes
  useEffect(() => {
    fetchInventory(1, searchQuery, filterStatus)
  }, [searchQuery, filterStatus])

  // Initial load
  useEffect(() => {
    fetchInventory()
  }, [])

  // Pagination handler
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    fetchInventory(page, searchQuery, filterStatus)
  }

  // Handle stock adjustment modal
  const handleStockAdjustment = (product: InventoryItem) => {
    setSelectedProduct(product)
    setStockAdjustment({
      quantity: 0,
      type: 'add',
      reason: ''
    })
    setShowStockModal(true)
  }

  // Submit stock adjustment
  const handleSubmitStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct) return

    const toastId = toast.loading('Đang cập nhật kho...')
    
    try {
      const finalQuantity = stockAdjustment.type === 'add' 
        ? selectedProduct.availableStock + stockAdjustment.quantity
        : selectedProduct.availableStock - stockAdjustment.quantity

      if (finalQuantity < 0) {
        toast.error('Không thể giảm số lượng âm!', { id: toastId })
        return
      }

      await adminService.updateStock(selectedProduct.id, finalQuantity)
      
      toast.success('Cập nhật kho thành công!', { id: toastId })
      setShowStockModal(false)
      setSelectedProduct(null)
      fetchInventory(pagination.page, searchQuery, filterStatus)
    } catch (error: any) {
      console.error('Failed to update stock:', error)
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi cập nhật kho!'
      toast.error(errorMessage, { id: toastId })
    }
  }

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.availableStock === 0) return { status: 'out-of-stock', label: 'Hết hàng', color: 'bg-red-100 text-red-800' }
    if (item.availableStock <= item.lowStockThreshold) return { status: 'low-stock', label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'in-stock', label: 'Còn hàng', color: 'bg-green-100 text-green-800' }
  }

  // Table columns
  const columns = [
    {
      key: 'product',
      label: 'Sản phẩm',
      render: (value: any, item: InventoryItem) => (
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-gray-500" />
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Danh mục',
      render: (value: any, item: InventoryItem) => (
        <span className="text-sm text-gray-600">
          {item.category?.name || 'Chưa phân loại'}
        </span>
      )
    },
    {
      key: 'availableStock',
      label: 'Tồn kho',
      render: (value: number, item: InventoryItem) => {
        const stockStatus = getStockStatus(item)
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{value}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
            {stockStatus.status === 'low-stock' && (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        )
      }
    },
    {
      key: 'price',
      label: 'Giá',
      render: (value: number) => (
        <span className="font-medium text-[#2E86AB]">
          {formatVND(value)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, item: InventoryItem) => (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handleStockAdjustment(item)}
        >
          Điều chỉnh
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý kho</h1>
            <p className="text-gray-600">Theo dõi và quản lý tồn kho sản phẩm</p>
          </div>
          <Button onClick={() => fetchInventory(pagination.page, searchQuery, filterStatus)}>
            🔄 Làm mới
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              📦
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng sản phẩm</p>
              <p className="text-xl font-bold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              ⚠️
            </div>
            <div>
              <p className="text-sm text-gray-600">Sắp hết hàng</p>
              <p className="text-xl font-bold text-yellow-600">
                {inventory.filter(item => getStockStatus(item).status === 'low-stock').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              🚫
            </div>
            <div>
              <p className="text-sm text-gray-600">Hết hàng</p>
              <p className="text-xl font-bold text-red-600">
                {inventory.filter(item => getStockStatus(item).status === 'out-of-stock').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
            <div>
              <p className="text-sm text-gray-600">Còn hàng</p>
              <p className="text-xl font-bold text-green-600">
                {inventory.filter(item => getStockStatus(item).status === 'in-stock').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Lọc theo trạng thái</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'in-stock' ? 'primary' : 'outline'}
            onClick={() => setFilterStatus('in-stock')}
          >
            Còn hàng
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'low-stock' ? 'primary' : 'outline'}
            onClick={() => setFilterStatus('low-stock')}
          >
            Sắp hết
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'out-of-stock' ? 'primary' : 'outline'}
            onClick={() => setFilterStatus('out-of-stock')}
          >
            Hết hàng
          </Button>
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm sản phẩm</h3>
        </div>
        <Input
          placeholder="Tìm theo tên sản phẩm, SKU..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Inventory Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-6">
            <Loading text="Đang tải dữ liệu kho..." />
          </div>
        ) : inventory.length > 0 ? (
          <Table
            columns={columns}
            data={inventory}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Không tìm thấy sản phẩm"
              description={searchQuery ? `Không có sản phẩm nào khớp với "${searchQuery}"` : 'Chưa có sản phẩm trong kho'}
              action={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              }
            />
          </div>
        )}
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title="Điều chỉnh tồn kho"
        size="md"
      >
        {selectedProduct && (
          <form onSubmit={handleSubmitStockAdjustment}>
            <div className="space-y-4">
              {/* Product info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-600">Tồn kho hiện tại: {selectedProduct.availableStock}</p>
              </div>

              {/* Adjustment type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại điều chỉnh
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="add"
                      checked={stockAdjustment.type === 'add'}
                      onChange={() => setStockAdjustment(prev => ({ ...prev, type: 'add' }))}
                      className="mr-2"
                    />
                    <Plus className="w-4 h-4 mr-1 text-green-600" />
                    Nhập thêm
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="subtract"
                      checked={stockAdjustment.type === 'subtract'}
                      onChange={() => setStockAdjustment(prev => ({ ...prev, type: 'subtract' }))}
                      className="mr-2"
                    />
                    <Minus className="w-4 h-4 mr-1 text-red-600" />
                    Xuất kho
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do điều chỉnh
                </label>
                <textarea
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  placeholder="Nhập lý do điều chỉnh kho..."
                />
              </div>

              {/* Preview */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Sau khi điều chỉnh: {' '}
                  <span className="font-bold">
                    {stockAdjustment.type === 'add' 
                      ? selectedProduct.availableStock + stockAdjustment.quantity
                      : selectedProduct.availableStock - stockAdjustment.quantity
                    } sản phẩm
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowStockModal(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
                Xác nhận điều chỉnh
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}