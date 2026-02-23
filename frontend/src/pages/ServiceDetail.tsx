import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button, Card, Loading, Modal, Input } from '@/components/common'
import { publicService, authService, userService } from '@/services'
import { formatVND, formatDiscountPercentage } from '@/utils'
import { 
  ArrowLeft,
  Calendar, 
  Clock,
  MapPin,
  Star,
  Shield,
  Award,
  CheckCircle,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  Users,
  Stethoscope,
  Scissors,
  Microscope,
  Zap,
  PawPrint,
  ChevronRight,
  Home,
  Package,
  ShoppingCart,
  X,
  User,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

const ServiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [category, setCategory] = useState(null)
  const [relatedServices, setRelatedServices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    petId: '',
    notes: '',
    specialRequests: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchServiceDetail()
    }
  }, [id])

  const fetchServiceDetail = async () => {
    try {
      setLoading(true)
      const response = await publicService.getService(id)
      const serviceData = response.data || response
      setService(serviceData)

      // Fetch category info
      if (serviceData.categoryId) {
        const categoryResponse = await publicService.getCategories()
        const categories = categoryResponse.data || categoryResponse || []
        const serviceCategory = categories.find(cat => cat.id === serviceData.categoryId)
        setCategory(serviceCategory)
        
        // Fetch related services
        const servicesResponse = await publicService.getServices()
        const allServices = servicesResponse.data || servicesResponse || []
        const related = allServices
          .filter(s => s.categoryId === serviceData.categoryId && s.id !== serviceData.id)
          .slice(0, 3)
        setRelatedServices(related)
      }
    } catch (error) {
      console.error('Failed to fetch service detail:', error)
      toast.error('Không thể tải thông tin dịch vụ')
      navigate('/services')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service.name,
        text: service.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép link!')
    }
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

  // Handle booking form
  const handleBookingInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()

    // Check if user is logged in using authService
    if (!authService.isAuthenticated()) {
      toast.error('Vui lòng đăng nhập để đặt lịch hẹn')
      navigate('/auth/login')
      return
    }

    if (!bookingData.appointmentDate || !bookingData.appointmentTime) {
      toast.error('Vui lòng chọn ngày và giờ hẹn')
      return
    }

    const toastId = toast.loading('Đang đặt lịch hẹn...')
    setBookingLoading(true)

    try {
      // Combine date and time
      const dateTime = new Date(`${bookingData.appointmentDate}T${bookingData.appointmentTime}:00`)
      
      // Extract duration - handle both string ("60 phút") and number (60) formats
      let durationMinutes = 60
      if (service?.duration) {
        if (typeof service.duration === 'number') {
          durationMinutes = service.duration
        } else if (typeof service.duration === 'string') {
          const parsed = parseInt(service.duration.replace(/\D/g, ''))
          if (!isNaN(parsed)) durationMinutes = parsed
        }
      }

      const appointmentPayload = {
        serviceId: id,
        appointmentDate: dateTime.toISOString(),
        dateTime: dateTime.toISOString(),
        duration: durationMinutes,
        price: service?.price || 0,
        notes: bookingData.notes || undefined,
        specialRequests: bookingData.specialRequests || undefined,
        petId: bookingData.petId || undefined
      }

      // Call the real appointment API
      await userService.createAppointment(appointmentPayload)
      
      toast.success('Đặt lịch hẹn thành công!', { id: toastId })
      setShowBookingModal(false)
      setBookingData({
        appointmentDate: '',
        appointmentTime: '',
        petId: '',
        notes: '',
        specialRequests: ''
      })
      
    } catch (error) {
      console.error('Failed to book appointment:', error)
      toast.error('Có lỗi xảy ra khi đặt lịch hẹn', { id: toastId })
    } finally {
      setBookingLoading(false)
    }
  }

  const openBookingModal = () => {
    // Set default date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0]
    
    setBookingData(prev => ({
      ...prev,
      appointmentDate: defaultDate
    }))
    
    setShowBookingModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Không tìm thấy dịch vụ</h2>
          <Link to="/services">
            <Button>Quay lại danh sách dịch vụ</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-600 hover:text-[#2E86AB] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/services" className="text-gray-600 hover:text-[#2E86AB] transition-colors">
              Dịch vụ
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-[#2E86AB] font-medium line-clamp-1">{service.name}</span>
          </nav>
        </div>
      </section>

      {/* Service Detail */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Service Info - 8 columns */}
            <div className="lg:col-span-8 space-y-6">
              {/* Hero Section */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                {category && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const IconComponent = getServiceIcon(category?.name)
                        return <IconComponent className="w-5 h-5 text-[#2E86AB]" />
                      })()}
                    </div>
                    <span className="px-3 py-1.5 bg-blue-50 text-[#2E86AB] text-sm font-semibold rounded-full">
                      {category.name}
                    </span>
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">{service.name}</h1>

                {/* Rating & Reviews */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 text-[#F18F01]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-base font-semibold text-gray-900">4.8</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">120 đánh giá</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-[#2E86AB] font-medium">Được yêu thích</span>
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="text-3xl sm:text-4xl font-bold text-[#2E86AB]">
                    {service.price ? formatVND(service.price) : 'Liên hệ'}
                  </div>
                  {service.comparePrice && service.comparePrice > service.price && (
                    <>
                      <div className="text-xl text-gray-400 line-through">
                        {formatVND(service.comparePrice)}
                      </div>
                      <div className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                        {formatDiscountPercentage(service.comparePrice, service.price)} OFF
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-gray-700 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Service Features */}
              <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#2E86AB]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Đặc điểm dịch vụ</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-[#2E86AB]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-500 mb-0.5">Thời gian</div>
                      <div className="text-base font-semibold text-gray-900">{service.duration || '60 phút'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-[#2E86AB]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-500 mb-0.5">Phù hợp</div>
                      <div className="text-base font-semibold text-gray-900">Tất cả thú cưng</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#2E86AB]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-500 mb-0.5">Bảo hiểm</div>
                      <div className="text-base font-semibold text-gray-900">Có bảo hiểm</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-[#2E86AB]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-500 mb-0.5">Chuyên gia</div>
                      <div className="text-base font-semibold text-gray-900">Bác sĩ kinh nghiệm</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Sidebar - 4 columns */}
            <div className="lg:col-span-4">
              {/* Booking Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:sticky lg:top-6">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#2E86AB] rounded-lg flex items-center justify-center mx-auto mb-3">
                    {(() => {
                      const IconComponent = getServiceIcon(category?.name)
                      return <IconComponent className="w-7 h-7 text-white" />
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Đặt lịch hẹn</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{category?.name}</p>
                </div>

                {/* Price Display */}
                <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#2E86AB] mb-1">
                    {service.price ? formatVND(service.price) : 'Liên hệ'}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{service.duration || '60 phút'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={openBookingModal}
                    className="w-full bg-[#2E86AB] hover:bg-[#236a8a] text-white py-3 rounded-lg font-semibold"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Đặt lịch ngay
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/contact" className="block">
                      <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg text-sm">
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        Tư vấn
                      </Button>
                    </Link>
                    <Button
                      onClick={() => window.location.href = 'tel:19001234'}
                      className="w-full bg-[#F18F01] hover:bg-[#d97e01] text-white py-2.5 rounded-lg border-0 text-sm font-semibold"
                    >
                      <Phone className="w-4 h-4 mr-1.5" />
                      Gọi ngay
                    </Button>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#2E86AB]" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Bảo hiểm</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-[#2E86AB]" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Chuyên gia</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-[#2E86AB]" />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">Yêu thích</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Đặt lịch hẹn dịch vụ"
        size="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-5">
          {/* Service Info Header */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {(() => {
                const IconComponent = getServiceIcon(category?.name)
                return <IconComponent className="w-6 h-6 text-[#2E86AB]" />
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 line-clamp-1">{service?.name}</div>
              <div className="text-[#2E86AB] font-medium text-sm">
                {service?.price ? formatVND(service.price) : 'Liên hệ'}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service?.duration || '60 phút'}</span>
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Chọn ngày <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={bookingData.appointmentDate}
                onChange={(e) => handleBookingInputChange('appointmentDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Chọn giờ <span className="text-red-500">*</span>
              </label>
              <select
                value={bookingData.appointmentTime}
                onChange={(e) => handleBookingInputChange('appointmentTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] bg-white"
                required
              >
                <option value="">Chọn giờ hẹn</option>
                <option value="08:00">08:00 AM</option>
                <option value="08:30">08:30 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="09:30">09:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="14:30">02:30 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="15:30">03:30 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="16:30">04:30 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Ghi chú
            </label>
            <textarea
              value={bookingData.notes}
              onChange={(e) => handleBookingInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] resize-none"
              placeholder="Mô tả tình trạng thú cưng, yêu cầu đặc biệt..."
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 text-gray-500" />
              Yêu cầu đặc biệt
            </label>
            <textarea
              value={bookingData.specialRequests}
              onChange={(e) => handleBookingInputChange('specialRequests', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] resize-none"
              placeholder="Ví dụ: Thú cưng hay cắn, cần nhẹ nhang..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookingModal(false)}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5"
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={bookingLoading}
              className="flex-1 bg-[#2E86AB] hover:bg-[#236a8a] text-white py-2.5 font-semibold"
            >
              {bookingLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang đặt lịch...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Xác nhận đặt lịch
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ServiceDetail