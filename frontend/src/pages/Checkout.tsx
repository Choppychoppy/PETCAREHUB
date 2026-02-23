import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, Loading } from '@/components/common'
import { useCart } from '@/contexts/CartContext'
import { userService, authService, publicService } from '@/services'
import { formatVND } from '@/utils'
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Shield,
  Tag,
  CheckCircle,
  AlertCircle,
  X,
  Percent,
  Gift,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DiscountInfo {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
}

// Vietnam provinces API types
interface Province {
  code: number
  name: string
  districts?: District[]
}

interface District {
  code: number
  name: string
  wards?: Ward[]
}

interface Ward {
  code: number
  name: string
}

const Checkout = () => {
  const navigate = useNavigate()
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Vietnam provinces data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    notes: '',
    paymentMethod: 'cod',
    discountCode: ''
  })

  // Discount state
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountError, setDiscountError] = useState('')

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để thanh toán')
      navigate('/auth/login')
      return
    }

    // Check if cart is empty
    if (items.length === 0 && !orderSuccess) {
      toast.error('Giỏ hàng trống')
      navigate('/cart')
      return
    }

    // Fetch user profile to pre-fill form
    fetchUserProfile()
    // Fetch provinces
    fetchProvinces()
  }, [])

  // Fetch provinces from Vietnam API
  const fetchProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const response = await fetch('https://provinces.open-api.vn/api/p/')
      const data = await response.json()
      setProvinces(data)
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    } finally {
      setLoadingProvinces(false)
    }
  }

  // Fetch districts when province is selected
  const fetchDistricts = async (provinceCode: string) => {
    if (!provinceCode) {
      setDistricts([])
      return
    }
    setLoadingDistricts(true)
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
      const data = await response.json()
      setDistricts(data.districts || [])
    } catch (error) {
      console.error('Failed to fetch districts:', error)
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }

  // Fetch wards when district is selected
  const fetchWards = async (districtCode: string) => {
    if (!districtCode) {
      setWards([])
      return
    }
    setLoadingWards(true)
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
      const data = await response.json()
      setWards(data.wards || [])
    } catch (error) {
      console.error('Failed to fetch wards:', error)
      setWards([])
    } finally {
      setLoadingWards(false)
    }
  }

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const province = provinces.find(p => p.code.toString() === code)
    setFormData(prev => ({
      ...prev,
      provinceCode: code,
      provinceName: province?.name || '',
      districtCode: '',
      districtName: '',
      wardCode: '',
      wardName: ''
    }))
    setDistricts([])
    setWards([])
    if (code) {
      fetchDistricts(code)
    }
  }

  // Handle district change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const district = districts.find(d => d.code.toString() === code)
    setFormData(prev => ({
      ...prev,
      districtCode: code,
      districtName: district?.name || '',
      wardCode: '',
      wardName: ''
    }))
    setWards([])
    if (code) {
      fetchWards(code)
    }
  }

  // Handle ward change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const ward = wards.find(w => w.code.toString() === code)
    setFormData(prev => ({
      ...prev,
      wardCode: code,
      wardName: ward?.name || ''
    }))
  }

  const fetchUserProfile = async () => {
    try {
      const profile = await userService.getProfile()
      setUserProfile(profile)

      // Pre-fill form with user data
      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || '',
          address: profile.address || ''
        }))
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear discount error when user types new code
    if (name === 'discountCode') {
      setDiscountError('')
    }
  }

  const calculateDiscount = (discountData: DiscountInfo, orderTotal: number): number => {
    let discount = 0

    if (discountData.type === 'percentage') {
      discount = (orderTotal * discountData.value) / 100
      // Apply max discount limit if exists
      if (discountData.maxDiscountAmount && discount > discountData.maxDiscountAmount) {
        discount = discountData.maxDiscountAmount
      }
    } else {
      // fixed_amount
      discount = discountData.value
    }

    // Discount cannot exceed order total
    return Math.min(discount, orderTotal)
  }

  const handleApplyDiscount = async () => {
    const code = formData.discountCode.trim().toUpperCase()

    if (!code) {
      setDiscountError('Vui lòng nhập mã giảm giá')
      return
    }

    setValidatingDiscount(true)
    setDiscountError('')

    const response = await publicService.validateDiscountCode(code, totalPrice)

    if (response.valid && response.discountCode) {
      // Check min order amount
      if (response.discountCode.minOrderAmount && totalPrice < response.discountCode.minOrderAmount) {
        setDiscountError(`Đơn hàng tối thiểu ${formatVND(response.discountCode.minOrderAmount)} để áp dụng mã này`)
        setValidatingDiscount(false)
        return
      }

      const calculatedDiscount = response.discountAmount || calculateDiscount(response.discountCode, totalPrice)

      setDiscountInfo(response.discountCode)
      setDiscountAmount(calculatedDiscount)
      setDiscountApplied(true)
      setFormData(prev => ({ ...prev, discountCode: code }))
      toast.success(`Áp dụng mã "${code}" thành công! Giảm ${formatVND(calculatedDiscount)}`)
    } else {
      setDiscountError(response.message || 'Mã giảm giá không hợp lệ')
    }

    setValidatingDiscount(false)
  }

  const handleRemoveDiscount = () => {
    setDiscountApplied(false)
    setDiscountInfo(null)
    setDiscountAmount(0)
    setFormData(prev => ({ ...prev, discountCode: '' }))
    setDiscountError('')
    toast.success('Đã xóa mã giảm giá')
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return false
    }
    if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ')
      return false
    }
    if (!formData.provinceCode) {
      toast.error('Vui lòng chọn Tỉnh/Thành phố')
      return false
    }
    if (!formData.districtCode) {
      toast.error('Vui lòng chọn Quận/Huyện')
      return false
    }
    if (!formData.wardCode) {
      toast.error('Vui lòng chọn Phường/Xã')
      return false
    }
    return true
  }

  const handleSubmitOrder = async () => {
    if (!validateForm()) return

    setLoading(true)
    const toastId = toast.loading('Đang xử lý đơn hàng...')

    try {
      // Build full shipping address
      const shippingAddress = [
        formData.address,
        formData.wardName,
        formData.districtName,
        formData.provinceName
      ].filter(Boolean).join(', ')

      const checkoutData = {
        shippingAddress,
        paymentMethod: formData.paymentMethod,
        discountCode: discountApplied ? formData.discountCode : undefined,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          imageUrl: item.imageUrl
        })),
        subtotal: totalPrice,
        discountAmount: discountAmount,
        shippingFee: shippingFee,
        totalAmount: finalTotal
      }

      const order = await userService.checkout(checkoutData)

      // If VNPay payment, redirect to VNPay
      if (formData.paymentMethod === 'vnpay' && order.vnpayUrl) {
        toast.success('Đang chuyển đến VNPay...', { id: toastId })
        clearCart()
        // Redirect to VNPay payment page
        window.location.href = order.vnpayUrl
        return
      }

      // COD payment - show success
      toast.success('Đặt hàng thành công!', { id: toastId })
      setOrderId(order.id || 'ORD-' + Date.now())
      setOrderSuccess(true)
      clearCart()
    } catch (error: any) {
      console.error('Checkout failed:', error)
      const errorMessage = error?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Calculate fees
  const shippingFee = totalPrice >= 500000 ? 0 : 30000
  const finalTotal = totalPrice - discountAmount + shippingFee

  // Order success screen
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card padding="lg" className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Mã đơn hàng</p>
              <p className="text-lg font-bold text-emerald-600">{orderId}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Thông tin đơn hàng:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Người nhận:</strong> {formData.fullName}</p>
                <p><strong>SĐT:</strong> {formData.phone}</p>
                <p><strong>Địa chỉ:</strong> {[formData.address, formData.wardName, formData.districtName, formData.provinceName].filter(Boolean).join(', ')}</p>
                <p><strong>Phương thức thanh toán:</strong> {
                  formData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                  formData.paymentMethod === 'vnpay' ? 'VNPay' : formData.paymentMethod
                }</p>
                <p className="pt-2 text-base"><strong>Tổng thanh toán:</strong> <span className="text-emerald-600 font-bold">{formatVND(finalTotal)}</span></p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/orders">
                <Button className="bg-emerald-500 hover:bg-emerald-600">
                  Xem đơn hàng
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline">
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/cart')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại giỏ hàng
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-gray-900">Thông tin giao hàng</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0901234567"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.provinceCode}
                      onChange={handleProvinceChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white"
                      disabled={loadingProvinces}
                    >
                      <option value="">-- Chọn Tỉnh/Thành phố --</option>
                      {provinces.map(province => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    {loadingProvinces && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Loading size="sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.districtCode}
                      onChange={handleDistrictChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!formData.provinceCode || loadingDistricts}
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map(district => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    {loadingDistricts && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Loading size="sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phường/Xã <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.wardCode}
                      onChange={handleWardChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!formData.districtCode || loadingWards}
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map(ward => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    {loadingWards && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <Loading size="sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-gray-900">Phương thức thanh toán</h2>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
                  </div>
                  <Truck className="w-6 h-6 text-gray-400" />
                </label>

                <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'vnpay' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={formData.paymentMethod === 'vnpay'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Thanh toán VNPay</div>
                    <div className="text-sm text-gray-500">Thanh toán qua cổng VNPay (ATM, Visa, MasterCard, QR Code)</div>
                  </div>
                  <div className="w-10 h-6 bg-[#0066b3] rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VN</span>
                  </div>
                </label>
              </div>

              {/* VNPay info when vnpay selected */}
              {formData.paymentMethod === 'vnpay' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Thanh toán qua VNPay:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Sau khi đặt hàng, bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất.</p>
                    <p>Hỗ trợ: Thẻ ATM nội địa, Visa, MasterCard, JCB, QR Code</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Đơn hàng ({totalItems} sản phẩm)</h2>

                {/* Cart Items Summary */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                        <p className="text-sm font-medium text-emerald-600">{formatVND(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Code Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Mã giảm giá</span>
                </div>

                {discountApplied && discountInfo ? (
                  // Show applied discount
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-700 uppercase">{discountInfo.code}</span>
                          <p className="text-xs text-emerald-600">{discountInfo.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveDiscount}
                        className="p-1 hover:bg-emerald-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-emerald-700">
                      {discountInfo.type === 'percentage' ? (
                        <>
                          <Percent className="w-3 h-3" />
                          <span>Giảm {discountInfo.value}%</span>
                          {discountInfo.maxDiscountAmount && (
                            <span className="text-xs text-emerald-600">(tối đa {formatVND(discountInfo.maxDiscountAmount)})</span>
                          )}
                        </>
                      ) : (
                        <span>Giảm {formatVND(discountInfo.value)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  // Show discount input
                  <div className="space-y-2">
                    <Input
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={handleInputChange}
                      placeholder="Nhập mã giảm giá"
                      className="w-full uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyDiscount()
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount || !formData.discountCode.trim()}
                      className="w-full"
                    >
                      {validatingDiscount ? (
                        <Loading size="sm" />
                      ) : (
                        'Áp dụng mã giảm giá'
                      )}
                    </Button>
                    {discountError && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {discountError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatVND(totalPrice)}</span>
                </div>

                {discountApplied && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Giảm giá
                    </span>
                    <span className="text-emerald-600 font-medium">-{formatVND(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className={shippingFee === 0 ? 'text-emerald-600 font-medium' : ''}>
                    {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                  </span>
                </div>

                {shippingFee > 0 && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Miễn phí vận chuyển cho đơn hàng từ {formatVND(500000)}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-emerald-600">{formatVND(finalTotal)}</span>
                  </div>
                  {discountApplied && (
                    <p className="text-xs text-emerald-600 text-right mt-1">
                      Bạn tiết kiệm được {formatVND(discountAmount)}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 mt-4"
                  onClick={handleSubmitOrder}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đặt hàng ({formatVND(finalTotal)})
                    </>
                  )}
                </Button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Bảo mật</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>Giao hàng nhanh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Đảm bảo</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
