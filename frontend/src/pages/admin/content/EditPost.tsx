import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Loading } from '@/components/common'
import { adminService } from '@/services'
import { uploadToCloudinary } from '@/utils/cloudinary'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, Trash2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react'

interface FormData {
  title: string
  content: string
  type: string
  status: string
  isFeatured: boolean
  isPinned: boolean
  categoryId: string
  tags: string[]
  images: string[]
  seoMeta: {
    title: string
    description: string
    keywords: string[]
  }
}

const EditPost: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [newTag, setNewTag] = useState('')
  const [newImage, setNewImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [keywordsInput, setKeywordsInput] = useState('')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    type: 'post',
    status: 'draft',
    isFeatured: false,
    isPinned: false,
    categoryId: '',
    tags: [],
    images: [],
    seoMeta: {
      title: '',
      description: '',
      keywords: []
    }
  })

  useEffect(() => {
    if (id) {
      fetchPost()
      fetchCategories()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setInitialLoading(true)
      const response = await adminService.getPost(id!)
      const post = response.data || response // Handle both response formats
      
      const newFormData = {
        title: post.title || '',
        content: post.content || '',
        type: post.type || 'post',
        status: post.status || 'draft',
        isFeatured: post.isFeatured || false,
        isPinned: post.isPinned || false,
        categoryId: post.categoryId || '',
        tags: post.tags || [],
        images: post.images || [],
        seoMeta: post.seoMeta ? {
          title: post.seoMeta.title || '',
          description: post.seoMeta.description || '',
          keywords: post.seoMeta.keywords || []
        } : {
          title: '',
          description: '',
          keywords: []
        }
      }
      
      console.log('Setting form data:', newFormData)
      setFormData(newFormData)
      
      // Set keywords input for UI
      if (post.seoMeta?.keywords && Array.isArray(post.seoMeta.keywords)) {
        setKeywordsInput(post.seoMeta.keywords.join(', '))
      }
    } catch (error: any) {
      console.error('Failed to fetch post:', error)
      toast.error('Không thể tải thông tin bài viết')
      navigate('/admin/content')
    } finally {
      setInitialLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories({ type: 'content' })
      const categoriesData = response.data || response || []
      console.log('Fetched categories:', categoriesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({ ...prev, images: [...prev.images, newImage.trim()] }))
      setNewImage('')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    const toastId = toast.loading('Đang tải ảnh lên...')

    try {
      const file = files[0]

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, 'posts')

      // Add image to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, uploadResult.secure_url]
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
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value)
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0)
    setFormData(prev => ({ ...prev, seoMeta: { ...prev.seoMeta, keywords } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung')
      return
    }

    setLoading(true)
    try {
      await adminService.updatePost(id!, formData)
      toast.success('Cập nhật bài viết thành công!')
      navigate('/admin/content')
    } catch (error: any) {
      console.error('Failed to update post:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      return
    }

    setLoading(true)
    try {
      await adminService.deletePost(id!)
      toast.success('Xóa bài viết thành công!')
      navigate('/admin/content')
    } catch (error: any) {
      console.error('Failed to delete post:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa bài viết'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề để xem trước')
      return
    }
    
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>${formData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2E86AB; }
              .content { line-height: 1.6; }
              .featured-image { width: 100%; max-height: 400px; object-fit: cover; margin-bottom: 20px; }
              .tags { margin-top: 20px; }
              .tag { display: inline-block; background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 4px; margin-right: 8px; font-size: 12px; }
            </style>
          </head>
          <body>
            ${formData.images.length > 0 ? `<img src="${formData.images[0]}" alt="${formData.title}" class="featured-image">` : ''}
            <h1>${formData.title}</h1>
            <div class="content">${formData.content.replace(/\n/g, '<br>')}</div>
            ${formData.tags.length > 0 ? `<div class="tags">${formData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
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
            onClick={() => navigate('/admin/content')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!formData.title.trim()}
          >
            <Eye className="w-4 h-4 mr-2" />
            Xem trước
          </Button>
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
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nhập tiêu đề bài viết..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Nhập tag..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline" size="sm">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Nhập nội dung bài viết..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={15}
                  required
                />
              </div>
            </div>
          </Card>

          {/* SEO Settings */}
          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <Input
                  value={formData.seoMeta.title}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seoMeta: { ...prev.seoMeta, title: e.target.value }
                  }))}
                  placeholder="Tiêu đề SEO..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.seoMeta.description}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seoMeta: { ...prev.seoMeta, description: e.target.value }
                  }))}
                  placeholder="Mô tả SEO..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <Input
                  value={keywordsInput}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="từ khóa 1, từ khóa 2, ..."
                />
                <p className="text-xs text-gray-500 mt-1">Nhập các từ khóa cách nhau bằng dấu phẩy</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt bài viết</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại bài viết
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                >
                  <option value="post">Bài viết</option>
                  <option value="user_post">Bài viết người dùng</option>
                  <option value="page">Trang</option>
                  <option value="news">Tin tức</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                >
                  <option value="draft">Nháp</option>
                  <option value="published">Xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
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
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Bài viết nổi bật</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ghim bài viết</span>
                </label>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh</h3>
            <div className="space-y-4">
              {/* Upload Area */}
              <div>
                <label
                  htmlFor="post-image-upload"
                  className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImage
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-300 hover:border-[#2E86AB] hover:bg-[#2E86AB]/5'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center">
                      <Loading size="sm" />
                      <p className="mt-2 text-sm text-gray-500">Đang tải lên...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        Nhấp để tải ảnh lên
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF, WebP (tối đa 10MB)
                      </p>
                    </div>
                  )}
                </label>
                <input
                  id="post-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </div>

              {/* URL Input (alternative) */}
              <div className="flex gap-2">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Hoặc nhập URL hình ảnh..."
                  className="flex-1"
                />
                <Button type="button" onClick={addImage} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Image Grid */}
              {formData.images.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
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
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Chưa có ảnh nào</p>
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
                  Cập nhật bài viết
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditPost