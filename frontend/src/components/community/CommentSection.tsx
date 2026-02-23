import { useState, useEffect } from 'react'
import { Send, Heart, Reply, MoreVertical, Trash2, Edit3, MessageCircle } from 'lucide-react'
import { Button } from '@/components/common'
import type { Comment } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  currentUserId?: string
  onLoadComments: (postId: string) => Promise<Comment[]>
  onAddComment: (postId: string, content: string, parentId?: string) => Promise<void>
  onUpdateComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
}

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  onReply: (commentId: string, content: string) => void
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onLike: (commentId: string) => void
  depth?: number
}

const CommentItem = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  depth = 0
}: CommentItemProps) => {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)

  // Get isLiked directly from comment data (single source of truth)
  const isLiked = (comment as any).isLiked || false

  const isOwnComment = currentUserId && comment.userId === currentUserId
  const maxDepth = 2 // Maximum nesting level

  const handleReply = () => {
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }
    onReply(comment.id, replyContent.trim())
    setReplyContent('')
    setShowReplyBox(false)
  }

  const handleEdit = () => {
    if (!editContent.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }
    onEdit(comment.id, editContent.trim())
    setIsEditing(false)
  }

  const handleLike = () => {
    onLike(comment.id)
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#F18F01] flex items-center justify-center text-white font-semibold text-sm">
            {comment.user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-900 text-sm">
                {comment.user?.profile?.name || 'Người dùng'}
              </p>

              {isOwnComment && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => {
                            setIsEditing(true)
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => {
                            onDelete(comment.id)
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] text-sm resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit}>
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2">
            <button
              onClick={handleLike}
              className={`text-xs font-medium ${
                isLiked ? 'text-red-600' : 'text-gray-600'
              } hover:text-red-600 transition-colors flex items-center gap-1`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              {comment.likesCount ? `Thích (${comment.likesCount})` : 'Thích'}
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-xs font-medium text-gray-600 hover:text-[#2E86AB] transition-colors flex items-center gap-1"
              >
                <Reply className="w-3 h-3" />
                Phản hồi
              </button>
            )}

            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: vi
              })}
            </span>
          </div>

          {/* Reply Box */}
          {showReplyBox && (
            <div className="mt-3 flex gap-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#F18F01] flex items-center justify-center text-white font-semibold text-xs">
                  U
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Viết phản hồi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] text-sm resize-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleReply}>
                    <Send className="w-3 h-3 mr-1" />
                    Gửi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowReplyBox(false)
                      setReplyContent('')
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const CommentSection = ({
  postId,
  comments: initialComments,
  currentUserId,
  onLoadComments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const loadedComments = await onLoadComments(postId)
      setComments(loadedComments)
    } catch (error) {
      console.error('Failed to load comments:', error)
      toast.error('Không thể tải bình luận')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Đang gửi bình luận...')

    try {
      await onAddComment(postId, newComment.trim())
      toast.success('Đã thêm bình luận', { id: toastId })
      setNewComment('')
      await loadComments()
    } catch (error: any) {
      console.error('Failed to add comment:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Không thể thêm bình luận'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    const toastId = toast.loading('Đang gửi phản hồi...')
    try {
      await onAddComment(postId, content, parentId)
      toast.success('Đã thêm phản hồi', { id: toastId })
      await loadComments()
    } catch (error: any) {
      console.error('Failed to reply:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Không thể thêm phản hồi'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const handleEdit = async (commentId: string, content: string) => {
    const toastId = toast.loading('Đang cập nhật...')
    try {
      await onUpdateComment(commentId, content)
      toast.success('Đã cập nhật bình luận', { id: toastId })
      await loadComments()
    } catch (error: any) {
      console.error('Failed to update comment:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Không thể cập nhật'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return
    }

    const toastId = toast.loading('Đang xóa...')
    try {
      await onDeleteComment(commentId)
      toast.success('Đã xóa bình luận', { id: toastId })
      await loadComments()
    } catch (error: any) {
      console.error('Failed to delete comment:', error)
      const errorMessage = error?.response?.data?.message ||
                          error?.message ||
                          'Không thể xóa'
      toast.error(errorMessage, { id: toastId })
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      await onLikeComment(commentId)
      // Reload comments to get updated like status and count
      await loadComments()
    } catch (error) {
      console.error('Failed to like comment:', error)
      toast.error('Không thể thích bình luận')
    }
  }

  // Build comment tree
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: build the tree
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          if (!parent.replies) parent.replies = []
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  const commentTree = buildCommentTree(comments)

  return (
    <div className="space-y-4">
      {/* Add Comment Box */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#F18F01] flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang gửi...' : 'Bình luận'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E86AB]"></div>
            <p className="text-gray-600 mt-2">Đang tải bình luận...</p>
          </div>
        ) : commentTree.length > 0 ? (
          commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Chưa có bình luận nào</p>
            <p className="text-gray-500 text-sm">Hãy là người đầu tiên bình luận!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentSection
