import { useState, useEffect } from 'react'
import { Button, Card, Input, Loading } from '@/components/common'
import { adminService } from '@/services/admin.service'
import { 
  Settings as SettingsIcon,
  Store,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Bell,
  Database,
  Save,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  
  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    taxRate: 0,
    description: ''
  })

  // Business Hours
  const [businessHours, setBusinessHours] = useState([
    { day: 'monday', openTime: '08:00', closeTime: '18:00', isClosed: false },
    { day: 'tuesday', openTime: '08:00', closeTime: '18:00', isClosed: false },
    { day: 'wednesday', openTime: '08:00', closeTime: '18:00', isClosed: false },
    { day: 'thursday', openTime: '08:00', closeTime: '18:00', isClosed: false },
    { day: 'friday', openTime: '08:00', closeTime: '18:00', isClosed: false },
    { day: 'saturday', openTime: '08:00', closeTime: '16:00', isClosed: false },
    { day: 'sunday', openTime: '09:00', closeTime: '15:00', isClosed: false }
  ])


  const fetchSettings = async () => {
    try {
      setLoading(true)

      // Try to fetch settings from API, but handle 404 gracefully
      try {
        const [settings, hours] = await Promise.all([
          adminService.getSettings(),
          adminService.getBusinessHours()
        ])

        setBusinessSettings({
          businessName: settings.businessName || '',
          businessAddress: settings.businessAddress || '',
          businessPhone: settings.businessPhone || '',
          businessEmail: settings.businessEmail || '',
          currency: settings.currency || 'VND',
          timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
          taxRate: settings.taxRate || 0,
          description: settings.description || ''
        })

        if (hours && Array.isArray(hours)) {
          setBusinessHours(hours)
        }
      } catch (apiError: any) {
        // If API endpoints don't exist (404), use default values silently
        if (apiError?.response?.status === 404) {
          console.log('Settings API not implemented yet, using default values')
        } else {
          throw apiError
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Không thể tải cài đặt hệ thống')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveBusinessSettings = async () => {
    // Validation for required fields
    if (!businessSettings.businessName.trim()) {
      toast.error('Vui lòng nhập tên doanh nghiệp')
      return
    }

    if (!businessSettings.businessEmail.trim()) {
      toast.error('Vui lòng nhập email doanh nghiệp')
      return
    }

    if (!businessSettings.businessPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại doanh nghiệp')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(businessSettings.businessEmail)) {
      toast.error('Email không đúng định dạng')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Đang lưu cài đặt doanh nghiệp...')

    try {
      await adminService.updateSettings(businessSettings)
      toast.success('Lưu cài đặt doanh nghiệp thành công!', { id: toastId })
    } catch (error: any) {
      console.error('Failed to save business settings:', error)
      // If API not implemented (404), show friendly message
      if (error?.response?.status === 404) {
        toast.error('Chức năng lưu cài đặt đang được phát triển', { id: toastId })
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra!'
        toast.error(errorMessage, { id: toastId })
      }
    } finally {
      setSaving(false)
    }
  }

  const saveBusinessHours = async () => {
    setSaving(true)
    const toastId = toast.loading('Đang lưu giờ làm việc...')

    try {
      // Wrap business hours in the format expected by backend
      await adminService.updateBusinessHours({ hours: businessHours })
      toast.success('Lưu giờ làm việc thành công!', { id: toastId })
    } catch (error: any) {
      console.error('Failed to save business hours:', error)
      // If API not implemented (404), show friendly message
      if (error?.response?.status === 404) {
        toast.error('Chức năng lưu giờ làm việc đang được phát triển', { id: toastId })
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra!'
        toast.error(errorMessage, { id: toastId })
      }
    } finally {
      setSaving(false)
    }
  }


  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      monday: 'Thứ 2',
      tuesday: 'Thứ 3',
      wednesday: 'Thứ 4',
      thursday: 'Thứ 5',
      friday: 'Thứ 6',
      saturday: 'Thứ 7',
      sunday: 'Chủ nhật'
    }
    return days[day] || day
  }

  const updateBusinessHour = (index: number, field: string, value: any) => {
    const updatedHours = [...businessHours]
    updatedHours[index] = { ...updatedHours[index], [field]: value }
    setBusinessHours(updatedHours)
  }

  const tabs = [
    { id: 'business', label: 'Thông tin doanh nghiệp', icon: Store },
    { id: 'hours', label: 'Giờ làm việc', icon: Clock }
  ]

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
            <p className="text-gray-600">Quản lý cấu hình và thiết lập hệ thống</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tải lại
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Business Settings */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Store className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Thông tin doanh nghiệp</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên doanh nghiệp *
                  </label>
                  <Input
                    value={businessSettings.businessName}
                    onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                    placeholder="VD: PetCare Hub"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email liên hệ *
                  </label>
                  <Input
                    type="email"
                    value={businessSettings.businessEmail}
                    onChange={(e) => setBusinessSettings({...businessSettings, businessEmail: e.target.value})}
                    placeholder="contact@petcarehub.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <Input
                    value={businessSettings.businessPhone}
                    onChange={(e) => setBusinessSettings({...businessSettings, businessPhone: e.target.value})}
                    placeholder="+84 901 234 567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Múi giờ
                  </label>
                  <select
                    value={businessSettings.timezone}
                    onChange={(e) => setBusinessSettings({...businessSettings, timezone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  >
                    <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                    <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <Input
                    value={businessSettings.businessAddress}
                    onChange={(e) => setBusinessSettings({...businessSettings, businessAddress: e.target.value})}
                    placeholder="Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả doanh nghiệp
                  </label>
                  <textarea
                    value={businessSettings.description}
                    onChange={(e) => setBusinessSettings({...businessSettings, description: e.target.value})}
                    placeholder="Mô tả ngắn về doanh nghiệp của bạn..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveBusinessSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                </Button>
              </div>
            </div>
          )}

          {/* Business Hours */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Giờ làm việc</h3>
              </div>

              <div className="space-y-4">
                {businessHours.map((hour, index) => (
                  <div key={hour.day} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">
                      {getDayName(hour.day)}
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!hour.isClosed}
                        onChange={(e) => updateBusinessHour(index, 'isClosed', !e.target.checked)}
                        className="w-4 h-4 text-[#2E86AB] border-gray-300 rounded focus:ring-[#2E86AB]"
                      />
                      <span className="ml-2 text-sm text-gray-600">Mở cửa</span>
                    </div>

                    {!hour.isClosed ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Giờ mở cửa</label>
                          <Input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) => updateBusinessHour(index, 'openTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Giờ đóng cửa</label>
                          <Input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) => updateBusinessHour(index, 'closeTime', e.target.value)}
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          {hour.openTime} - {hour.closeTime}
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-3 text-sm text-red-600 italic">
                        Đóng cửa
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveBusinessHours} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Đang lưu...' : 'Lưu giờ làm việc'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Settings