import { useState, useEffect, useCallback } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { DiscountCode } from '@/types'
import { formatVND } from '@/utils'
import { Plus, Search, Filter, Tag, Percent, DollarSign, Calendar, Edit, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface DiscountCode {
  id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validTo: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  applicableProducts?: string[]
  applicableCategories?: string[]
  createdAt: string
  updatedAt: string
}

const DiscountCodes = () => {
  // Data states
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDiscountCode, setSelectedDiscountCode] = useState<DiscountCode | null>(null)
  
  // Form data state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    validFrom: '',
    validTo: ''
  })
  
  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchDiscountCodes = async (page = 1, search = '', status = 'all') => {
    try {
      setLoading(true)
      const response = await adminService.getDiscountCodes({ 
        status: status === 'all' ? undefined : status, 
        page, 
        limit: pagination.limit,
        search 
      })

      console.log(response)
      
      // Handle response format: { success: true, data: [...], meta: {...} }
      let discountData: DiscountCode[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Paginated response with data and meta
          discountData = response.data
          
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          // Direct array response
          discountData = response
        }
      }
      
      setDiscountCodes(discountData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch discount codes:', error)
      setDiscountCodes([])
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
    fetchDiscountCodes(1, '', statusFilter)
  }, [statusFilter])

  useEffect(() => {
    fetchDiscountCodes(1, searchQuery, statusFilter)
  }, [searchQuery])

  // Initial load
  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchDiscountCodes(page, searchQuery, statusFilter)
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setSearchQuery('')
    setSearchInput('')
  }

  const handleCreate = () => {
    setSelectedDiscountCode(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      validFrom: '',
      validTo: ''
    })
    setShowModal(true)
  }

  const handleEdit = (discountCode: DiscountCode) => {
    setSelectedDiscountCode(discountCode)
    setFormData({
      code: discountCode.code,
      name: discountCode.name,
      description: discountCode.description || '',
      type: discountCode.type,
      value: discountCode.value,
      minOrderAmount: discountCode.minOrderAmount || 0,
      maxDiscountAmount: discountCode.maxDiscountAmount || 0,
      usageLimit: discountCode.usageLimit || 0,
      validFrom: discountCode.validFrom ? discountCode.validFrom.split('T')[0] : '',
      validTo: discountCode.validTo ? discountCode.validTo.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = (discountCode: DiscountCode) => {
    setSelectedDiscountCode(discountCode)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const toastId = toast.loading(
      selectedDiscountCode ? 'Đang cập nhật mã giảm giá...' : 'Đang tạo mã giảm giá...'
    )
    
    try {
      const discountData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: formData.value,
        minOrderAmount: formData.minOrderAmount || undefined,
        maxDiscountAmount: formData.maxDiscountAmount || undefined,
        usageLimit: formData.usageLimit || undefined,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
        validTo: formData.validTo ? new Date(formData.validTo).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
      }

      if (selectedDiscountCode) {
        await adminService.updateDiscountCode(selectedDiscountCode.id, discountData)
        toast.success('Cập nhật mã giảm giá thành công!', { id: toastId })
      } else {
        await adminService.createDiscountCode(discountData)
        toast.success('Tạo mã giảm giá mới thành công!', { id: toastId })
      }

      setShowModal(false)
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        validFrom: '',
        validTo: ''
      })
      fetchDiscountCodes(pagination.page, searchQuery, statusFilter)
    } catch (error: any) {
      console.error('Failed to save discount code:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          (selectedDiscountCode 
                            ? 'Có lỗi xảy ra khi cập nhật mã giảm giá!'
                            : 'Có lỗi xảy ra khi tạo mã giảm giá!')
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmDelete = async () => {
    if (!selectedDiscountCode) return
    
    const toastId = toast.loading('Đang xóa mã giảm giá...')
    
    try {
      await adminService.deleteDiscountCode(selectedDiscountCode.id)
      toast.success('Xóa mã giảm giá thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedDiscountCode(null)
      fetchDiscountCodes(pagination.page, searchQuery, statusFilter)
    } catch (error: any) {
      console.error('Failed to delete discount code:', error)
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi xóa mã giảm giá!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const formatValue = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : formatVND(value)
  }

  const getStatusColor = (discountCode: DiscountCode) => {
    if (discountCode.status === 'INACTIVE') {
      return 'bg-gray-100 text-gray-800'
    }
    
    if (discountCode.status === 'EXPIRED' || (discountCode.validTo && new Date(discountCode.validTo) < new Date())) {
      return 'bg-red-100 text-red-800'
    }
    
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = (discountCode: DiscountCode) => {
    if (discountCode.status === 'INACTIVE') {
      return 'Đã tắt'
    }
    
    if (discountCode.status === 'EXPIRED' || (discountCode.validTo && new Date(discountCode.validTo) < new Date())) {
      return 'Đã hết hạn'
    }
    
    return 'Đang hoạt động'
  }


  const columns = [
    {
      key: 'code',
      label: 'Thông tin mã giảm giá',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return ''
        return (
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900 uppercase">{discountCode.code}</div>
              <div className="text-sm font-medium text-gray-700">{discountCode.name}</div>
              <div className="text-sm text-gray-500">
                {discountCode.type === 'percentage' ? 'Giảm theo phần trăm' : 'Giảm cố định'}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'value',
      label: 'Giá trị',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return ''
        return (
          <div className="flex items-center gap-2">
            {discountCode.type === 'percentage' ? (
              <Percent className="w-4 h-4 text-green-600" />
            ) : (
              <DollarSign className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-bold text-lg text-[#2E86AB]">{formatValue(discountCode.type, discountCode.value)}</span>
          </div>
        )
      }
    },
    {
      key: 'usage',
      label: 'Sử dụng',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return ''
        const usagePercent = discountCode.usageLimit ? (discountCode.usedCount / discountCode.usageLimit) * 100 : 0
        return (
          <div className="text-sm">
            <div className="text-gray-900">
              Đã dùng: <span className="font-semibold">{discountCode.usedCount}</span>
            </div>
            <div className="text-gray-600">
              Tối đa: <span className="font-semibold">{discountCode.usageLimit || 'Không giới hạn'}</span>
            </div>
            {discountCode.usageLimit && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className="bg-[#F18F01] h-1.5 rounded-full" 
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'conditions',
      label: 'Điều kiện',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return ''
        return (
          <div className="text-sm">
            {discountCode.minOrderAmount && (
              <div className="text-gray-600">
                Đơn tối thiểu: <span className="font-semibold text-gray-900">{formatVND(discountCode.minOrderAmount)}</span>
              </div>
            )}
            {discountCode.validTo && (
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <Calendar className="w-3 h-3" />
                <span>Hết hạn: {new Date(discountCode.validTo).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(discountCode)}`}>
            {getStatusText(discountCode)}
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, discountCode: DiscountCode) => {
        if (!discountCode) return null
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(discountCode)}
            >
              <Edit className="w-4 h-4" />
              Sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(discountCode)}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
            <p className="text-gray-600">Tạo và quản lý các mã khuyến mãi cho khách hàng</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Thêm mã giảm giá
          </Button>
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
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'expired', label: 'Đã hết hạn' },
            { value: 'inactive', label: 'Đã tắt' }
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

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
        </div>
        <Input
          placeholder="Tìm kiếm mã giảm giá..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Discount Codes Table */}
      <Card padding="none">
        {discountCodes.length > 0 ? (
          <Table
            columns={columns}
            data={discountCodes}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có mã giảm giá nào"
              description="Bắt đầu bằng cách tạo mã giảm giá đầu tiên cho khách hàng"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm mã giảm giá
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
        title={selectedDiscountCode ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã giảm giá *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Nhập mã giảm giá (VD: SUMMER2025)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Mã sẽ được tự động viết hoa</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên mã giảm giá *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Khuyến mãi mùa hè 2025"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về mã giảm giá..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại giảm giá *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixed_amount' | 'percentage' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            >
              <option value="percentage">Giảm theo phần trăm (%)</option>
              <option value="fixed_amount">Giảm cố định (VNĐ)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị giảm *
            </label>
            <Input
              type="number"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) || 0 })}
              placeholder={formData.type === 'percentage' ? '10' : '50000'}
              min="0"
              max={formData.type === 'percentage' ? '100' : undefined}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.type === 'percentage' ? 'Từ 0% đến 100%' : 'Số tiền giảm bằng VNĐ'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn hàng tối thiểu
              </label>
              <Input
                type="number"
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Để trống nếu không có yêu cầu</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảm giá tối đa
              </label>
              <Input
                type="number"
                value={formData.maxDiscountAmount || ''}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Chỉ áp dụng cho giảm giá theo %</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần sử dụng tối đa
            </label>
            <Input
              type="number"
              value={formData.usageLimit || ''}
              onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">0 = không giới hạn</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày bắt đầu *
              </label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hết hạn *
              </label>
              <Input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                min={formData.validFrom || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
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
              {selectedDiscountCode ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Xóa mã giảm giá "{selectedDiscountCode?.code}"
              </p>
              <p className="text-sm text-gray-600">
                Hành động này không thể hoàn tác
              </p>
            </div>
          </div>
          
          {selectedDiscountCode?.usedCount && selectedDiscountCode.usedCount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Lưu ý:</strong> Mã này đã được sử dụng {selectedDiscountCode.usedCount} lần. 
                Việc xóa có thể ảnh hưởng đến lịch sử đơn hàng của khách hàng.
              </p>
            </div>
          )}
          
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
              Xóa mã giảm giá
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DiscountCodes