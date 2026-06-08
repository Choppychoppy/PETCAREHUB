import { useState, useEffect } from 'react'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { adminService } from '@/services/admin.service'
import type { Service, Category, PaginatedResponse } from '@/types'
import { formatVND } from '@/utils'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { Plus, Search, Edit, Trash2, Stethoscope, Filter, Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const Services = () => {
  const [services, setServices] = useState<Service[]>([])
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
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    categoryId: '',
    petTypes: [] as string[],
    imageUrl: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [petTypeFilter, setPetTypeFilter] = useState<string>('')

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchServices = async (page = 1, search = '', categoryId = '', petType = '') => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: pagination.limit
      }

      if (search) params.search = search
      if (categoryId) params.categoryId = categoryId
      if (petType) params.petType = petType

      const response: PaginatedResponse<Service> = await adminService.getServices(params)
      setServices(response.data)
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages
      })
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Không thể tải danh sách dịch vụ')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories({ type: 'service' })
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    }
  }

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [])

  // Debounced search effect (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Trigger fetch when filters change
  useEffect(() => {
    fetchServices(1, searchQuery, categoryFilter, petTypeFilter)
  }, [searchQuery, categoryFilter, petTypeFilter])

  const handleSearchInput = (query: string) => {
    setSearchInput(query)
  }

  const handlePageChange = (page: number) => {
    fetchServices(page, searchQuery, categoryFilter, petTypeFilter)
  }

  const resetFilters = () => {
    setCategoryFilter('')
    setPetTypeFilter('')
    setSearchQuery('')
    setSearchInput('')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    const toastId = toast.loading('Đang tải ảnh lên...')

    try {
      const file = files[0]

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, 'services')

      // Update form data with uploaded image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: uploadResult.secure_url
      }))

      toast.success('Tải ảnh thành công!', { id: toastId })

      // Reset input
      event.target.value = ''
    } catch (error: any) {
      console.error('Failed to upload image:', error)
      toast.error(error.message || 'Không thể tải ảnh lên', { id: toastId })
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }))
    toast.success('Đã xóa ảnh')
  }

  const handleCreate = () => {
    setSelectedService(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: '',
      petTypes: [],
      imageUrl: ''
    })
    setShowModal(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: (service.price || 0).toString(),
      duration: (service.duration || 0).toString(),
      categoryId: service.categoryId || '',
      petTypes: service.petTypes || [],
      imageUrl: service.imageUrl || ''
    })
    setShowModal(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setShowDeleteModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng nhập tên và mô tả dịch vụ')
      return
    }

    if (formData.petTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại thú cưng')
      return
    }

    if (parseFloat(formData.price) <= 0 || parseInt(formData.duration) <= 0) {
      toast.error('Giá và thời lượng phải lớn hơn 0')
      return
    }

    const toastId = toast.loading(
      selectedService ? 'Đang cập nhật dịch vụ...' : 'Đang tạo dịch vụ mới...'
    )

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        categoryId: formData.categoryId,
        petTypes: formData.petTypes,
        imageUrl: formData.imageUrl || undefined
      }

      if (selectedService) {
        await adminService.updateService(selectedService.id, serviceData)
        toast.success('Cập nhật dịch vụ thành công!', { id: toastId })
      } else {
        await adminService.createService(serviceData)
        toast.success('Tạo dịch vụ mới thành công!', { id: toastId })
      }

      setShowModal(false)
      fetchServices(pagination.page, searchQuery, categoryFilter, petTypeFilter)
    } catch (error: any) {
      console.error('Failed to save service:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi lưu dịch vụ!'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const confirmDelete = async () => {
    if (!selectedService) return

    const toastId = toast.loading('Đang xóa dịch vụ...')

    try {
      await adminService.deleteService(selectedService.id)
      toast.success('Xóa dịch vụ thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedService(null)
      fetchServices(pagination.page, searchQuery, categoryFilter, petTypeFilter)
    } catch (error: any) {
      console.error('Failed to delete service:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Có lỗi xảy ra khi xóa dịch vụ!'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Thông tin dịch vụ',
      render: (value: any, service: Service) => {
        if (!service) return ''
        return (
          <div className="flex items-center gap-3">
            {service.imageUrl ? (
              <img 
                src={service.imageUrl} 
                alt={service.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling!.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center ${service.imageUrl ? 'hidden' : ''}`}>
              <Stethoscope className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{service.name}</div>
              {service.category?.name && (
                <div className="text-sm text-gray-500 truncate">{service.category.name}</div>
              )}
              {service.description && (
                <div className="text-xs text-gray-400 truncate mt-1 max-w-xs">{service.description}</div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'price',
      label: 'Giá',
      render: (value: any, service: Service) => {
        if (!service) return ''
        return (
          <div className="font-semibold text-[#2E86AB]">
            {formatVND(service.price || 0)}
          </div>
        )
      }
    },
    {
      key: 'duration',
      label: 'Thời lượng',
      render: (value: any, service: Service) => {
        if (!service) return ''
        const getPetTypeLabel = (petType: string) => {
          const labels: Record<string, string> = {
            'dog': '🐕 Chó',
            'cat': '🐱 Mèo', 
            'bird': '🐦 Chim',
            'fish': '🐟 Cá',
            'rabbit': '🐰 Thỏ',
            'hamster': '🐹 Chuột'
          }
          return labels[petType] || petType
        }
        
        return (
          <div className="space-y-1">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {service.duration || 0} phút
            </span>
            {service.petTypes && service.petTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {service.petTypes.slice(0, 2).map((petType: string, index: number) => (
                  <span key={index} className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                    {getPetTypeLabel(petType)}
                  </span>
                ))}
                {service.petTypes.length > 2 && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    +{service.petTypes.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, service: Service) => {
        if (!service) return ''
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(service)}
            >
              <Edit className="w-4 h-4" />
              Sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(service)}
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý dịch vụ</h1>
            <p className="text-gray-600">Quản lý các dịch vụ chăm sóc thú cưng</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Thêm dịch vụ
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Danh mục</h3>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Card>

        {/* Pet Type Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Loại thú cưng</h3>
          </div>
          <select
            value={petTypeFilter}
            onChange={(e) => setPetTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
          >
            <option value="">Tất cả loại</option>
            <option value="Chó">Chó</option>
            <option value="Mèo">Mèo</option>
            <option value="Chim">Chim</option>
            <option value="Cá">Cá</option>
            <option value="Thỏ">Thỏ</option>
            <option value="Chuột hamster">Chuột hamster</option>
          </select>
        </Card>

        {/* Search */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Tìm kiếm dịch vụ..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
            {(categoryFilter || petTypeFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Services Table */}
      <Card padding="none">
        {services.length > 0 ? (
          <Table
            columns={columns}
            data={services}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : (
          <div className="p-6">
            <EmptyState
              title="Chưa có dịch vụ nào"
              description="Bắt đầu bằng cách thêm dịch vụ đầu tiên"
              action={
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm dịch vụ
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
        title={selectedService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên dịch vụ *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên dịch vụ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập mô tả dịch vụ"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại thú cưng phù hợp *
            </label>
            <div className="space-y-2">
              {['Chó', 'Mèo', 'Chim', 'Cá', 'Thỏ', 'Chuột hamster'].map((petType) => (
                <label key={petType} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.petTypes.includes(petType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, petTypes: [...formData.petTypes, petType] })
                      } else {
                        setFormData({ ...formData, petTypes: formData.petTypes.filter(t => t !== petType) })
                      }
                    }}
                    className="w-4 h-4 text-[#2E86AB] border-gray-300 rounded focus:ring-[#2E86AB]"
                  />
                  <span className="text-sm text-gray-700">
                    {petType}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh dịch vụ
            </label>
            <div className="space-y-3">
              {/* Upload Button */}
              {!formData.imageUrl && (
                <div>
                  <label htmlFor="service-image-upload" className="block">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadingImage
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-gray-300 hover:border-[#2E86AB] hover:bg-blue-50'
                    }`}>
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <Loading size="md" />
                          <p className="mt-2 text-sm text-gray-600">Đang tải ảnh lên...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Nhấn để chọn ảnh
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, WebP (tối đa 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    id="service-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>
              )}

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="relative group inline-block">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.png'
                    }}
                  />
                  <Button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-7 h-7 p-0 bg-red-500 hover:bg-red-600 rounded-full shadow-md"
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá (VNĐ) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời lượng (phút) *
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="0"
                min="1"
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
              {selectedService ? 'Cập nhật' : 'Thêm mới'}
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
            Bạn có chắc chắn muốn xóa dịch vụ "{selectedService?.name}"?
          </p>
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

export default Services