import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Card, Loading } from '@/components/common'
import { formatVND } from '@/utils'
import { CheckCircle, XCircle, ShoppingBag, FileText, AlertCircle } from 'lucide-react'

interface PaymentResult {
  success: boolean
  message: string
  orderId?: string
  amount?: number
  transactionNo?: string
  responseCode?: string
}

const VNPayReturn = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<PaymentResult | null>(null)

  useEffect(() => {
    verifyPayment()
  }, [])

  const verifyPayment = async () => {
    try {
      // Get all query params from VNPay redirect
      const params = Object.fromEntries(searchParams.entries())

      // Call backend to verify
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/vnpay-return?${new URLSearchParams(params)}`
      )
      const data = await response.json()

      setResult(data)
    } catch (error) {
      console.error('Failed to verify payment:', error)
      setResult({
        success: false,
        message: 'Không thể xác minh thanh toán. Vui lòng liên hệ hỗ trợ.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">Đang xác minh thanh toán...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card padding="lg" className="text-center">
          {result?.success ? (
            <>
              {/* Success */}
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
              <p className="text-gray-600 mb-6">
                Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.
              </p>

              {/* Order Info */}
              <div className="bg-emerald-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-emerald-900 mb-3">Thông tin thanh toán:</h3>
                <div className="text-sm text-emerald-800 space-y-2">
                  {result.orderId && (
                    <p className="flex justify-between">
                      <span>Mã đơn hàng:</span>
                      <span className="font-medium">{result.orderId.slice(0, 8)}...</span>
                    </p>
                  )}
                  {result.amount && (
                    <p className="flex justify-between">
                      <span>Số tiền:</span>
                      <span className="font-bold text-emerald-600">{formatVND(result.amount)}</span>
                    </p>
                  )}
                  {result.transactionNo && (
                    <p className="flex justify-between">
                      <span>Mã giao dịch VNPay:</span>
                      <span className="font-medium">{result.transactionNo}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span>Trạng thái:</span>
                    <span className="font-medium text-emerald-600">{result.message}</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Failed */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán không thành công</h1>
              <p className="text-gray-600 mb-6">{result?.message}</p>

              {/* Error Info */}
              <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Lý do: {result?.message}</p>
                    {result?.responseCode && (
                      <p>Mã lỗi: {result.responseCode}</p>
                    )}
                    {result?.orderId && (
                      <p>Mã đơn hàng: {result.orderId.slice(0, 8)}...</p>
                    )}
                    <p className="mt-2">
                      Đơn hàng của bạn đã được tạo nhưng chưa được thanh toán.
                      Bạn có thể thử thanh toán lại hoặc chọn phương thức khác.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders">
              <Button className={result?.success ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                <FileText className="w-4 h-4 mr-2" />
                Xem đơn hàng
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default VNPayReturn
