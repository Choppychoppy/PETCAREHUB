import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Card, PetLoading } from '@/components/common'
import { authService } from '@/services'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      const response = await authService.login(formData)
      console.log('Login successful:', response)

      // Nếu có returnUrl thì redirect về đó, nếu không thì redirect theo role
      if (returnUrl) {
        navigate(returnUrl)
      } else {
        authService.redirectAfterLogin()
      }
    } catch (err: any) {
      // Tài khoản chưa xác minh email -> chuyển sang trang nhập OTP và gửi lại mã
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        try {
          await authService.resendOtp(formData.email)
        } catch {
          // Bỏ qua lỗi gửi lại mã, vẫn cho người dùng vào trang nhập OTP
        }
        const params = new URLSearchParams({ email: formData.email })
        if (returnUrl) params.set('returnUrl', returnUrl)
        navigate(`/auth/verify-otp?${params.toString()}`)
        return
      }
      setError(err.response?.data?.message || 'Đăng nhập thất bại')
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
            Chào mừng bạn quay trở lại
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
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email của bạn"
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />

            <div className="flex items-center justify-between">
              <Link 
                to="/auth/forgot-password"
                className="text-sm text-[#2E86AB] hover:text-[#245a7a] transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Đăng nhập
            </Button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Chưa có tài khoản?{' '}
                <Link
                  to={returnUrl ? `/auth/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth/register'}
                  className="text-[#2E86AB] hover:text-[#245a7a] font-medium transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
            <PetLoading text="Đang đăng nhập..." />
          </div>
        )}
      </div>
    </div>
  )
}