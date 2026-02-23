import { useState, useEffect } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { SupportTicket, User as UserType } from '@/types'
import {
  Search,
  Filter,
  MessageSquare,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  Send,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

const Support = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [adminUsers, setAdminUsers] = useState<UserType[]>([])
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolution, setResolution] = useState('')
  const [ticketToResolve, setTicketToResolve] = useState<string | null>(null)

  const fetchTickets = async (page = 1, search = '', status = 'all', priority = 'all') => {
    try {
      setLoading(true)
      const params: any = { 
        page, 
        limit: pagination.limit
      }
      
      if (search) params.search = search
      if (status !== 'all') params.status = status
      if (priority !== 'all') params.priority = priority

      const response = await adminService.getSupportTickets(params)

      let ticketData: SupportTicket[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          ticketData = response.data
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          ticketData = response
        }
      }
      
      setTickets(ticketData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch support tickets:', error)
      setTickets([])
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

  // Fetch admin users for assignment dropdown
  const fetchAdminUsers = async () => {
    try {
      const response = await adminService.getUsers({ role: 'admin', limit: 100 })
      const users = response.data || response || []
      setAdminUsers(Array.isArray(users) ? users : [])
    } catch (error) {
      console.error('Failed to fetch admin users:', error)
    }
  }

  useEffect(() => {
    fetchAdminUsers()
  }, [])

  useEffect(() => {
    fetchTickets(1, '', statusFilter, priorityFilter)
  }, [statusFilter, priorityFilter])

  useEffect(() => {
    fetchTickets(1, searchQuery, statusFilter, priorityFilter)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchTickets(page, searchQuery, statusFilter, priorityFilter)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
  }

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority)
  }

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowDetailsModal(true)
  }

  const handleAssignTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setAssignedStaffId(ticket.assignedTo || '')
    setShowAssignModal(true)
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status'] | string) => {
    // If resolving, show modal to get resolution
    if (newStatus === 'resolved') {
      setTicketToResolve(ticketId)
      setShowResolveModal(true)
      return
    }

    const toastId = toast.loading('Đang cập nhật trạng thái...')

    try {
      await adminService.updateSupportTicket(ticketId, { status: newStatus as any })
      toast.success('Cập nhật trạng thái thành công!', { id: toastId })
      fetchTickets(pagination.page, searchQuery, statusFilter, priorityFilter)
      // Also update selected ticket if viewing details
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any })
      }
    } catch (error: any) {
      console.error('Failed to update ticket status:', error)

      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi cập nhật trạng thái!'

      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmResolve = async () => {
    if (!ticketToResolve || !resolution.trim()) {
      toast.error('Vui lòng nhập nội dung giải quyết')
      return
    }

    const toastId = toast.loading('Đang cập nhật trạng thái...')

    try {
      await adminService.updateSupportTicket(ticketToResolve, {
        status: 'resolved' as any,
        resolution: resolution
      } as any)
      toast.success('Đã giải quyết ticket thành công!', { id: toastId })
      setShowResolveModal(false)
      setResolution('')
      setTicketToResolve(null)
      fetchTickets(pagination.page, searchQuery, statusFilter, priorityFilter)
    } catch (error: any) {
      console.error('Failed to resolve ticket:', error)

      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi giải quyết ticket!'

      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmAssign = async () => {
    if (!selectedTicket || !assignedStaffId.trim()) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }
    
    const toastId = toast.loading('Đang phân công ticket...')
    
    try {
      await adminService.assignSupportTicket(selectedTicket.id, assignedStaffId)
      toast.success('Phân công ticket thành công!', { id: toastId })
      setShowAssignModal(false)
      setSelectedTicket(null)
      setAssignedStaffId('')
      fetchTickets(pagination.page, searchQuery, statusFilter, priorityFilter)
    } catch (error: any) {
      console.error('Failed to assign ticket:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi phân công ticket!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi')
      return
    }
    
    const toastId = toast.loading('Đang gửi phản hồi...')
    
    try {
      await adminService.addSupportMessage(selectedTicket.id, replyMessage)
      toast.success('Gửi phản hồi thành công!', { id: toastId })
      setReplyMessage('')
      // Optionally update ticket status to 'in_progress' or 'resolved'
      if (selectedTicket.status === 'open') {
        await adminService.updateTicketStatus(selectedTicket.id, 'in_progress')
      }
      fetchTickets(pagination.page, searchQuery, statusFilter, priorityFilter)
    } catch (error: any) {
      console.error('Failed to send reply:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi gửi phản hồi!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const getStatusBadgeClass = (status: SupportTicket['status'] | string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in-progress':
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: SupportTicket['status'] | string) => {
    switch (status) {
      case 'open': return 'Mở'
      case 'in-progress':
      case 'in_progress': return 'Đang xử lý'
      case 'resolved': return 'Đã giải quyết'
      case 'closed': return 'Đã đóng'
      default: return status
    }
  }

  const getPriorityBadgeClass = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'Thấp'
      case 'medium': return 'Trung bình'
      case 'high': return 'Cao'
      case 'urgent': return 'Khẩn cấp'
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const columns = [
    {
      key: 'ticketInfo',
      label: 'Thông tin ticket',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return ''
        return (
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-medium text-gray-900">#{ticket.ticketNumber || ticket.id?.slice(0, 8)}</div>
              <div className="text-sm text-gray-500 line-clamp-1">{ticket.title || ticket.subject}</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return ''
        // Check if it's a guest ticket
        const isGuest = !ticket.userId && (ticket.guestName || ticket.guestEmail)
        return (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              {isGuest ? (
                <>
                  <div className="font-medium text-gray-900">
                    {ticket.guestName}
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Khách</span>
                  </div>
                  <div className="text-sm text-gray-500">{ticket.guestEmail}</div>
                </>
              ) : (
                <>
                  <div className="font-medium text-gray-900">
                    {ticket.user?.profile?.firstName} {ticket.user?.profile?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{ticket.user?.email}</div>
                </>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'priority',
      label: 'Độ ưu tiên',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(ticket.priority)}`}>
            {getPriorityLabel(ticket.priority)}
          </span>
        )
      }
    },
    {
      key: 'assignedTo',
      label: 'Nhân viên phụ trách',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return '-'
        const assignedUser = ticket.assignedToUser || ticket.assignedTo
        return assignedUser ? (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm">
              {assignedUser.profile?.firstName || assignedUser.profile?.name || ''} {assignedUser.profile?.lastName || ''}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">Chưa phân công</span>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ticket.status)}`}>
            {getStatusLabel(ticket.status)}
          </span>
        )
      }
    },
    {
      key: 'createdAt',
      label: 'Thời gian',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return ''
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, ticket: SupportTicket) => {
        if (!ticket) return null
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(ticket)}
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {!ticket.assignedToId && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAssignTicket(ticket)}
                title="Phân công"
              >
                <UserCheck className="w-4 h-4" />
              </Button>
            )}
            
            {ticket.status === 'open' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                title="Bắt đầu xử lý"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}

            {(ticket.status === 'in-progress' || ticket.status === 'in_progress') && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                title="Đánh dấu đã giải quyết"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
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
            <h1 className="text-2xl font-bold text-gray-900">Hỗ trợ khách hàng</h1>
            <p className="text-gray-600">Quản lý và phản hồi yêu cầu hỗ trợ từ khách hàng</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo trạng thái</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'open', label: 'Mở' },
              { value: 'in_progress', label: 'Đang xử lý' },
              { value: 'resolved', label: 'Đã giải quyết' },
              { value: 'closed', label: 'Đã đóng' }
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

        {/* Priority Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lọc theo độ ưu tiên</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Tất cả' },
              { value: 'low', label: 'Thấp' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'high', label: 'Cao' },
              { value: 'urgent', label: 'Khẩn cấp' }
            ].map((priority) => {
              const isActive = priorityFilter === priority.value
              return (
                <Button
                  key={priority.value}
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePriorityChange(priority.value)}
                >
                  {priority.label}
                </Button>
              )
            })}
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
          placeholder="Tìm kiếm theo mã ticket, tiêu đề hoặc tên khách hàng..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Support Tickets Table */}
      <Card padding="none">
        {tickets.length > 0 ? (
          <Table
            columns={columns}
            data={tickets}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có ticket hỗ trợ nào"
              description="Chưa có yêu cầu hỗ trợ hoặc không có kết quả phù hợp với bộ lọc"
              action={null}
            />
          </div>
        )}
      </Card>

      {/* Ticket Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Chi tiết ticket hỗ trợ"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">#{selectedTicket.ticketNumber || selectedTicket.id?.slice(0, 8)}</h3>
                <p className="text-sm text-gray-500">{selectedTicket.title || selectedTicket.subject}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                  {getPriorityLabel(selectedTicket.priority)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedTicket.status)}`}>
                  {getStatusLabel(selectedTicket.status)}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
              <div className="bg-white border rounded-lg p-4 space-y-2">
                {selectedTicket.userId ? (
                  <>
                    <p><span className="font-medium">Tên:</span> {selectedTicket.user?.profile?.firstName} {selectedTicket.user?.profile?.lastName}</p>
                    <p><span className="font-medium">Email:</span> {selectedTicket.user?.email}</p>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">Tên:</span> {selectedTicket.guestName}
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Khách vãng lai</span>
                    </p>
                    <p><span className="font-medium">Email:</span> {selectedTicket.guestEmail}</p>
                    {selectedTicket.guestPhone && (
                      <p><span className="font-medium">Điện thoại:</span> {selectedTicket.guestPhone}</p>
                    )}
                    {selectedTicket.petType && (
                      <p><span className="font-medium">Loại thú cưng:</span> {selectedTicket.petType}</p>
                    )}
                  </>
                )}
                <p><span className="font-medium">Thời gian tạo:</span> {formatDate(selectedTicket.createdAt)}</p>
              </div>
            </div>

            {/* Ticket Content */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Nội dung yêu cầu</h4>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description || 'Không có nội dung'}</p>
              </div>
            </div>

            {/* Reply Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Phản hồi</h4>
              <div className="space-y-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Nhập nội dung phản hồi cho khách hàng..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {selectedTicket.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                      >
                        Đánh dấu đang xử lý
                      </Button>
                    )}
                    {(selectedTicket.status === 'in-progress' || selectedTicket.status === 'in_progress') && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      >
                        Đánh dấu đã giải quyết
                      </Button>
                    )}
                  </div>
                  <Button onClick={handleSendReply}>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi phản hồi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Phân công nhân viên hỗ trợ"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm">
              Ticket: #{selectedTicket?.ticketNumber || selectedTicket?.id?.slice(0, 8)}
            </p>
            <p className="text-blue-600 text-sm">
              {selectedTicket?.title || selectedTicket?.subject}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn nhân viên hỗ trợ *
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="">-- Chọn nhân viên --</option>
              {adminUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.profile?.firstName} {user.profile?.lastName} ({user.email})
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

      {/* Resolve Ticket Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setResolution('')
          setTicketToResolve(null)
        }}
        title="Giải quyết ticket"
      >
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              Bạn đang đánh dấu ticket này là đã giải quyết
            </p>
            <p className="text-green-600 text-sm mt-1">
              Vui lòng nhập nội dung giải quyết để hoàn tất
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung giải quyết *
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Mô tả cách bạn đã giải quyết vấn đề này..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveModal(false)
                setResolution('')
                setTicketToResolve(null)
              }}
            >
              Hủy
            </Button>
            <Button variant="success" onClick={confirmResolve}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Xác nhận giải quyết
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Support