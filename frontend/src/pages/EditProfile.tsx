import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input, Loading } from '@/components/common'
import { profileService } from '@/services'
import type { UserProfile, UpdateProfileData } from '@/services/profile.service'
import { ArrowLeft, Save, User, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EditProfile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileData>({
    email: '',
    name: '',
    phone: '',
    address: '',
    avatarUrl: '',
    dateOfBirth: '',
    gender: undefined,
    bio: '',
    city: '',
    country: '',
    postalCode: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const userProfile = await profileService.getProfile()
      setProfile(userProfile)

      // Populate form data
      const profileData = userProfile.profile || {}
      setFormData({
        email: userProfile.email || '',
        name: profileData.name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        avatarUrl: profileData.avatarUrl || '',
        dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        gender: profileData.gender || undefined,
        bio: profileData.bio || '',
        city: profileData.city || '',
        country: profileData.country || '',
        postalCode: profileData.postalCode || '',
      })
    } catch (error: any) {
      console.error('Failed to fetch profile:', error)
      toast.error('Không thể tải thông tin cá nhân')
      navigate('/profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      toast.error('Vui lòng nhập họ và tên')
      return
    }

    if (!formData.email?.trim()) {
      toast.error('Vui lòng nhập địa chỉ email')
      return
    }

    setSaving(true)
    try {
      // Prepare update data - only send non-empty values
      const updateData: UpdateProfileData = {}
      
      if (formData.email !== profile?.email) updateData.email = formData.email
      if (formData.name?.trim()) updateData.name = formData.name.trim()
      if (formData.phone?.trim()) updateData.phone = formData.phone.trim()
      if (formData.address?.trim()) updateData.address = formData.address.trim()
      if (formData.avatarUrl?.trim()) updateData.avatarUrl = formData.avatarUrl.trim()
      if (formData.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth
      if (formData.gender) updateData.gender = formData.gender
      if (formData.bio?.trim()) updateData.bio = formData.bio.trim()
      if (formData.city?.trim()) updateData.city = formData.city.trim()
      if (formData.country?.trim()) updateData.country = formData.country.trim()
      if (formData.postalCode?.trim()) updateData.postalCode = formData.postalCode.trim()

      await profileService.updateProfile(updateData)
      toast.success('Cập nhật thông tin thành công!')
      navigate('/profile')
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const clearAvatar = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa thông tin cá nhân</h1>
              <p className="text-gray-600 mt-1">Cập nhật thông tin cá nhân và liên hệ của bạn</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <Card padding="lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ảnh đại diện</h3>
              
              <div className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-4">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar preview"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={clearAvatar}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Input
                    value={formData.avatarUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    placeholder="URL ảnh đại diện..."
                  />
                  
                  <p className="text-xs text-gray-500">
                    Nhập URL ảnh từ internet hoặc upload lên dịch vụ lưu trữ ảnh
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card padding="lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <Input
                    value={formData.name || ''}
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
                    value={formData.email || ''}
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
                    value={formData.phone || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Nhập địa chỉ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố
                  </label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Nhập thành phố..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quốc gia
                  </label>
                  <Input
                    value={formData.country || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Nhập quốc gia..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã bưu chính
                  </label>
                  <Input
                    value={formData.postalCode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Nhập mã bưu chính..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Viết vài dòng giới thiệu về bản thân..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  />
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link to="/profile">
                <Button variant="outline" disabled={saving}>
                  Hủy
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loading size="sm" />
                    <span className="ml-2">Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfile