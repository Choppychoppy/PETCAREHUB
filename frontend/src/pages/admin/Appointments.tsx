import { useState, useEffect } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { Appointment } from '@/types'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Heart,
  Trash2,
  Check,
  X,
  AlertTriangle,
  UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [staffList, setStaffList] = useState<any[]>([])

  const fetchAppointments = async (page = 1, search = '', status = 'all', date = '') => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: pagination.limit
      }

      if (search) params.search = search
      if (status !== 'all') params.status = status
      if (date) params.date = date

      const response = await adminService.getAppointments(params)

      let appointmentData: Appointment[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          appointmentData = response.data
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          appointmentData = response
        }
      }
      
      setAppointments(appointmentData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch staff list for assignment
  const fetchStaffList = async () => {
    try {
      const response = await adminService.getUsers({ role: 'admin', limit: 100 })
      let users: any[] = []
      if (response && 'data' in response && Array.isArray(response.data)) {
        users = response.data
      } else if (Array.isArray(response)) {
        users = response
      }
      setStaffList(users)
    } catch (error) {
      console.error('Failed to fetch staff list:', error)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchAppointments(1, '', statusFilter, dateFilter)
    fetchStaffList()
  }, [statusFilter, dateFilter])

  useEffect(() => {
    fetchAppointments(1, searchQuery, statusFilter, dateFilter)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchAppointments(page, searchQuery, statusFilter, dateFilter)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
  }

  const handleDateChange = (date: string) => {
    setDateFilter(date)
  }

  const handleDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowDeleteModal(true)
  }

  const handleAssignStaff = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setAssignedStaffId(appointment.staffId || '')
    setShowAssignModal(true)
  }

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleConfirmAppointment = async (appointment: Appointment) => {
    const toastId = toast.loading('Đang xác nhận lịch hẹn...')

    try {
      await adminService.confirmAppointment(appointment.id)
      toast.success('Xác nhận lịch hẹn thành công!', { id: toastId })
      fetchAppointments(pagination.page, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      console.error('Failed to confirm appointment:', error)

      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi xác nhận lịch hẹn!'

      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmCancel = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy lịch hẹn')
      return
    }
    
    const toastId = toast.loading('Đang hủy lịch hẹn...')
    
    try {
      await adminService.cancelAppointment(selectedAppointment.id, cancelReason)
      toast.success('Hủy lịch hẹn thành công!', { id: toastId })
      setShowCancelModal(false)
      setSelectedAppointment(null)
      setCancelReason('')
      fetchAppointments(pagination.page, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi hủy lịch hẹn!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmAssign = async () => {
    if (!selectedAppointment || !assignedStaffId.trim()) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }

    const toastId = toast.loading('Đang phân công nhân viên...')

    try {
      await adminService.assignStaff(selectedAppointment.id, assignedStaffId)
      toast.success('Phân công nhân viên thành công!', { id: toastId })
      setShowAssignModal(false)
      setSelectedAppointment(null)
      setAssignedStaffId('')
      fetchAppointments(pagination.page, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      console.error('Failed to assign staff:', error)

      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi phân công nhân viên!'

      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmDelete = async () => {
    if (!selectedAppointment) return

    const toastId = toast.loading('Đang xóa lịch hẹn...')

    try {
      await adminService.deleteAppointment(selectedAppointment.id)
      toast.success('Xóa lịch hẹn thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedAppointment(null)
      fetchAppointments(pagination.page, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      console.error('Failed to delete appointment:', error)

      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi xóa lịch hẹn!'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý'
      case 'confirmed': return 'Đã xác nhận'
      case 'in_progress': return 'Đang thực hiện'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      case 'no_show': return 'Không đến'
      default: return status
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const columns = [
    {
      key: 'customer',
      label: 'Khách hàng & Thú cưng',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return ''
        const customerName = appointment.user?.profile?.name || appointment.user?.email || 'Khách hàng'
        return (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <User className="w-5 h-5 text-gray-500 bg-gray-100 rounded-full p-1" />
              <Heart className="w-5 h-5 text-pink-500 bg-pink-100 rounded-full p-1" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {customerName}
              </div>
              <div className="text-sm text-gray-500">
                {appointment.pet ? `${appointment.pet.name} - ${appointment.pet.species}` : 'Chưa có thú cưng'}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'service',
      label: 'Dịch vụ & Ngày giờ',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return ''
        const { date, time } = formatDateTime(appointment.appointmentDate)
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900">{appointment.service?.name}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{time}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'staff',
      label: 'Nhân viên',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return '-'
        const staffName = appointment.staff?.profile?.name || appointment.staff?.email
        return staffName ? (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm">{staffName}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Chưa phân công</span>
        )
      }
    },
    {
      key: 'price',
      label: 'Giá',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return ''
        const price = appointment.price ? Number(appointment.price).toLocaleString('vi-VN') : '0'
        return (
          <div className="text-sm font-medium text-gray-900">
            {price} đ
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
            {getStatusLabel(appointment.status)}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, appointment: Appointment) => {
        if (!appointment) return null
        return (
          <div className="flex gap-2">
            {appointment.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignStaff(appointment)}
                  title="Phân công nhân viên"
                >
                  <UserCheck className="w-4 h-4" />
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleConfirmAppointment(appointment)}
                  title="Xác nhận"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </>
            )}
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no_show' && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleCancelAppointment(appointment)}
                title="Hủy lịch hẹn"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(appointment)}
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      }
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch hẹn</h1>
            <p className="text-gray-600">Quản lý tất cả lịch hẹn của khách hàng</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo trạng thái</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'in_progress', label: 'Đang thực hiện' },
              { value: 'completed', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Đã hủy' },
              { value: 'no_show', label: 'Không đến' }
            ].map((status) => {
              const isActive = statusFilter === status.value
              return (
                <Button
                  key={status.value}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(status.value)}
                >
                  {status.label}
                </Button>
              )
            })}
          </div>
        </Card>

        {/* Date Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo ngày</h3>
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="max-w-md"
          />
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
        </div>
        <Input
          placeholder="Tìm kiếm theo tên khách hàng, thú cưng hoặc dịch vụ..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Appointments Table */}
      <Card padding="none">
        {appointments.length > 0 ? (
          <Table
            columns={columns}
            data={appointments}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có lịch hẹn nào"
              description="Khách hàng chưa đặt lịch hẹn hoặc không có kết quả phù hợp với bộ lọc"
              action={null}
            />
          </div>
        )}
      </Card>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Phân công nhân viên"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              Lịch hẹn: {selectedAppointment?.service?.name || 'N/A'}
            </p>
            <p className="text-blue-600 text-sm">
              Khách hàng: {selectedAppointment?.user?.profile?.name || selectedAppointment?.user?.email || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn nhân viên *
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="">-- Chọn nhân viên --</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.profile?.name || staff.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
            >
              Hủy
            </Button>
            <Button onClick={confirmAssign}>
              Phân công
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Hủy lịch hẹn"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-orange-800 font-medium">Cảnh báo!</p>
              <p className="text-orange-600 text-sm">Khách hàng sẽ nhận được thông báo hủy lịch.</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do hủy lịch hẹn *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy lịch hẹn..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Không hủy
            </Button>
            <Button variant="warning" onClick={confirmCancel}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Cảnh báo!</p>
              <p className="text-red-600 text-sm">Hành động này không thể hoàn tác.</p>
            </div>
          </div>
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa lịch hẹn này?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Appointments