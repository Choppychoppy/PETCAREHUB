import { useState, useEffect } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import { authService } from '@/services/auth.service'
import type { Appointment, Service } from '@/types'
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
  UserCheck,
  Plus,
  Phone,
  UserPlus,
  Archive,
  Pencil
} from 'lucide-react'
import toast from 'react-hot-toast'

type CustomerType = 'registered' | 'guest'

interface CustomerResult {
  id: string
  name: string
  email: string
  phone: string | null
  pets: Array<{ id: string; name: string; species: string }>
}

const emptyForm = {
  customerType: 'registered' as CustomerType,
  userId: '',
  petId: '',
  newPetName: '',
  newPetSpecies: '',
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  guestPetName: '',
  guestPetSpecies: '',
  serviceId: '',
  appointmentDate: '',
  staffId: '',
  notes: '',
  isArchived: false,
}

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

  // ===== Tạo lịch hẹn (admin/nhân viên) =====
  const currentRole = authService.getUserRole() // 'admin' | 'staff' | 'user'
  const currentUser = authService.getCachedUser()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [services, setServices] = useState<Service[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null)

  // ===== Sửa lịch hẹn =====
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({ serviceId: '', staffId: '', appointmentDate: '', status: '' })

  const setField = (key: keyof typeof emptyForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Lấy danh sách dịch vụ cho dropdown
  const fetchServices = async () => {
    try {
      const res = await adminService.getServices({ limit: 100 })
      let list: Service[] = []
      if (res && 'data' in res && Array.isArray(res.data)) list = res.data as Service[]
      else if (Array.isArray(res)) list = res as Service[]
      setServices(list)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    }
  }

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

  // Fetch staff list for assignment (nhân viên + admin)
  const fetchStaffList = async () => {
    try {
      const members = await adminService.getStaffMembers()
      setStaffList(Array.isArray(members) ? members : [])
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
  }, [statusFilter, dateFilter])

  // Tải dữ liệu phụ trợ 1 lần
  useEffect(() => {
    fetchStaffList()
    fetchServices()
  }, [])

  // Tìm kiếm khách hàng đã có tài khoản (debounce 400ms)
  useEffect(() => {
    if (form.customerType !== 'registered') return
    const timer = setTimeout(async () => {
      if (!customerSearch.trim()) {
        setCustomerResults([])
        return
      }
      try {
        const results = await adminService.searchCustomers(customerSearch.trim())
        setCustomerResults(Array.isArray(results) ? results : [])
      } catch (error) {
        console.error('Failed to search customers:', error)
        setCustomerResults([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [customerSearch, form.customerType])

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

  // ===== Tạo lịch hẹn =====
  const openCreateModal = () => {
    setForm({
      ...emptyForm,
      // Nhân viên tự gán cho chính mình
      staffId: currentRole === 'staff' ? currentUser?.id || '' : '',
    })
    setSelectedCustomer(null)
    setCustomerSearch('')
    setCustomerResults([])
    setShowCreateModal(true)
  }

  const handleSelectCustomer = (c: CustomerResult) => {
    setSelectedCustomer(c)
    setField('userId', c.id)
    setField('petId', '')
    setCustomerResults([])
    setCustomerSearch(c.name)
  }

  const handleSelectService = (serviceId: string) => {
    setField('serviceId', serviceId)
  }

  const handleCreateSubmit = async () => {
    // Kiểm tra dữ liệu cơ bản
    if (!form.serviceId) {
      toast.error('Vui lòng chọn dịch vụ')
      return
    }
    if (!form.appointmentDate) {
      toast.error('Vui lòng chọn ngày giờ hẹn')
      return
    }
    if (form.customerType === 'registered' && !form.userId) {
      toast.error('Vui lòng chọn khách hàng đã có tài khoản')
      return
    }
    if (form.customerType === 'guest') {
      if (!form.guestName.trim()) {
        toast.error('Vui lòng nhập tên khách hàng')
        return
      }
      if (!form.guestPhone.trim()) {
        toast.error('Vui lòng nhập số điện thoại khách hàng')
        return
      }
    }
    if (currentRole === 'admin' && !form.staffId) {
      toast.error('Vui lòng chọn nhân viên phụ trách')
      return
    }

    const selectedService = services.find((s) => s.id === form.serviceId)
    const payload: any = {
      customerType: form.customerType,
      serviceId: form.serviceId,
      appointmentDate: new Date(form.appointmentDate).toISOString(),
      notes: form.notes || undefined,
      // Khách vãng lai mặc định luôn được lưu làm hồ sơ lưu trữ online
      isArchived: form.customerType === 'guest',
    }
    if (selectedService) {
      payload.price = Number(selectedService.price) || undefined
      payload.duration = (selectedService as any).duration || undefined
    }
    // Nhân viên luôn tự gán; admin chọn nhân viên
    payload.staffId =
      currentRole === 'staff' ? currentUser?.id : form.staffId || undefined

    if (form.customerType === 'registered') {
      payload.userId = form.userId
      payload.petId = form.petId || undefined
      // Thêm thú cưng mới ngay trong luồng đặt lịch (nếu có nhập)
      if (form.newPetName.trim()) {
        payload.newPetName = form.newPetName.trim()
        payload.newPetSpecies = form.newPetSpecies.trim() || undefined
      }
    } else {
      payload.guestName = form.guestName
      payload.guestPhone = form.guestPhone
      payload.guestEmail = form.guestEmail || undefined
      payload.guestPetName = form.guestPetName || undefined
      payload.guestPetSpecies = form.guestPetSpecies || undefined
    }

    setCreating(true)
    const toastId = toast.loading('Đang tạo lịch hẹn...')
    try {
      await adminService.createStaffAppointment(payload)
      toast.success('Tạo lịch hẹn thành công!', { id: toastId })
      setShowCreateModal(false)
      fetchAppointments(1, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      console.error('Failed to create appointment:', error)
      const msg = Array.isArray(error?.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tạo lịch hẹn!'
      toast.error(msg, { id: toastId })
    } finally {
      setCreating(false)
    }
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

  // Chuyển giá trị ngày giờ sang định dạng cho input datetime-local (yyyy-MM-ddTHH:mm)
  const toLocalInput = (value?: string) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditForm({
      serviceId: (appointment as any).serviceId || (appointment as any).service?.id || '',
      staffId: (appointment as any).staffId || (appointment as any).staff?.id || '',
      appointmentDate: toLocalInput((appointment as any).dateTime || (appointment as any).appointmentDate),
      status: appointment.status || '',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedAppointment) return
    if (!editForm.serviceId) { toast.error('Vui lòng chọn dịch vụ'); return }
    if (!editForm.appointmentDate) { toast.error('Vui lòng chọn ngày giờ hẹn'); return }
    if (currentRole === 'admin' && !editForm.staffId) { toast.error('Vui lòng chọn nhân viên phụ trách'); return }

    const selectedService = services.find((s) => s.id === editForm.serviceId)
    const payload: any = {
      serviceId: editForm.serviceId,
      staffId: editForm.staffId || undefined,
      appointmentDate: new Date(editForm.appointmentDate).toISOString(),
      status: editForm.status || undefined,
    }
    if (selectedService) {
      payload.duration = (selectedService as any).duration || undefined
      payload.price = Number(selectedService.price) || undefined
    }

    setSavingEdit(true)
    const toastId = toast.loading('Đang cập nhật lịch hẹn...')
    try {
      await adminService.updateAppointment(selectedAppointment.id, payload)
      toast.success('Cập nhật lịch hẹn thành công!', { id: toastId })
      setShowEditModal(false)
      setSelectedAppointment(null)
      fetchAppointments(pagination.page, searchQuery, statusFilter, dateFilter)
    } catch (error: any) {
      const msg = Array.isArray(error?.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi cập nhật lịch hẹn!'
      toast.error(msg, { id: toastId })
    } finally {
      setSavingEdit(false)
    }
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: '-', time: '' }
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
        const isGuest = appointment.customerType === 'guest' || (!appointment.user && !!appointment.guestName)
        const customerName = isGuest
          ? appointment.guestName || 'Khách vãng lai'
          : appointment.user?.profile?.name || appointment.user?.email || 'Khách hàng'
        const petInfo = isGuest
          ? (appointment.guestPetName
              ? `${appointment.guestPetName}${appointment.guestPetSpecies ? ' - ' + appointment.guestPetSpecies : ''}`
              : 'Không có thông tin thú cưng')
          : (appointment.pet ? `${appointment.pet.name} - ${appointment.pet.species}` : 'Chưa có thú cưng')
        return (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <User className="w-5 h-5 text-gray-500 bg-gray-100 rounded-full p-1" />
              <Heart className="w-5 h-5 text-pink-500 bg-pink-100 rounded-full p-1" />
            </div>
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {customerName}
                {isGuest && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                    Vãng lai
                  </span>
                )}
                {appointment.isArchived && (
                  <span title="Hồ sơ lưu trữ online">
                    <Archive className="w-3.5 h-3.5 text-gray-400" />
                  </span>
                )}
              </div>
              {isGuest && appointment.guestPhone && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {appointment.guestPhone}
                </div>
              )}
              <div className="text-sm text-gray-500">{petInfo}</div>
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
        const { date, time } = formatDateTime(appointment.appointmentDate || appointment.dateTime)
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(appointment)}
                  title="Sửa lịch hẹn"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleCancelAppointment(appointment)}
                  title="Hủy lịch hẹn"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
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
            <p className="text-gray-600">
              {currentRole === 'staff'
                ? 'Quản lý lịch hẹn được phân công cho bạn'
                : 'Quản lý tất cả lịch hẹn của khách hàng'}
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-5 h-5 mr-2" />
            Tạo lịch hẹn
          </Button>
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

      {/* Create Appointment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo lịch hẹn mới"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Loại khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại khách hàng</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setField('customerType', 'registered'); setSelectedCustomer(null) }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  form.customerType === 'registered'
                    ? 'border-[#2E86AB] bg-[#2E86AB]/10 text-[#2E86AB]'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Khách đã có tài khoản
              </button>
              <button
                type="button"
                onClick={() => setField('customerType', 'guest')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                  form.customerType === 'guest'
                    ? 'border-[#F18F01] bg-[#F18F01]/10 text-[#F18F01]'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Khách vãng lai
              </button>
            </div>
          </div>

          {/* Khách đã có tài khoản */}
          {form.customerType === 'registered' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm khách hàng (tên / email / số điện thoại) *
                </label>
                <Input
                  placeholder="Nhập để tìm khách hàng..."
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setField('userId', '') }}
                />
                {customerResults.length > 0 && !selectedCustomer && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className="p-2 bg-blue-50 rounded-lg text-sm">
                  <div className="font-medium text-blue-800">{selectedCustomer.name}</div>
                  <div className="text-blue-600 text-xs">{selectedCustomer.email}{selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}</div>
                </div>
              )}

              {selectedCustomer && selectedCustomer.pets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thú cưng (tùy chọn)</label>
                  <select
                    value={form.petId}
                    onChange={(e) => setField('petId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                  >
                    <option value="">-- Chọn thú cưng --</option>
                    {selectedCustomer.pets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - {p.species}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Thêm thú cưng mới ngay trong luồng đặt lịch */}
              {selectedCustomer && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-sm font-medium text-[#2E86AB] mb-2">
                    <UserPlus className="w-4 h-4" /> Hoặc thêm thú cưng mới
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Tên thú cưng mới"
                      value={form.newPetName}
                      onChange={(e) => { setField('newPetName', e.target.value); if (e.target.value) setField('petId', '') }}
                    />
                    <Input
                      placeholder="Loài (Chó / Mèo...)"
                      value={form.newPetSpecies}
                      onChange={(e) => setField('newPetSpecies', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Nếu nhập tên thú cưng mới, hệ thống sẽ tự thêm vào hồ sơ khách hàng.</p>
                </div>
              )}
            </div>
          )}

          {/* Khách vãng lai */}
          {form.customerType === 'guest' && (
            <div className="space-y-3 p-3 bg-orange-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                  <Input value={form.guestName} onChange={(e) => setField('guestName', e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <Input value={form.guestPhone} onChange={(e) => setField('guestPhone', e.target.value)} placeholder="0901234567" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (tùy chọn)</label>
                <Input value={form.guestEmail} onChange={(e) => setField('guestEmail', e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên thú cưng (tùy chọn)</label>
                  <Input value={form.guestPetName} onChange={(e) => setField('guestPetName', e.target.value)} placeholder="Milo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loài (tùy chọn)</label>
                  <Input value={form.guestPetSpecies} onChange={(e) => setField('guestPetSpecies', e.target.value)} placeholder="Chó / Mèo..." />
                </div>
              </div>
            </div>
          )}

          {/* Dịch vụ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ *</label>
            <select
              value={form.serviceId}
              onChange={(e) => handleSelectService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.price ? `- ${Number(s.price).toLocaleString('vi-VN')}đ` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Ngày giờ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giờ hẹn *</label>
            <input
              type="datetime-local"
              value={form.appointmentDate}
              onChange={(e) => setField('appointmentDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          {/* Nhân viên phụ trách */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên phụ trách {currentRole === 'admin' ? '*' : ''}</label>
            {currentRole === 'staff' ? (
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                {currentUser?.profile?.name || currentUser?.email || 'Bạn'} (tự phụ trách)
              </div>
            ) : (
              <select
                value={form.staffId}
                onChange={(e) => setField('staffId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              >
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.email} {staff.role === 'admin' ? '(Quản trị)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>Hủy</Button>
            <Button onClick={handleCreateSubmit} disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo lịch hẹn'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Sửa lịch hẹn"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ *</label>
            <select
              value={editForm.serviceId}
              onChange={(e) => setEditForm((p) => ({ ...p, serviceId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giờ hẹn *</label>
            <input
              type="datetime-local"
              value={editForm.appointmentDate}
              onChange={(e) => setEditForm((p) => ({ ...p, appointmentDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          {currentRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên phụ trách *</label>
              <select
                value={editForm.staffId}
                onChange={(e) => setEditForm((p) => ({ ...p, staffId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              >
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.role === 'admin' ? ' (Admin)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="no_show">Vắng mặt</option>
            </select>
          </div>

          <p className="text-xs text-gray-500">
            Hệ thống sẽ kiểm tra dịch vụ và khung giờ của nhân viên để tránh trùng lịch.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Hủy</Button>
            <Button onClick={handleEditSubmit} loading={savingEdit}>Cập nhật</Button>
          </div>
        </div>
      </Modal>

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
                  {staff.name || staff.profile?.name || staff.email}
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