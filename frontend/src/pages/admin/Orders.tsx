import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { Order } from '@/types'
import { formatVND } from '@/utils'
import {
  Search,
  Filter,
  Package,
  DollarSign,
  User,
  Calendar,
  Eye,
  Truck,
  Check,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchOrders = async (page = 1, search = '', status = 'all', dateFrom = '', dateTo = '') => {
    try {
      setLoading(true)
      const params: any = { 
        page, 
        limit: pagination.limit
      }
      
      if (search) params.search = search
      if (status !== 'all') params.status = status
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const response = await adminService.getOrders({
        page: params.page,
        limit: params.limit,
        status: params.status,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        search: params.search
      })

      let orderData: Order[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          orderData = response.data
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          orderData = response
        }
      }
      
      setOrders(orderData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchOrders(1, '', statusFilter, dateFilter.from, dateFilter.to)
  }, [statusFilter, dateFilter])

  useEffect(() => {
    fetchOrders(1, searchQuery, statusFilter, dateFilter.from, dateFilter.to)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchOrders(page, searchQuery, statusFilter, dateFilter.from, dateFilter.to)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
  }

  const handleDateFilterChange = (type: 'from' | 'to', value: string) => {
    setDateFilter(prev => ({ ...prev, [type]: value }))
  }

  const handleViewDetails = (order: Order) => {
    navigate(`/admin/orders/${order.id}`)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const toastId = toast.loading('Đang cập nhật trạng thái...')
    
    try {
      await adminService.updateOrderStatus(orderId, newStatus)
      toast.success('Cập nhật trạng thái thành công!', { id: toastId })
      fetchOrders(pagination.page, searchQuery, statusFilter, dateFilter.from, dateFilter.to)
    } catch (error: any) {
      console.error('Failed to update order status:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi cập nhật trạng thái!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'processing': return 'Đang xử lý'
      case 'shipped': return 'Đã giao hàng'
      case 'delivered': return 'Đã nhận hàng'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const columns = [
    {
      key: 'orderInfo',
      label: 'Thông tin đơn hàng',
      render: (value: any, order: Order) => {
        if (!order) return ''
        return (
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium text-gray-900">#{order.orderNumber || order.id}</div>
              <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      render: (value: any, order: Order) => {
        if (!order) return ''
        return (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">
                {order.user?.profile?.name || order.user?.email || 'Khách hàng'}
              </div>
              <div className="text-sm text-gray-500">{order.user?.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'items',
      label: 'Sản phẩm',
      render: (value: any, order: Order) => {
        const items = order?.orderItems || order?.items || []
        if (!items.length) return '0 sản phẩm'
        return (
          <div>
            <div className="font-medium text-gray-900">{items.length} sản phẩm</div>
            <div className="text-sm text-gray-500">
              {items.slice(0, 2).map(item => item.product?.name || item.productName).join(', ')}
              {items.length > 2 && `... +${items.length - 2}`}
            </div>
          </div>
        )
      }
    },
    {
      key: 'total',
      label: 'Tổng tiền',
      render: (value: any, order: Order) => {
        if (!order) return ''
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">{formatVND(order.totalAmount)}</span>
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, order: Order) => {
        if (!order) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, order: Order) => {
        if (!order) return null
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleViewDetails(order)
              }}
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
              Chi tiết
            </Button>
            
            {order.status === 'pending' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'processing'); }}
                title="Xử lý đơn hàng"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}

            {order.status === 'processing' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'shipped'); }}
                title="Giao hàng"
              >
                <Truck className="w-4 h-4" />
              </Button>
            )}

            {order.status === 'shipped' && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'delivered'); }}
                title="Hoàn thành"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}

            {(order.status === 'pending' || order.status === 'processing') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'cancelled'); }}
                title="Hủy đơn"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo trạng thái</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'processing', label: 'Đang xử lý' },
              { value: 'shipped', label: 'Đã giao' },
              { value: 'delivered', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Đã hủy' }
            ].map((status) => {
              const isActive = statusFilter === status.value
              return (
                <Button
                  key={status.value}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(status.value)}
                >
                  {status.label}
                </Button>
              )
            })}
          </div>
        </Card>

        {/* Date Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo ngày</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dateFilter.from}
              onChange={(e) => handleDateFilterChange('from', e.target.value)}
              placeholder="Từ ngày"
            />
            <Input
              type="date"
              value={dateFilter.to}
              onChange={(e) => handleDateFilterChange('to', e.target.value)}
              placeholder="Đến ngày"
            />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
        </div>
        <Input
          placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng hoặc email..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Orders Table */}
      <Card padding="none">
        {orders.length > 0 ? (
          <Table
            columns={columns}
            data={orders}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có đơn hàng nào"
              description="Chưa có đơn hàng hoặc không có kết quả phù hợp với bộ lọc"
              action={null}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default Orders