import { useState } from 'react'
import { Card, Button, Input, Loading } from '@/components/common'
import { publicService } from '@/services'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Calendar,
  Heart,
  Shield,
  CheckCircle,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react'
import toast from 'react-hot-toast'

const Contact = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    petType: '',
    urgency: 'normal'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!formData.subject.trim()) {
      toast.error('Vui lòng nhập chủ đề tin nhắn')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Đang gửi tin nhắn...')

    try {
      const response = await publicService.submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
        petType: formData.petType || undefined,
        urgency: formData.urgency
      })

      toast.success(response.message || 'Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.', { id: toastId })
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        petType: '',
        urgency: 'normal'
      })
    } catch (error: any) {
      console.error('Failed to submit contact form:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra. Vui lòng thử lại sau.'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Phone,
      title: 'Hotline 24/7',
      content: '1900 1234',
      description: 'Hỗ trợ khẩn cấp mọi lúc',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Mail,
      title: 'Email hỗ trợ',
      content: 'support@petcarehub.com',
      description: 'Phản hồi trong 24h',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: MapPin,
      title: 'Địa chỉ phòng khám',
      content: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      description: 'Gần Đại học Bách Khoa Hà Nội',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      content: '8:00 - 22:00 (T2-CN)',
      description: 'Khẩn cấp 24/7',
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  const quickActions = [
    {
      icon: Calendar,
      title: 'Đặt lịch hẹn',
      description: 'Đặt lịch khám cho thú cưng',
      action: '/booking',
      color: 'bg-[#2E86AB]'
    },
    {
      icon: MessageSquare,
      title: 'Tư vấn trực tuyến',
      description: 'Chat với bác sĩ thú y',
      action: '/consultation',
      color: 'bg-[#F18F01]'
    },
    {
      icon: Heart,
      title: 'Chăm sóc khẩn cấp',
      description: 'Hỗ trợ 24/7 các trường hợp cấp cứu',
      action: 'tel:19001234',
      color: 'bg-red-500'
    }
  ]

  const faqs = [
    {
      question: 'Phòng khám có phục vụ 24/7 không?',
      answer: 'Chúng tôi mở cửa từ 8:00 - 22:00 hàng ngày. Tuy nhiên, chúng tôi có dịch vụ cấp cứu 24/7 cho các trường hợp khẩn cấp.'
    },
    {
      question: 'Cần chuẩn bị gì khi đưa thú cưng đến khám?',
      answer: 'Bạn nên mang theo hồ sơ vaccination (nếu có), danh sách thuốc đang sử dụng, và mô tả chi tiết tình trạng sức khỏe của thú cưng.'
    },
    {
      question: 'Có dịch vụ đón tận nhà không?',
      answer: 'Có, chúng tôi có dịch vụ đón tận nhà trong phạm vi 10km với phí phụ thu hợp lý.'
    },
    {
      question: 'Thanh toán như thế nào?',
      answer: 'Chúng tôi chấp nhận thanh toán bằng tiền mặt, thẻ ngân hàng, chuyển khoản và ví điện tử.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner with Image */}
      <section className="relative bg-gray-900 py-24 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Veterinary clinic" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gray-900/50"></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Có câu hỏi về dịch vụ hoặc cần tư vấn chăm sóc thú cưng? 
            Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng giúp đỡ.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gray-50 relative -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white">
                <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <action.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 mb-4">{action.description}</p>
                <Button 
                  size="sm" 
                  className={`${action.color} hover:opacity-90`}
                  onClick={() => {
                    if (action.action.startsWith('tel:')) {
                      window.location.href = action.action
                    } else {
                      window.location.href = action.action
                    }
                  }}
                >
                  {action.title === 'Chăm sóc khẩn cấp' ? 'Gọi ngay' : 'Bắt đầu'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card padding="lg">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Gửi tin nhắn cho chúng tôi</h2>
                  <p className="text-gray-600">
                    Điền thông tin dưới đây và chúng tôi sẽ phản hồi sớm nhất có thể.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập họ và tên..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Nhập địa chỉ email..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Nhập số điện thoại..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại thú cưng
                      </label>
                      <select
                        value={formData.petType}
                        onChange={(e) => setFormData(prev => ({ ...prev, petType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="">Chọn loại thú cưng</option>
                        <option value="dog">Chó</option>
                        <option value="cat">Mèo</option>
                        <option value="bird">Chim</option>
                        <option value="rabbit">Thỏ</option>
                        <option value="hamster">Hamster</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chủ đề
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Chủ đề tin nhắn..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ ưu tiên
                      </label>
                      <div className="flex gap-4">
                        {[
                          { value: 'low', label: 'Thấp', color: 'text-green-600' },
                          { value: 'normal', label: 'Bình thường', color: 'text-blue-600' },
                          { value: 'high', label: 'Cao', color: 'text-orange-600' },
                          { value: 'urgent', label: 'Khẩn cấp', color: 'text-red-600' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="urgency"
                              value={option.value}
                              checked={formData.urgency === option.value}
                              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                              className="text-[#2E86AB] focus:ring-[#2E86AB]"
                            />
                            <span className={`text-sm font-medium ${option.color}`}>
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung tin nhắn *
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} size="lg">
                      {loading ? (
                        <>
                          <Loading size="sm" />
                          <span className="ml-2">Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Contact Details */}
              <Card padding="lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h3>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${info.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <info.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{info.title}</h4>
                        <p className="text-gray-900 mb-1">{info.content}</p>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Social Media */}
              <Card padding="lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Kết nối với chúng tôi</h3>
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Instagram className="w-4 h-4 mr-2" />
                    Instagram
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Theo dõi fanpage để cập nhật tin tức và khuyến mãi mới nhất!
                </p>
              </Card>

              {/* Trust Indicators */}
              <Card padding="lg" className="bg-gradient-to-br from-green-50 to-blue-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Được chứng nhận</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Phòng khám được cấp phép hoạt động bởi Sở Y tế Hà Nội
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Chứng nhận ISO 9001:2015</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Câu hỏi thường gặp</h2>
            <p className="text-gray-600">
              Một số câu hỏi phổ biến từ khách hàng
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} padding="lg" className="hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Không tìm thấy câu trả lời bạn cần?</p>
            <Button variant="outline">
              <MessageSquare className="w-5 h-5 mr-2" />
              Đặt câu hỏi khác
            </Button>
          </div>
        </div>
      </section>

      {/* Map Section (Placeholder) */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tìm đường đến phòng khám</h2>
            <p className="text-gray-600">Địa chỉ: Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</p>
          </div>

          <div className="rounded-xl h-96 overflow-hidden shadow-md border border-gray-200">
            <iframe
              title="Bản đồ phòng khám PetCare Hub - Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội"
              src="https://www.google.com/maps?q=S%E1%BB%91%201%20%C4%90%E1%BA%A1i%20C%E1%BB%93%20Vi%E1%BB%87t%2C%20Hai%20B%C3%A0%20Tr%C6%B0ng%2C%20H%C3%A0%20N%E1%BB%99i&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact