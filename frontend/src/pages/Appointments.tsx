import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Modal, Loading, EmptyState } from '@/components/common'
import { userService } from '@/services'
import { formatVND } from '@/utils'
import type { Appointment } from '@/types'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  PawPrint,
  Phone,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader
} from 'lucide-react'
import toast from 'react-hot-toast'

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircle
  },
  'in-progress': {
    label: 'Đang thực hiện',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Loader
  },
  completed: {
    label: 'Hoàn thành',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle
  }
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, pagination.page])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await userService.getAppointments(params)

      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          setAppointments(response.data)
          if ('meta' in response) {
            setPagination(prev => ({
              ...prev,
              total: response.meta?.total || 0,
              totalPages: response.meta?.totalPages || 0
            }))
          }
        } else if (Array.isArray(response)) {
          setAppointments(response)
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const confirmCancel = async () => {
    if (!selectedAppointment) return

    const toastId = toast.loading('Đang hủy lịch hẹn...')
    try {
      await userService.cancelAppointment(selectedAppointment.id, cancelReason)
      toast.success('Đã hủy lịch hẹn thành công!', { id: toastId })
      setShowCancelModal(false)
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể hủy lịch hẹn', { id: toastId })
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const canCancel = (status: string) => {
    return ['pending', 'confirmed'].includes(status)
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
              <p className="text-gray-600">Quản lý các lịch hẹn dịch vụ</p>
            </div>
            <Link to="/services">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <Calendar className="w-5 h-5 mr-2" />
                Đặt lịch mới
              </Button>
            </Link>
          </div>
        </Card>

        {/* Status Filter */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-2 p-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Tất cả
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(key)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<Calendar className="w-16 h-16 text-gray-300" />}
              title="Chưa có lịch hẹn"
              description="Bạn chưa có lịch hẹn nào. Hãy đặt lịch để sử dụng dịch vụ của chúng tôi."
              action={
                <Link to="/services">
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    Xem dịch vụ
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const status = statusConfig[appointment.status] || statusConfig.pending
              const StatusIcon = status.icon
              const { date, time } = formatDateTime(appointment.dateTime)

              return (
                <Card key={appointment.id} className="overflow-hidden">
                  <div className="p-6">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{appointment.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Service Info */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {appointment.service?.name || 'Dịch vụ'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* DateTime */}
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{date}</p>
                          <p className="text-gray-500">{time}</p>
                        </div>
                      </div>

                      {/* Pet */}
                      {appointment.pet && (
                        <div className="flex items-start gap-3">
                          <PawPrint className="w-5 h-5 text-emerald-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{appointment.pet.name}</p>
                            <p className="text-gray-500">{appointment.pet.species}</p>
                          </div>
                        </div>
                      )}

                      {/* Staff */}
                      {appointment.staff && (
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-emerald-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.staff.profile?.name || 'Nhân viên'}
                            </p>
                            <p className="text-gray-500">Nhân viên phụ trách</p>
                          </div>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center text-emerald-500 font-bold">
                          ₫
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formatVND(appointment.price)}</p>
                          <p className="text-gray-500">Giá dịch vụ</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Ghi chú:</span> {appointment.notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {canCancel(appointment.status) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(appointment)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Hủy lịch hẹn
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              Trước
            </Button>
            <span className="px-4 py-2 text-gray-600">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Hủy lịch hẹn"
          size="md"
        >
          <div>
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Lưu ý</p>
                  <p>Việc hủy lịch hẹn có thể ảnh hưởng đến việc đặt lịch trong tương lai. Vui lòng cho chúng tôi biết lý do hủy.</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy (không bắt buộc)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng cho chúng tôi biết lý do..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Quay lại
              </Button>
              <Button onClick={confirmCancel} className="bg-red-500 hover:bg-red-600">
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Appointments
