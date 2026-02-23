import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, Button, Loading } from '@/components/common'
import { profileService } from '@/services'
import type { UserProfile } from '@/services/profile.service'
import { User, Mail, Phone, MapPin, Calendar, Edit3, Shield, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const Profile = () => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const baseRoute = isAdminRoute ? '/admin/profile' : '/profile'

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const profile = await profileService.getProfile()
      setProfile(profile)
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      toast.error('Không thể tải thông tin cá nhân')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male': return 'Nam'
      case 'female': return 'Nữ'
      case 'other': return 'Khác'
      default: return 'Chưa cập nhật'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'staff': return 'Nhân viên'
      case 'user': return 'Khách hàng'
      default: return role
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Hoạt động</span>
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Tạm dừng</span>
      case 'banned':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Bị cấm</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card padding="lg">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải thông tin</h2>
            <p className="text-gray-600 mb-4">Đã có lỗi xảy ra khi tải thông tin cá nhân</p>
            <Button onClick={fetchProfile}>Thử lại</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông tin cá nhân</h1>
              <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và cài đặt tài khoản của bạn</p>
            </div>
            <div className="flex gap-3">
              <Link to={`${baseRoute}/edit`}>
                <Button>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
              </Link>
              <Link to={`${baseRoute}/change-password`}>
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card padding="lg">
              <div className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-4">
                  {profile.profile?.avatarUrl ? (
                    <img
                      src={profile.profile.avatarUrl}
                      alt={profile.profile?.name || 'Avatar'}
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {profile.profile?.name || 'Chưa cập nhật'}
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">{getRoleText(profile.role)}</span>
                  <span className="text-gray-400">•</span>
                  {getStatusBadge(profile.status)}
                </div>

                {profile.profile?.bio && (
                  <p className="text-sm text-gray-600 mb-4">{profile.profile.bio}</p>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Tham gia {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Thông tin liên hệ</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                >
                  {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showSensitiveInfo ? 'Ẩn' : 'Hiện'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">
                      {showSensitiveInfo ? profile.email : '***@***.***'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Số điện thoại</p>
                    <p className="text-sm text-gray-600">
                      {profile.profile?.phone 
                        ? (showSensitiveInfo ? profile.profile.phone : '***-***-****')
                        : 'Chưa cập nhật'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                    <p className="text-sm text-gray-600">
                      {profile.profile?.address || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card padding="lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">Ngày sinh</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(profile.profile?.dateOfBirth)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Giới tính</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {getGenderText(profile.profile?.gender)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Thành phố</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.profile?.city || 'Chưa cập nhật'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Quốc gia</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.profile?.country || 'Chưa cập nhật'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Mã bưu chính</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.profile?.postalCode || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Account Information */}
            <Card padding="lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin tài khoản</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email đã xác thực</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.emailVerified ? (
                      <span className="text-green-600">✓ Đã xác thực</span>
                    ) : (
                      <span className="text-orange-600">⚠ Chưa xác thực</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Lần đăng nhập cuối</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(profile.lastLoginAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Ngày tạo tài khoản</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Cập nhật lần cuối</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile