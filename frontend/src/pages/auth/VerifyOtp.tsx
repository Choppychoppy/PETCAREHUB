import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, PetLoading } from '@/components/common'
import { authService } from '@/services'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 // giây chờ giữa 2 lần gửi lại

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const returnUrl = searchParams.get('returnUrl')

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // Không có email -> quay lại trang đăng ký
  useEffect(() => {
    if (!email) {
      navigate('/auth/register', { replace: true })
    }
  }, [email, navigate])

  // Đếm ngược cho nút gửi lại mã
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const focusInput = (index: number) => {
    const el = inputsRef.current[index]
    if (el) el.focus()
  }

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      setDigits((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }

    // Hỗ trợ dán nhiều ký tự cùng lúc
    const chars = cleaned.split('')
    setDigits((prev) => {
      const next = [...prev]
      let cursor = index
      for (const ch of chars) {
        if (cursor >= OTP_LENGTH) break
        next[cursor] = ch
        cursor++
      }
      const nextFocus = Math.min(cursor, OTP_LENGTH - 1)
      setTimeout(() => focusInput(nextFocus), 0)
      return next
    })
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    const otp = digits.join('')
    if (otp.length !== OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số của mã xác minh')
      return
    }

    setLoading(true)
    try {
      await authService.verifyOtp(email, otp)
      // Xác minh thành công -> tự đăng nhập
      if (returnUrl) {
        navigate(returnUrl)
      } else {
        authService.redirectAfterLogin()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác minh thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await authService.resendOtp(email)
      setInfo('Đã gửi lại mã xác minh. Vui lòng kiểm tra email của bạn.')
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(''))
      focusInput(0)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi lại mã thất bại')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PetCare Hub</h1>
          <p className="text-gray-600">Xác minh tài khoản của bạn</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-600 text-sm text-center">
              Chúng tôi đã gửi mã xác minh gồm 6 chữ số tới email
              <br />
              <span className="font-medium text-gray-900">{email}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {info && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">{info}</p>
              </div>
            )}

            {/* Ô nhập OTP 6 số */}
            <div className="flex justify-center gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  aria-label={`Chữ số thứ ${index + 1} của mã xác minh`}
                />
              ))}
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Xác minh
            </Button>

            <div className="text-center text-sm text-gray-600">
              {cooldown > 0 ? (
                <p>
                  Chưa nhận được mã? Gửi lại sau{' '}
                  <span className="font-medium text-[#2E86AB]">{cooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[#2E86AB] hover:text-[#245a7a] font-medium transition-colors"
                >
                  Gửi lại mã xác minh
                </button>
              )}
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Sai email?{' '}
                <Link
                  to="/auth/register"
                  className="text-[#2E86AB] hover:text-[#245a7a] font-medium transition-colors"
                >
                  Đăng ký lại
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
            <PetLoading text="Đang xử lý..." />
          </div>
        )}
      </div>
    </div>
  )
}
