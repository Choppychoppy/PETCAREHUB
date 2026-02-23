import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Loading } from '@/components/common'
import { adminService } from '@/services/admin.service'
import { uploadToCloudinary } from '@/utils/cloudinary'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

interface ProductImage {
  url: string
  altText: string
  sortOrder?: number
}

interface FormData {
  name: string
  description: string
  shortDescription: string
  price: number
  comparePrice: number
  stockQuantity: number
  lowStockThreshold: number
  brand: string
  weight: number
  categoryId: string
  isDigital: boolean
  requiresShipping: boolean
  tags: string[]
  images: ProductImage[]
  specifications: Record<string, any>
}

const CreateProduct: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    brand: '',
    weight: 0,
    categoryId: '',
    isDigital: false,
    requiresShipping: true,
    tags: [],
    images: [],
    specifications: {}
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories({ type: 'product' })
      console.log('Categories response:', response) // Debug log
      
      // Handle different response formats
      let categoriesData = []
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          categoriesData = response.data
        } else if (Array.isArray(response)) {
          categoriesData = response
        }
      }
      
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Không thể tải danh mục sản phẩm')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng nhập tên và mô tả sản phẩm')
      return
    }

    if (formData.price <= 0) {
      toast.error('Giá sản phẩm phải lớn hơn 0')
      return
    }

    setLoading(true)
    try {
      // Chỉ gửi những field được backend chấp nhận
      const productData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        price: formData.price,
        comparePrice: formData.comparePrice || undefined,
        stockQuantity: formData.stockQuantity || undefined,
        lowStockThreshold: formData.lowStockThreshold || undefined,
        weight: formData.weight || undefined,
        brand: formData.brand || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        categoryId: formData.categoryId,
        isDigital: formData.isDigital || undefined,
        requiresShipping: formData.requiresShipping || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : undefined
      }

      // Xóa các field undefined để tránh gửi fields rỗng
      Object.keys(productData).forEach(key => {
        if (productData[key as keyof typeof productData] === undefined) {
          delete productData[key as keyof typeof productData]
        }
      })

      await adminService.createProduct(productData)
      toast.success('Tạo sản phẩm thành công!')
      navigate('/admin/products')
    } catch (error: any) {
      console.error('Failed to create product:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    const toastId = toast.loading('Đang tải ảnh lên...')

    try {
      const file = files[0]

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, 'products')

      // Add image to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, {
          url: uploadResult.secure_url,
          altText: formData.name || 'Product image',
          sortOrder: prev.images.length
        }]
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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    toast.success('Đã xóa ảnh')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Tạo sản phẩm mới</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên sản phẩm *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập tên sản phẩm..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả ngắn
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Mô tả ngắn về sản phẩm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chi tiết sản phẩm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thương hiệu
                  </label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Tên thương hiệu..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cân nặng (kg)
                  </label>
                  <Input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Giá và tồn kho</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá bán * (VND)
                </label>
                <Input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                  required
                />
                {formData.price > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(formData.price)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá so sánh (VND)
                </label>
                <Input
                  type="number"
                  value={formData.comparePrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
                {formData.comparePrice > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCurrency(formData.comparePrice)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng hàng tồn kho thấp
                </label>
                <Input
                  type="number"
                  value={formData.lowStockThreshold || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                  placeholder="5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng tồn kho
                </label>
                <Input
                  type="number"
                  value={formData.stockQuantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh sản phẩm</h3>
            <div className="space-y-4">
              {/* Upload Button */}
              <div>
                <label htmlFor="product-image-upload" className="block">
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
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </div>

              {/* Image Grid */}
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.altText}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.png'
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-7 h-7 p-0 bg-red-500 hover:bg-red-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </Button>
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-[#2E86AB] text-white text-xs px-2 py-1 rounded-md shadow-sm font-medium">
                          Ảnh chính
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Chưa có ảnh nào</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt sản phẩm</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDigital}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDigital: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sản phẩm số (Digital)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresShipping}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresShipping: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Yêu cầu vận chuyển</span>
                </label>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nhập tag..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="sticky top-6">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loading size="sm" />
                  <span className="ml-2">Đang tạo...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Tạo sản phẩm
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateProduct