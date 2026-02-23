import { useState, useRef, useEffect } from 'react'
import { X, Image as ImageIcon, Smile, Send } from 'lucide-react'
import { Modal, Button, Input } from '@/components/common'
import type { Post } from '@/types'
import toast from 'react-hot-toast'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    content: string
    type: 'user' | 'question'
    images: File[]
    existingImages?: string[] // Keep track of existing image URLs when editing
  }) => Promise<void>
  currentUserName?: string
  editPost?: Post | null
}

export const CreatePostModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUserName,
  editPost
}: CreatePostModalProps) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'user' | 'question'>('user')
  const [newImages, setNewImages] = useState<File[]>([]) // New images to upload
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]) // Previews of new images
  const [existingImages, setExistingImages] = useState<string[]>([]) // Existing Cloudinary URLs
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fill data when editing
  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title)
      setContent(editPost.content)
      setPostType(editPost.type as 'user' | 'question')

      // Load existing images (Cloudinary URLs)
      const images = (editPost as any).images
      if (images && Array.isArray(images)) {
        setExistingImages(images)
      } else {
        setExistingImages([])
      }
      setNewImages([])
      setNewImagePreviews([])
    } else {
      // Reset when creating new
      setTitle('')
      setContent('')
      setPostType('user')
      setNewImages([])
      setNewImagePreviews([])
      setExistingImages([])
    }
  }, [editPost])

  const totalImages = existingImages.length + newImages.length

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length + totalImages > 5) {
      toast.error('Chỉ được chọn tối đa 5 ảnh')
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} không phải là file ảnh`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} vượt quá 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setNewImages(prev => [...prev, ...validFiles])

      // Create previews for new images
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề')
      return
    }

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(editPost ? 'Đang cập nhật...' : 'Đang đăng bài...')

    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        type: postType,
        images: newImages,
        existingImages: existingImages
      })

      // Dismiss loading toast on success (success message handled in Community.tsx)
      toast.dismiss(toastId)
      handleClose()
    } catch (error: any) {
      console.error('Failed to save post:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          (editPost ? 'Có lỗi xảy ra khi cập nhật!' : 'Có lỗi xảy ra khi đăng bài!')
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setPostType('user')
    setNewImages([])
    setNewImagePreviews([])
    setExistingImages([])
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Info */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#F18F01] flex items-center justify-center text-white font-semibold text-lg">
            {currentUserName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {currentUserName || 'Người dùng'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as 'user' | 'question')}
                className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
                disabled={isSubmitting}
              >
                <option value="user">Bài viết thường</option>
                <option value="question">Câu hỏi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài viết..."
            maxLength={200}
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {title.length}/200
          </p>
        </div>

        {/* Content Textarea */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'question'
                ? 'Mô tả vấn đề của bạn chi tiết nhất có thể...'
                : 'Bạn đang nghĩ gì?'
            }
            rows={6}
            maxLength={5000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] resize-none"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {content.length}/5000
          </p>
        </div>

        {/* Image Previews */}
        {totalImages > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {/* Existing images (from Cloudinary) */}
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={imageUrl}
                  alt={`Existing ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {/* New images (to be uploaded) */}
            {newImagePreviews.map((preview, index) => (
              <div
                key={`new-${index}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`New ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={isSubmitting || totalImages >= 5}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Thêm ảnh"
              disabled={isSubmitting || totalImages >= 5}
            >
              <ImageIcon className="w-5 h-5 text-[#2E86AB]" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Thêm emoji"
              disabled={isSubmitting}
            >
              <Smile className="w-5 h-5 text-[#F18F01]" />
            </button>
            {totalImages > 0 && (
              <span className="text-sm text-gray-600">
                {totalImages}/5 ảnh
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting
                ? (editPost ? 'Đang cập nhật...' : 'Đang đăng...')
                : (editPost ? 'Cập nhật' : 'Đăng bài')
              }
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default CreatePostModal
