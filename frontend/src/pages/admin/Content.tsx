import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Modal, Input, Card, Loading, EmptyState } from '@/components/common'
import { apiClient } from '@/lib/api/client'
import { Plus, Search, Filter, FileText, Edit, Trash2, AlertTriangle, Eye, Calendar, User, Tag, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  type: 'blog' | 'user_post' | 'question'
  status: 'published' | 'draft' | 'archived'
  categoryId?: string
  category?: {
    id: string
    name: string
    type: string
  }
  tags: string[]
  images: string[]
  seoMeta: {
    title: string
    description: string
    keywords: string[]
  }
  views: number
  likesCount: number
  commentsCount: number
  isPinned: boolean
  isFeatured: boolean
  authorId: string
  author?: {
    id: string
    email: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

const Content = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  useEffect(() => {
    fetchPosts()
  }, [pagination.page, searchQuery, typeFilter, statusFilter, categoryFilter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const fetchPosts = async (page = pagination.page, search = searchQuery, type = typeFilter, status = statusFilter, category = categoryFilter) => {
    try {
      setLoading(true)
      const params: any = { page, limit: pagination.limit }
      
      if (search) params.search = search
      if (type) params.type = type
      if (status) params.status = status
      if (category) params.categoryId = category

      console.log('Fetching posts with params:', params)
      const response = await apiClient.get('/posts', { params })
      console.log('Posts response:', response)
      
      // Ensure data is array
      const postsData = Array.isArray(response.data) ? response.data : []
      setPosts(postsData)
      
      if (response.meta) {
        setPagination(prev => ({
          ...prev,
          page: response.meta.page || page,
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast.error('Không thể tải danh sách nội dung')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    navigate('/admin/content/create')
  }

  const handleEdit = (post: Post) => {
    navigate(`/admin/content/edit/${post.id}`)
  }

  const handleDelete = (post: Post) => {
    setSelectedPost(post)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedPost) return

    const toastId = toast.loading('Đang xóa...')
    try {
      await apiClient.delete(`/posts/${selectedPost.id}`)
      toast.success('Xóa nội dung thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedPost(null)
      fetchPosts(pagination.page, searchQuery, typeFilter, statusFilter, categoryFilter)
    } catch (error: any) {
      console.error('Failed to delete post:', error)
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra khi xóa nội dung'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const resetFilters = () => {
    setTypeFilter('')
    setStatusFilter('')
    setCategoryFilter('')
    setSearchQuery('')
    setSearchInput('')
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'post': return 'Bài viết'
      case 'page': return 'Trang'
      case 'news': return 'Tin tức'
      default: return type
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      published: 'Đã xuất bản',
      draft: 'Bản nháp',
      archived: 'Lưu trữ'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const columns = [
    {
      key: 'info',
      label: 'Thông tin bài viết',
      render: (value: any, post: Post) => {
        if (!post) return <span>-</span>
        return (
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">{post.title}</div>
              {post.category && (
                <div className="text-sm text-gray-500">{post.category.name}</div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'type',
      label: 'Loại',
      render: (value: any, post: Post) => {
        if (!post) return <span>-</span>
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            post.type === 'blog' 
              ? 'bg-blue-100 text-blue-800'
              : post.type === 'user_post'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {getTypeLabel(post.type)}
          </span>
        )
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value: any, post: Post) => {
        if (!post) return <span>-</span>
        return getStatusBadge(post.status)
      }
    },
    {
      key: 'author',
      label: 'Tác giả',
      render: (value: any, post: Post) => {
        if (!post || !post.author) return <span>-</span>
        return (
          <span className="text-gray-600">
            {post.author.email}
          </span>
        )
      }
    },
    {
      key: 'stats',
      label: 'Thống kê',
      render: (value: any, post: Post) => {
        if (!post) return <span>0</span>
        return (
          <span className="text-gray-600">
            {post.views} lượt xem, {post.likesCount} thích
          </span>
        )
      }
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (value: any, post: Post) => {
        if (!post) return null
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(post)}
            >
              <Edit className="w-4 h-4" />
              Sửa
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(post)}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý nội dung</h1>
            <p className="text-gray-600">Tạo và quản lý bài viết, trang và tin tức</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Tạo nội dung mới
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Type Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Loại nội dung</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: '', label: 'Tất cả' },
              { value: 'blog', label: 'Blog' },
              { value: 'user_post', label: 'Bài viết của người dùng' },
              { value: 'question', label: 'Câu hỏi' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={typeFilter === option.value}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Status Filter */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Trạng thái</h3>
          </div>
          <div className="space-y-2">
            {[
              { value: '', label: 'Tất cả' },
              { value: 'published', label: 'Đã xuất bản' },
              { value: 'draft', label: 'Bản nháp' },
              { value: 'archived', label: 'Lưu trữ' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={statusFilter === option.value}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Search */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Tìm kiếm</h3>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Tìm theo tiêu đề, nội dung..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {(typeFilter || statusFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Content Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loading size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="Chưa có nội dung nào"
            description="Bắt đầu tạo bài viết đầu tiên của bạn"
            action={
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo nội dung mới
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden">
            <Table 
              columns={columns} 
              data={posts}
              pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages
              }}
              onPageChange={(page) => {
                setPagination(prev => ({ ...prev, page }))
                fetchPosts(page, searchQuery, typeFilter, statusFilter, categoryFilter)
              }}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa "{selectedPost?.title}"?
          </p>
          <p className="text-sm text-red-600">
            ⚠️ Hành động này không thể hoàn tác!
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

export default Content