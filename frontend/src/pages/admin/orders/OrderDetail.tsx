import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button, Card, Loading } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { Order } from '@/types'
import { formatVND } from '@/utils'
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  Check,
  X,
  ShoppingBag,
  FileText,
  Clock,
  ChevronRight,
  Home
} from 'lucide-react'
import toast from 'react-hot-toast'

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await adminService.getOrder(id!)
      setOrder(response)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast.error('Không thể tải thông tin đơn hàng')
      navigate('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    if (!order) return

    const toastId = toast.loading('Đang cập nhật trạng thái...')

    try {
      await adminService.updateOrderStatus(order.id, newStatus)
      toast.success('Cập nhật trạng thái thành công!', { id: toastId })
      fetchOrder()
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'processing': return 'Đang xử lý'
      case 'shipped': return 'Đang giao hàng'
      case 'delivered': return 'Đã giao hàng'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
        <Link to="/admin/orders">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    )
  }

  const items = order.orderItems || order.items || []

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/dashboard" className="hover:text-[#2E86AB] flex items-center gap-1">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/admin/orders" className="hover:text-[#2E86AB]">
          Đơn hàng
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">#{order.orderNumber || order.id.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Đơn hàng #{order.orderNumber || order.id.slice(0, 8)}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  {items.length} sản phẩm
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/admin/orders">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>

            {order.status === 'pending' && (
              <Button onClick={() => handleUpdateStatus('processing')}>
                <Check className="w-4 h-4 mr-2" />
                Xác nhận đơn
              </Button>
            )}

            {order.status === 'processing' && (
              <Button onClick={() => handleUpdateStatus('shipped')}>
                <Truck className="w-4 h-4 mr-2" />
                Giao hàng
              </Button>
            )}

            {order.status === 'shipped' && (
              <Button variant="success" onClick={() => handleUpdateStatus('delivered')}>
                <Check className="w-4 h-4 mr-2" />
                Hoàn thành
              </Button>
            )}

            {(order.status === 'pending' || order.status === 'processing') && (
              <Button variant="danger" onClick={() => handleUpdateStatus('cancelled')}>
                <X className="w-4 h-4 mr-2" />
                Hủy đơn
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sản phẩm đặt hàng</h2>
              <span className="text-sm text-gray-500">({items.length} sản phẩm)</span>
            </div>

            <div className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const itemPrice = item.price || item.unitPrice || 0
                const productImage = item.productImage ||
                  (item.product?.images && item.product.images.length > 0
                    ? (typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0] as any)?.imageUrl)
                    : null)

                return (
                  <div key={index} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={item.product?.name || item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.product?.name || item.productName || 'Sản phẩm'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {item.productSku || item.product?.sku || 'N/A'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-600">
                            <span>{formatVND(itemPrice)}</span>
                            <span className="mx-2">×</span>
                            <span>{item.quantity}</span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatVND(itemPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Order Timeline */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Lịch sử đơn hàng</h2>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                </div>
                <div className="pb-4">
                  <p className="font-medium text-gray-900">Đơn hàng được tạo</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {order.status !== 'pending' && order.status !== 'cancelled' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">Đơn hàng đang được xử lý</p>
                    <p className="text-sm text-gray-500">Đơn hàng đã được xác nhận và đang chuẩn bị</p>
                  </div>
                </div>
              )}

              {(order.status === 'shipped' || order.status === 'delivered') && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-gray-900">Đang giao hàng</p>
                    <p className="text-sm text-gray-500">Đơn hàng đang trên đường giao đến khách hàng</p>
                  </div>
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đã giao hàng thành công</p>
                    <p className="text-sm text-gray-500">Đơn hàng đã được giao đến khách hàng</p>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Đơn hàng đã bị hủy</p>
                    <p className="text-sm text-gray-500">Đơn hàng đã được hủy bỏ</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Thông tin khách hàng</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {order.user?.profile?.name || 'Khách hàng'}
                  </p>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.user?.email || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{order.user?.profile?.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Địa chỉ giao hàng</h2>
            </div>

            <div className="text-gray-600">
              {typeof order.shippingAddress === 'string'
                ? order.shippingAddress || 'Chưa cập nhật'
                : (order.shippingAddress as any)?.address || 'Chưa cập nhật'
              }
            </div>
          </Card>

          {/* Payment Summary */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Thanh toán</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính</span>
                <span className="text-gray-900">{formatVND(order.subtotal || order.totalAmount)}</span>
              </div>

              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatVND(order.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span className="text-gray-900">{formatVND(order.shippingFee || 0)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-xl text-green-600">{formatVND(order.totalAmount)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phương thức</span>
                  <span className="text-gray-900">
                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
                      order.paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' :
                        order.paymentMethod || 'COD'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Ghi chú</h2>
              </div>
              <p className="text-gray-600">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
