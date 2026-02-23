import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Modal, Loading, EmptyState } from '@/components/common'
import { userService } from '@/services'
import { formatVND } from '@/utils'
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  Eye,
  RefreshCw,
  MapPin,
  Phone,
  User,
  CreditCard,
  Calendar,
  Tag,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  productName: string
  productSku: string
  productImage?: string
  product?: {
    id: string
    name: string
    images?: { imageUrl: string }[]
  }
}

interface Order {
  id: string
  orderNumber: string
  subtotal: number
  taxAmount: number
  shippingAmount: number
  discountAmount: number
  totalAmount: number
  status: string
  paymentStatus: string
  paymentMethod: string
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  } | string
  trackingNumber?: string
  carrier?: string
  notes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: {
    label: 'Chờ xử lý',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  processing: {
    label: 'Đang xử lý',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Package
  },
  shipped: {
    label: 'Đang giao hàng',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Truck
  },
  delivered: {
    label: 'Đã giao hàng',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle
  }
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, pagination.page])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await userService.getOrders(params)

      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          setOrders(response.data)
          if ('meta' in response) {
            setPagination(prev => ({
              ...prev,
              total: response.meta?.total || 0,
              totalPages: response.meta?.totalPages || 0
            }))
          }
        } else if (Array.isArray(response)) {
          setOrders(response)
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const handleReorder = async (orderId: string) => {
    const toastId = toast.loading('Đang thêm vào giỏ hàng...')
    try {
      await userService.reorder(orderId)
      toast.success('Đã thêm sản phẩm vào giỏ hàng!', { id: toastId })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đặt lại đơn hàng', { id: toastId })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
              <p className="text-gray-600">Theo dõi và quản lý đơn hàng</p>
            </div>
            <Link to="/products">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </Card>

        {/* Status Filter */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-2 p-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Tất cả
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(key)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<ShoppingBag className="w-16 h-16 text-gray-300" />}
              title="Chưa có đơn hàng"
              description="Bạn chưa có đơn hàng nào. Hãy mua sắm để nhận nhiều ưu đãi."
              action={
                <Link to="/products">
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    Mua sắm ngay
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Đơn hàng: <span className="font-medium text-gray-900">#{order.id.slice(0, 8)}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    {order.items?.slice(0, 2).map((item, index) => {
                      const productName = item.product?.name || item.productName || 'Sản phẩm'
                      const productImage = item.product?.images?.[0]?.imageUrl || item.productImage

                      return (
                        <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {productName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              SL: {item.quantity} × {formatVND(item.unitPrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatVND(item.totalPrice || item.quantity * item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {order.items && order.items.length > 2 && (
                      <p className="text-sm text-gray-500 py-2">
                        +{order.items.length - 2} sản phẩm khác
                      </p>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Tổng tiền: </span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatVND(order.totalAmount)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </Button>
                      {order.status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Mua lại
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              Trước
            </Button>
            <span className="px-4 py-2 text-gray-600">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Order Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Chi tiết đơn hàng #${selectedOrder?.id.slice(0, 8)}`}
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trạng thái</span>
                {(() => {
                  const status = statusConfig[selectedOrder.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  )
                })()}
              </div>

              {/* Shipping Address */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Địa chỉ giao hàng
                </h4>
                {typeof selectedOrder.shippingAddress === 'object' ? (
                  <div className="space-y-2 ml-7">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedOrder.shippingAddress.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedOrder.shippingAddress.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-700">
                        {selectedOrder.shippingAddress.address}
                        {selectedOrder.shippingAddress.city && `, ${selectedOrder.shippingAddress.city}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 ml-7">{selectedOrder.shippingAddress}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" />
                  Sản phẩm ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => {
                    const productName = item.product?.name || item.productName || 'Sản phẩm'
                    const productImage = item.product?.images?.[0]?.imageUrl || item.productImage

                    return (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-14 h-14 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{productName}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} × {formatVND(item.unitPrice)}
                          </p>
                          {item.productSku && (
                            <p className="text-xs text-gray-400">SKU: {item.productSku}</p>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{formatVND(item.totalPrice || item.quantity * item.unitPrice)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{formatVND(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Giảm giá
                    </span>
                    <span className="text-red-500">-{formatVND(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  {selectedOrder.shippingAmount > 0 ? (
                    <span>{formatVND(selectedOrder.shippingAmount)}</span>
                  ) : (
                    <span className="text-emerald-600">Miễn phí</span>
                  )}
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-emerald-600">{formatVND(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment & Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Phương thức thanh toán
                  </span>
                  <span className="font-medium">
                    {selectedOrder.paymentMethod === 'cod' && 'Thanh toán khi nhận hàng'}
                    {selectedOrder.paymentMethod === 'vnpay' && 'VNPay'}
                    {!['cod', 'vnpay'].includes(selectedOrder.paymentMethod) && selectedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày đặt hàng
                  </span>
                  <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                {selectedOrder.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Mã vận đơn
                    </span>
                    <span className="font-medium text-blue-600">{selectedOrder.trackingNumber}</span>
                  </div>
                )}
                {selectedOrder.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-600 flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4" />
                      Ghi chú
                    </span>
                    <p className="text-gray-700 text-sm ml-6">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default Orders
