import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, Button, Loading } from '@/components/common'
import { publicService } from '@/services'
import type { Post } from '@/types'
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  Tag,
  Clock,
  ChevronRight,
  Home,
  BookOpen,
  Heart
} from 'lucide-react'
import toast from 'react-hot-toast'

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([])

  // Load bookmarked posts from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedBlogPosts')
    if (savedBookmarks) {
      setBookmarkedPosts(JSON.parse(savedBookmarks))
    }
  }, [])

  const toggleBookmark = (postId: string) => {
    const isBookmarked = bookmarkedPosts.includes(postId)
    let newBookmarks: string[]

    if (isBookmarked) {
      newBookmarks = bookmarkedPosts.filter(id => id !== postId)
      toast.success('Đã bỏ lưu bài viết')
    } else {
      newBookmarks = [...bookmarkedPosts, postId]
      toast.success('Đã lưu bài viết vào danh sách yêu thích')
    }

    setBookmarkedPosts(newBookmarks)
    localStorage.setItem('bookmarkedBlogPosts', JSON.stringify(newBookmarks))
  }

  const isBookmarked = (postId: string) => bookmarkedPosts.includes(postId)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await publicService.getBlogPost(id!)
      const postData = (response as any).data || response
      setPost(postData)

      // Get related posts
      if (postData.relatedPosts) {
        setRelatedPosts(postData.relatedPosts)
      }
    } catch (error) {
      console.error('Failed to fetch post:', error)
      toast.error('Không thể tải bài viết')
      navigate('/blog')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.content.substring(0, 100),
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Không tìm thấy bài viết</h2>
          <Link to="/blog">
            <Button>Quay lại Blog</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const featuredImage = post.images && post.images.length > 0
    ? (typeof post.images[0] === 'string' ? post.images[0] : (post.images[0] as any)?.imageUrl)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <section className="bg-white py-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-600 hover:text-[#2E86AB] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/blog" className="text-gray-600 hover:text-[#2E86AB] transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-[#2E86AB] font-medium line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Article */}
      <article className="py-8 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Back Button */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2E86AB] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.type && (
              <span className="inline-block px-3 py-1 bg-[#2E86AB] text-white text-sm font-medium rounded-full mb-4">
                {post.type === 'news' ? 'Tin tức' : post.type === 'blog' ? 'Blog' : 'Bài viết'}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight break-words">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author.profile?.name || post.author.email}</span>
                </div>
              )}
              {post.views !== undefined && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{post.views} lượt xem</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Chia sẻ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBookmark(post.id)}
                className={isBookmarked(post.id) ? 'bg-red-50 border-red-200 text-red-600' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isBookmarked(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                {isBookmarked(post.id) ? 'Đã lưu' : 'Lưu'}
              </Button>
            </div>
          </header>

          {/* Featured Image */}
          {featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={featuredImage}
                alt={post.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-8 overflow-hidden">
            <div
              className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{
                __html: post.content.replace(/\n/g, '<br />')
              }}
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 py-6 border-t border-gray-200">
              <Tag className="w-5 h-5 text-gray-400" />
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/blog?tag=${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-[#2E86AB] hover:text-white transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Additional Images */}
          {post.images && post.images.length > 1 && (
            <div className="py-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {post.images.slice(1).map((image, index) => (
                  <img
                    key={index}
                    src={typeof image === 'string' ? image : (image as any)?.imageUrl}
                    alt={`${post.title} - ${index + 2}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Bạn thấy bài viết hữu ích?</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Chia sẻ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(post.id)}
                  className={isBookmarked(post.id) ? 'bg-red-50 border-red-200 text-red-600' : ''}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isBookmarked(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  {isBookmarked(post.id) ? 'Đã lưu' : 'Yêu thích'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 3).map((relatedPost) => (
                <Card key={relatedPost.id} padding="none" hover className="overflow-hidden">
                  <div className="h-40 bg-gray-200">
                    {relatedPost.images && relatedPost.images.length > 0 ? (
                      <img
                        src={typeof relatedPost.images[0] === 'string' ? relatedPost.images[0] : (relatedPost.images[0] as any)?.imageUrl}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2E86AB]/10 to-[#F18F01]/10">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <Link
                      to={`/blog/${relatedPost.id}`}
                      className="text-[#2E86AB] text-sm font-medium hover:underline"
                    >
                      Đọc tiếp →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default BlogDetail
