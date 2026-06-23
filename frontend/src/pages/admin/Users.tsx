import { useState, useEffect } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState, Avatar } from '@/components/common'
import { adminService } from '@/services/admin.service'
import { Plus, Search, Filter, Users as UsersIcon, Edit, Trash2, AlertTriangle, Mail, Phone, Calendar, Shield, Ban, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  role: 'admin' | 'staff' | 'user'
  status: 'active' | 'banned' | 'pending'
  profile?: {
    firstName: string
    lastName: string
    name: string
    phone?: string
    dateOfBirth?: string
    avatar?: string
    address?: string
  }
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  banReason?: string
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    role: 'user' as 'admin' | 'staff' | 'user',
    name: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  })
  const [banReason, setBanReason] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchUsers = async (page = 1, search = '', role = 'all', status = 'all') => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: pagination.limit
      }

      // Only add search if not empty
      if (search && search.trim()) {
        params.search = search.trim()
      }

      if (role !== 'all') {
        params.role = role
      }

      if (status !== 'all') {
        params.status = status
      }

      const response = await adminService.getUsers(params)

      let userData: User[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }

      if (response && typeof response === 'object') {
        // Handle flat data structure with meta (new format)
        if ('data' in response && Array.isArray(response.data)) {
          userData = response.data

          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        }
        // Handle direct array response
        else if (Array.isArray(response)) {
          userData = response
        }
      }

      setUsers(userData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
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
    fetchUsers(1, '', roleFilter, statusFilter)
  }, [roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers(1, searchQuery, roleFilter, statusFilter)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchUsers(page, searchQuery, roleFilter, statusFilter)
  }

  const handleRoleChange = (role: string) => {
    setRoleFilter(role)
    setSearchQuery('')
    setSearchInput('')
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setSearchQuery('')
    setSearchInput('')
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setFormData({
      email: '',
      role: 'user',
      name: '',
      phone: '',
      dateOfBirth: '',
      address: ''
    })
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      role: user.role,
      name: user.profile?.name || '',
      phone: user.profile?.phone || '',
      dateOfBirth: user.profile?.dateOfBirth ? String(user.profile.dateOfBirth).split('T')[0] : '',
      address: user.profile?.address || ''
    })
    setShowModal(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setBanReason('')
    setShowBanModal(true)
  }

  const handleUnban = async (user: User) => {
    const toastId = toast.loading('Đang bỏ cấm người dùng...')
    
    try {
      await adminService.unbanUser(user.id)
      toast.success('Bỏ cấm người dùng thành công!', { id: toastId })
      fetchUsers(pagination.page, searchQuery, roleFilter, statusFilter)
    } catch (error: any) {
      console.error('Failed to unban user:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi bỏ cấm người dùng!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const toastId = toast.loading(
      selectedUser ? 'Đang cập nhật người dùng...' : 'Đang tạo người dùng...'
    )
    
    try {
      const userData = {
        email: formData.email,
        role: formData.role,
        profile: {
          name: formData.name,
          phone: formData.phone || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address || undefined
        }
      }

      if (selectedUser) {
        await adminService.updateUser(selectedUser.id, userData)
        toast.success('Cập nhật người dùng thành công!', { id: toastId })
      } else {
        // Note: Creating users might need a different endpoint or password handling
        toast.error('Tính năng tạo người dùng chưa được hỗ trợ', { id: toastId })
        return
      }

      setShowModal(false)
      setFormData({
        email: '',
        role: 'user',
        name: '',
        phone: '',
        dateOfBirth: '',
        address: ''
      })
      fetchUsers(pagination.page, searchQuery, roleFilter, statusFilter)
    } catch (error: any) {
      console.error('Failed to save user:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          (selectedUser 
                            ? 'Có lỗi xảy ra khi cập nhật người dùng!'
                            : 'Có lỗi xảy ra khi tạo người dùng!')
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmBan = async () => {
    if (!selectedUser) return
    
    const toastId = toast.loading('Đang cấm người dùng...')
    
    try {
      await adminService.banUser(selectedUser.id, banReason)
      toast.success('Cấm người dùng thành công!', { id: toastId })
      setShowBanModal(false)
      setSelectedUser(null)
      setBanReason('')
      fetchUsers(pagination.page, searchQuery, roleFilter, statusFilter)
    } catch (error: any) {
      console.error('Failed to ban user:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi cấm người dùng!'
      
      toast.error(errorMessage, { id: toastId })
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'staff': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động'
      case 'banned': return 'Đã cấm'
      case 'pending': return 'Chờ xác thực'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'banned': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'Người dùng',
      render: (value: any, user: User) => {
        if (!user) return ''
        return (
          <div className="flex items-center gap-3">
            <Avatar 
              src={user.profile?.avatar} 
              alt={user.profile?.name || user.email}
              size="md" 
            />
            <div>
              <div className="font-medium text-gray-900">{user.profile?.name || 'Chưa cập nhật'}</div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-3 h-3" />
                {user.email}
              </div>
              {user.profile?.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="w-3 h-3" />
                  {user.profile.phone}
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'role',
      label: 'Vai trò',
      render: (value: any, user: User) => {
        if (!user) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            <Shield className="w-3 h-3 inline mr-1" />
            {getRoleText(user.role)}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, user: User) => {
        if (!user) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
            {getStatusText(user.status)}
          </span>
        )
      }
    },
    {
      key: 'dates',
      label: 'Ngày tham gia',
      render: (value: any, user: User) => {
        if (!user) return ''
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </div>
            {user.lastLoginAt && (
              <div className="text-gray-500 text-xs mt-1">
                Đăng nhập: {new Date(user.lastLoginAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, user: User) => {
        if (!user) return null
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(user)}
            >
              <Edit className="w-4 h-4" />
              Sửa
            </Button>
            {user.status === 'active' ? (
              <Button
                variant="warning"
                size="sm"
                onClick={() => handleBan(user)}
                disabled={user.role === 'admin'}
                title={user.role === 'admin' ? 'Không thể cấm tài khoản quản trị viên' : 'Cấm người dùng'}
                className={user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Ban className="w-4 h-4" />
                Cấm
              </Button>
            ) : user.status === 'banned' ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUnban(user)}
              >
                <CheckCircle className="w-4 h-4" />
                Bỏ cấm
              </Button>
            ) : null}
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600">Quản lý tài khoản và quyền hạn người dùng</p>
          </div>
          <Button onClick={handleCreate} disabled>
            <Plus className="w-5 h-5 mr-2" />
            Thêm người dùng
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo vai trò</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'admin', label: 'Quản trị viên' },
              { value: 'staff', label: 'Nhân viên' },
              { value: 'user', label: 'Khách hàng' }
            ].map((role) => (
              <Button
                key={role.value}
                variant={roleFilter === role.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleRoleChange(role.value)}
              >
                {role.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo trạng thái</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'banned', label: 'Đã cấm' },
              { value: 'pending', label: 'Chờ xác thực' }
            ].map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
        </div>
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Users Table */}
      <Card padding="none">
        {users.length > 0 ? (
          <Table
            columns={columns}
            data={users}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có người dùng nào"
              description="Chưa có dữ liệu người dùng để hiển thị"
              action={
                <Button onClick={handleCreate} disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm người dùng
                </Button>
              }
            />
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Nhập email"
              disabled={!!selectedUser}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' | 'user' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            >
              <option value="user">Khách hàng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Số điện thoại"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày sinh
            </label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Địa chỉ"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {selectedUser ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Ban Confirmation Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        title="Cấm người dùng"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn cấm người dùng "{selectedUser?.profile?.name || selectedUser?.email}"?
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do cấm (tùy chọn)
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do cấm người dùng này..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          <p className="text-sm text-red-600">
            Người dùng sẽ không thể đăng nhập sau khi bị cấm.
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBanModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={confirmBan}
            >
              Cấm người dùng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Users