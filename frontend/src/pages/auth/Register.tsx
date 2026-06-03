import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Card, PetLoading } from '@/components/common'
import { authService } from '@/services'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      setLoading(false)
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      await authService.register(registerData)

      // Đăng ký xong chưa có token: chuyển sang trang nhập OTP để xác minh email
      const params = new URLSearchParams({ email: formData.email })
      if (returnUrl) params.set('returnUrl', returnUrl)
      navigate(`/auth/verify-otp?${params.toString()}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PetCare Hub
          </h1>
          <p className="text-gray-600">
            Tạo tài khoản mới để bắt đầu
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Họ và tên"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập địa chỉ email"
              required
            />

            <Input
              label="Số điện thoại"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại (không bắt buộc)"
            />

            <Input
              label="Mật khẩu"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
              required
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Đăng ký
            </Button>

            <div className="text-center text-xs text-gray-500">
              <p>
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <Link to="/terms" className="text-[#2E86AB] hover:underline">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-[#2E86AB] hover:underline">
                  Chính sách bảo mật
                </Link>
              </p>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Đã có tài khoản?{' '}
                <Link
                  to={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth/login'}
                  className="text-[#2E86AB] hover:text-[#245a7a] font-medium transition-colors"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
            <PetLoading text="Đang tạo tài khoản..." />
          </div>
        )}
      </div>
    </div>
  )
}