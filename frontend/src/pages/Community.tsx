import { useState, useEffect } from 'react'
import { Button, Card, Loading } from '@/components/common'
import { PostCardWithComments, CreatePostModal } from '@/components/community'
import { communityService, authService } from '@/services'
import type { Post, Comment } from '@/types'
import {
  PlusCircle,
  MessageCircle,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [stats, setStats] = useState({ members: 0, posts: 0, discussions: 0 })

  const isAuthenticated = authService.isAuthenticated()
  const currentUser = authService.getCachedUser()

  useEffect(() => {
    fetchPosts()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await communityService.getCommunityStats()
      setStats(response.data || response as any)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      // Lấy tất cả bài viết do người dùng tạo (kể cả dữ liệu cũ type 'user_post' và câu hỏi)
      const response = await communityService.getPosts({ types: 'user,user_post,question', limit: 20 })
      setPosts(response.data || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast.error('Không thể tải bài viết')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }


  const handleCreatePost = async (data: {
    title: string
    content: string
    type: 'user' | 'question'
    images: File[]
    existingImages?: string[]
  }) => {
    try {
      if (editingPost) {
        // Update existing post with new images
        await communityService.updatePost(editingPost.id, {
          title: data.title,
          content: data.content,
          type: data.type,
          images: data.existingImages, // Keep existing images that weren't removed
          newImages: data.images, // New images to upload
        })
        toast.success('Đã cập nhật bài viết!')
      } else {
        // Create new post
        await communityService.createPost(data)
        toast.success('Đã tạo bài viết!')
      }

      setShowCreatePost(false)
      setEditingPost(null)
      fetchPosts()
    } catch (error) {
      console.error('Failed to save post:', error)
      toast.error('Không thể lưu bài viết')
    }
  }

  const handleToggleLike = async (postId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bài viết')
      return
    }

    try {
      const result = await communityService.toggleLike('post', postId)

      // Update posts state with both likesCount and isLiked
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likesCount: (post.likesCount || 0) + (result.liked ? 1 : -1),
                isLiked: result.liked
              } as any
            : post
        )
      )

      if (result.liked) {
        toast.success('Đã thích bài viết')
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast.error('Không thể thích bài viết')
    }
  }

  const handleLoadComments = async (postId: string): Promise<Comment[]> => {
    try {
      const response = await communityService.getComments(postId)
      return response.data || response as any || []
    } catch (error) {
      console.error('Failed to load comments:', error)
      return []
    }
  }

  const handleAddComment = async (postId: string, content: string, parentId?: string): Promise<void> => {
    try {
      await communityService.createComment(postId, { content, parentId })

      // Update commentsCount for the post
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
            : post
        )
      )
    } catch (error: any) {
      console.error('Failed to add comment:', error)
      const errorMessage = error?.response?.data?.message || 'Không thể thêm bình luận'
      throw new Error(errorMessage)
    }
  }

  const handleUpdateComment = async (commentId: string, content: string): Promise<void> => {
    try {
      await communityService.updateComment(commentId, content)
    } catch (error: any) {
      console.error('Failed to update comment:', error)
      const errorMessage = error?.response?.data?.message || 'Không thể cập nhật bình luận'
      throw new Error(errorMessage)
    }
  }

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    try {
      await communityService.deleteComment(commentId)
    } catch (error: any) {
      console.error('Failed to delete comment:', error)
      const errorMessage = error?.response?.data?.message || 'Không thể xóa bình luận'
      throw new Error(errorMessage)
    }
  }

  const handleLikeComment = async (commentId: string): Promise<void> => {
    try {
      await communityService.toggleLike('comment', commentId)
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      // Copy link to clipboard
      const postUrl = `${window.location.origin}/community/posts/${postId}`
      await navigator.clipboard.writeText(postUrl)
      toast.success('Đã sao chép liên kết!')
    } catch (error) {
      toast.error('Không thể sao chép liên kết')
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setShowCreatePost(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      return
    }

    const toastId = toast.loading('Đang xóa bài viết...')
    try {
      await communityService.deletePost(postId)
      toast.success('Đã xóa bài viết!', { id: toastId })
      fetchPosts()
    } catch (error) {
      console.error('Failed to delete post:', error)
      toast.error('Không thể xóa bài viết', { id: toastId })
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Cộng đồng Pet Lovers 🐾
              </h1>
              <p className="text-gray-600">
                Chia sẻ câu chuyện, kết nối với những người yêu thú cưng
              </p>
            </div>

            {isAuthenticated && (
              <Button
                onClick={() => {
                  setEditingPost(null)
                  setShowCreatePost(true)
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Tạo bài viết
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loading text="Đang tải..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {posts.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có bài viết
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Hãy là người đầu tiên chia sẻ câu chuyện của bạn!
                  </p>
                  {isAuthenticated && (
                    <Button onClick={() => setShowCreatePost(true)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Tạo bài viết đầu tiên
                    </Button>
                  )}
                </Card>
              ) : (
                posts.map(post => (
                  <PostCardWithComments
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                    onLike={handleToggleLike}
                    onShare={handleShare}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onLoadComments={handleLoadComments}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    onLikeComment={handleLikeComment}
                  />
                ))
              )}
            </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Trending Topics */}
                  <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Chủ đề hot
                    </h3>
                    <div className="space-y-3">
                      {['#ChămsócchómèoAI dạy em tự tạo ra câu nào đó đi'].map((tag, idx) => (
                        <button
                          key={idx}
                          className="block w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Community Stats */}
                  <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50">
                    <h3 className="font-bold text-gray-900 mb-4">Thống kê cộng đồng</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Thành viên</span>
                        <span className="font-bold text-emerald-600">{stats.members.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bài viết</span>
                        <span className="font-bold text-blue-600">{stats.posts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bình luận</span>
                        <span className="font-bold text-amber-600">{stats.discussions.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
        )}

        {/* Create/Edit Post Modal */}
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => {
            setShowCreatePost(false)
            setEditingPost(null)
          }}
          onSubmit={handleCreatePost}
          currentUserName={currentUser?.profile?.name}
          editPost={editingPost}
        />
      </div>
    </div>
  )
}
