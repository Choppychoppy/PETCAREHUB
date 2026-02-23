import { useState, useEffect, useCallback } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { Category } from '@/types'
import { Plus, Search, Filter, FolderOpen, ShoppingBag, Heart, Edit, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'service' as 'service' | 'product' | 'pet' | 'content',
    parentId: ''
  })
  const [typeFilter, setTypeFilter] = useState<string>('service')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchCategories = async (page = 1, search = '', type = 'service') => {
    try {
      setLoading(true)
      const response = await adminService.getCategories({ 
        type, 
        page, 
        limit: pagination.limit,
        search 
      })

      console.log(response)
      
      // Handle response format: { success: true, data: [...], meta: {...} }
      let categoryData: Category[] = []
      let paginationData = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          // Paginated response with data and meta
          categoryData = response.data
          
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
          categoryData = response
        }
      }
      
      setCategories(categoryData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500) // 500ms delay
    
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    fetchCategories(1, '', typeFilter)
  }, [typeFilter])

  useEffect(() => {
    fetchCategories(1, searchQuery, typeFilter)
  }, [searchQuery])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchCategories(page, searchQuery, typeFilter)
  }

  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    setSearchQuery('')
    setSearchInput('')
  }

  const handleCreate = () => {
    setSelectedCategory(null)
    setFormData({
      name: '',
      description: '',
      type: typeFilter as 'service' | 'product' | 'pet' | 'content',
      parentId: ''
    })
    setShowModal(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
      parentId: category.parentId || ''
    })
    setShowModal(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const toastId = toast.loading(
      selectedCategory ? 'Đang cập nhật danh mục...' : 'Đang tạo danh mục...'
    )
    
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        parentId: formData.parentId || undefined
      }

      if (selectedCategory) {
        await adminService.updateCategory(selectedCategory.id, categoryData)
        toast.success('Cập nhật danh mục thành công!', { id: toastId })
      } else {
        await adminService.createCategory(categoryData)
        toast.success('Tạo danh mục mới thành công!', { id: toastId })
      }

      setShowModal(false)
      setFormData({
        name: '',
        description: '',
        type: 'service' as 'service' | 'product' | 'pet' | 'content',
        parentId: ''
      })
      fetchCategories(pagination.page, searchQuery, typeFilter)
    } catch (error: any) {
      console.error('Failed to save category:', error)
      
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          (selectedCategory 
                            ? 'Có lỗi xảy ra khi cập nhật danh mục!'
                            : 'Có lỗi xảy ra khi tạo danh mục!')
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmDelete = async () => {
    if (!selectedCategory) return
    
    const toastId = toast.loading('Đang xóa danh mục...')
    
    try {
      await adminService.deleteCategory(selectedCategory.id)
      toast.success('Xóa danh mục thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedCategory(null)
      fetchCategories(pagination.page, searchQuery, typeFilter)
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || 
                          error?.message ||
                          'Có lỗi xảy ra khi xóa danh mục!'
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return FolderOpen
      case 'product': return ShoppingBag
      case 'pet': return Heart
      case 'content': return FolderOpen
      default: return FolderOpen
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'blue'
      case 'product': return 'emerald'
      case 'pet': return 'pink'
      case 'content': return 'indigo'
      default: return 'slate'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'service': return 'Dịch vụ'
      case 'product': return 'Sản phẩm'
      case 'pet': return 'Thú cưng'
      case 'content': return 'Nội dung'
      default: return type
    }
  }

  const parentCategories = categories.filter(cat => !cat.parentId)

  const columns = [
    {
      key: 'name',
      label: 'Thông tin danh mục',
      render: (value: any, category: Category) => {
        if (!category) return ''
        const IconComponent = getTypeIcon(category.type)
        return (
          <div className="flex items-center gap-3">
            <IconComponent className="w-5 h-5 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">{category.name}</div>
              {category.description && (
                <div className="text-sm text-gray-500">{category.description}</div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'type',
      label: 'Loại',
      render: (value: any, category: Category) => {
        if (!category) return ''
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            category.type === 'service' 
              ? 'bg-blue-100 text-blue-800'
              : category.type === 'product'
              ? 'bg-green-100 text-green-800'
              : category.type === 'content'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {getTypeName(category.type)}
          </span>
        )
      }
    },
    {
      key: 'parent',
      label: 'Danh mục cha',
      render: (value: any, category: Category) => {
        if (!category) return '-'
        return category.parent?.name || (category.parentId ? 'Đang tải...' : '-')
      }
    },
    {
      key: 'children',
      label: 'Danh mục con',
      render: (value: any, category: Category) => {
        if (!category) return '0 danh mục'
        return (
          <span className="text-gray-600">
            {category.children?.length || 0} danh mục
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, category: Category) => {
        if (!category) return null
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Edit className="w-4 h-4" />
              Sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(category)}
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-600">Quản lý các danh mục dịch vụ, sản phẩm và thú cưng</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Thêm danh mục
          </Button>
        </div>
      </Card>

      {/* Type Filter */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Lọc theo loại</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'service', label: 'Dịch vụ', icon: FolderOpen },
            { value: 'product', label: 'Sản phẩm', icon: ShoppingBag },
            { value: 'pet', label: 'Thú cưng', icon: Heart },
            { value: 'content', label: 'Nội dung', icon: FolderOpen }
          ].map((type) => {
            const IconComponent = type.icon
            const isActive = typeFilter === type.value
            return (
              <Button
                key={type.value}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange(type.value)}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {type.label}
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
        </div>
        <Input
          placeholder="Tìm kiếm danh mục..."
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="max-w-md"
        />
      </Card>


      {/* Categories Table */}
      <Card padding="none">
        {categories.length > 0 ? (
          <Table
            columns={columns}
            data={categories}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title={`Chưa có danh mục ${getTypeName(typeFilter).toLowerCase()} nào`}
              description="Bắt đầu bằng cách thêm danh mục đầu tiên"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm danh mục
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
        title={selectedCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên danh mục *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên danh mục"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại danh mục *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'service' | 'product' | 'pet' | 'content' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            >
              <option value="service">Dịch vụ</option>
              <option value="product">Sản phẩm</option>
              <option value="pet">Thú cưng</option>
              <option value="content">Nội dung</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục cha
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
            >
              <option value="">Không có danh mục cha</option>
              {parentCategories
                .filter(cat => cat.type === formData.type && cat.id !== selectedCategory?.id)
                .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả danh mục"
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
              {selectedCategory ? 'Cập nhật' : 'Thêm mới'}
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
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"?
          </p>
          {selectedCategory?.children && selectedCategory.children.length > 0 && (
            <p className="text-sm text-orange-600">
              Danh mục này có {selectedCategory.children.length} danh mục con. Việc xóa sẽ ảnh hưởng đến các danh mục con.
            </p>
          )}
          <p className="text-sm text-red-600">
            Hành động này không thể hoàn tác.
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

export default Categories