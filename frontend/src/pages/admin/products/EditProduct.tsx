import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Select, Loading } from '@/components/common'
import { adminService } from '@/services'
import { uploadToCloudinary } from '@/utils/cloudinary'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, X, Trash2, Upload, Image as ImageIcon } from 'lucide-react'

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
  weight: number
  brand: string
  categoryId: string
  tags: string[]
  images: Array<{ url: string; altText?: string; sortOrder?: number }>
  isActive: boolean
  isDigital: boolean
  requiresShipping: boolean
  featured: boolean
}

const EditProduct: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
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
    weight: 0,
    brand: '',
    categoryId: '',
    tags: [],
    images: [],
    isActive: true,
    isDigital: false,
    requiresShipping: true,
    featured: false
  })

  useEffect(() => {
    if (id) {
      fetchProduct()
      fetchCategories()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setInitialLoading(true)
      const response = await adminService.getProduct(id!)
      const product = response.data || response // Handle both response formats
      
      // Extract image objects from image entities
      let imageObjs: Array<{ url: string; altText?: string; sortOrder?: number }> = []
      if (product.images && Array.isArray(product.images)) {
        imageObjs = product.images.map((img: any, index: number) => {
          if (typeof img === 'string') {
            return { url: img, altText: product.name, sortOrder: index }
          } else {
            return {
              url: img.imageUrl || img.url || img,
              altText: img.altText || product.name,
              sortOrder: img.sortOrder || index
            }
          }
        })
      }
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || 0,
        comparePrice: product.comparePrice || 0,
        stockQuantity: product.stockQuantity || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        weight: product.weight || 0,
        brand: product.brand || '',
        categoryId: product.categoryId || '',
        tags: product.tags || [],
        images: imageObjs,
        isActive: product.isActive !== undefined ? product.isActive : true,
        isDigital: product.isDigital || false,
        requiresShipping: product.requiresShipping !== undefined ? product.requiresShipping : true,
        featured: product.featured || false
      })
    } catch (error: any) {
      console.error('Failed to fetch product:', error)
      toast.error('Không thể tải thông tin sản phẩm')
      navigate('/admin/products')
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories({ type: 'product' })
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
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
      // Only send fields that backend accepts
      const updateData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        price: formData.price,
        comparePrice: formData.comparePrice || undefined,
        stockQuantity: formData.stockQuantity,
        lowStockThreshold: formData.lowStockThreshold,
        weight: formData.weight || undefined,
        brand: formData.brand || undefined,
        categoryId: formData.categoryId,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        images: formData.images.length > 0 ? formData.images : [],
        isDigital: formData.isDigital,
        requiresShipping: formData.requiresShipping
      }

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })
      
      console.log('Submitting product update with data:', updateData)
      console.log('Images being sent:', formData.images)
      
      await adminService.updateProduct(id!, updateData)
      toast.success('Cập nhật sản phẩm thành công!')
      navigate('/admin/products')
    } catch (error: any) {
      console.error('Failed to update product:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      return
    }

    setLoading(true)
    try {
      await adminService.deleteProduct(id!)
      toast.success('Xóa sản phẩm thành công!')
      navigate('/admin/products')
    } catch (error: any) {
      console.error('Failed to delete product:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm'
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
        </div>
        
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa
        </Button>
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
                    Trọng lượng (kg)
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
                  Ngưỡng cảnh báo tồn kho
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
                <label htmlFor="product-image-upload-edit" className="block">
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
                  id="product-image-upload-edit"
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
                  {formData.images.map((imageObj, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageObj.url}
                        alt={imageObj.altText || formData.name}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sản phẩm hoạt động</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Hiển thị sản phẩm trên website</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Hiển thị trong danh sách nổi bật</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDigital}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDigital: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sản phẩm số</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Sản phẩm không cần vận chuyển vật lý</p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresShipping}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresShipping: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Cần vận chuyển</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Sản phẩm cần giao hàng tận nơi</p>
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
                  <span className="ml-2">Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Cập nhật sản phẩm
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditProduct