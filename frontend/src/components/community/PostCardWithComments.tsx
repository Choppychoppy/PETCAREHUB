import { useState } from 'react'
import { PostCard } from './PostCard'
import { CommentSection } from './CommentSection'
import type { Post, Comment } from '@/types'

interface PostCardWithCommentsProps {
  post: Post
  currentUserId?: string
  onLike: (postId: string) => void
  onShare: (postId: string) => void
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  onLoadComments: (postId: string) => Promise<Comment[]>
  onAddComment: (postId: string, content: string, parentId?: string) => Promise<void>
  onUpdateComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onLikeComment: (commentId: string) => Promise<void>
}

export const PostCardWithComments = ({
  post,
  currentUserId,
  onLike,
  onShare,
  onEdit,
  onDelete,
  onLoadComments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onLikeComment
}: PostCardWithCommentsProps) => {
  const [showComments, setShowComments] = useState(false)

  const handleToggleComments = () => {
    setShowComments(!showComments)
  }

  return (
    <div className="space-y-0">
      <PostCard
        post={post}
        currentUserId={currentUserId}
        onLike={onLike}
        onComment={handleToggleComments}
        onShare={onShare}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {showComments && (
        <div className="bg-white border-t border-gray-200 px-4 pb-4 rounded-b-lg shadow-sm">
          <div className="pt-4">
            <CommentSection
              postId={post.id}
              comments={[]}
              currentUserId={currentUserId}
              onLoadComments={onLoadComments}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              onLikeComment={onLikeComment}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCardWithComments
