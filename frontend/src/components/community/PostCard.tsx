import { useState } from 'react'
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/common'
import type { Post } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  currentUserId?: string
}

export const PostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  currentUserId
}: PostCardProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get isLiked directly from post data (single source of truth)
  const isLiked = (post as any).isLiked || false

  // Backend returns 'author' field
  const author = (post as any).author || post.user
  const authorId = (post as any).authorId || post.userId

  const isOwnPost = currentUserId && authorId === currentUserId

  // Check if content is long enough to need "See more"
  const isContentLong = post.content.length > 300 || post.content.split('\n').length > 4
  const isTitleLong = post.title.length > 100

  const handleLike = () => {
    onLike(post.id)
  }

  const getPostTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'Bài viết',
      question: 'Câu hỏi',
      blog: 'Blog',
      news: 'Tin tức'
    }
    return labels[type] || 'Bài viết'
  }

  const getPostTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      question: 'bg-purple-100 text-purple-800',
      blog: 'bg-green-100 text-green-800',
      news: 'bg-orange-100 text-orange-800'
    }
    return classes[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {author?.profile?.avatarUrl ? (
              <img
                src={author.profile.avatarUrl}
                alt={author.profile.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#F18F01] flex items-center justify-center text-white font-semibold text-lg">
                {author?.profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {author?.profile?.name || 'Người dùng'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPostTypeBadgeClass(post.type)}`}>
                  {getPostTypeLabel(post.type)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: vi
                })}
              </p>
            </div>
          </div>

          {isOwnPost && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(post)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(post.id)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        Xóa bài viết
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2
          className={`text-xl font-bold text-gray-900 mb-3 whitespace-pre-wrap break-words ${
            !isExpanded && isTitleLong ? 'max-h-[3.6rem] overflow-hidden' : ''
          }`}
        >
          {post.title}
        </h2>
        <p
          className={`text-gray-700 leading-relaxed whitespace-pre-wrap break-words ${
            !isExpanded && isContentLong ? 'max-h-[6.4rem] overflow-hidden' : ''
          }`}
        >
          {post.content}
        </p>

        {/* See More / See Less Button */}
        {isContentLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#2E86AB] hover:text-[#1e5a73] font-medium text-sm mt-2 transition-colors"
          >
            {isExpanded ? 'Thu gọn' : 'Xem thêm'}
          </button>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-4 grid gap-2 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {post.images.map((image, index) => {
              // Handle both string URLs and object format {imageUrl, altText}
              const imageUrl = typeof image === 'string' ? image : (image as any).imageUrl
              const altText = typeof image === 'string' ? `Ảnh ${index + 1}` : ((image as any).altText || `Ảnh ${index + 1}`)
              const imageKey = typeof image === 'string' ? index : ((image as any).id || index)

              return (
                <div
                  key={imageKey}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{post.likesCount || 0} lượt thích</span>
          <span>{post.commentsCount || 0} bình luận</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-around gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex-1 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}
          >
            <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            Thích
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onComment(post.id)}
            className="flex-1 text-gray-600"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Bình luận
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(post.id)}
            className="flex-1 text-gray-600"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Chia sẻ
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PostCard
