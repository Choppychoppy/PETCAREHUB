import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Loading, EmptyState } from '@/components/common'
import { publicService } from '@/services'
import type { Post } from '@/types'
import {
  Calendar,
  User,
  Eye,
  ArrowRight,
  Search,
  Tag,
  Clock,
  ChevronRight,
  Home,
  BookOpen,
  Heart,
  Bookmark
} from 'lucide-react'
import toast from 'react-hot-toast'

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0
  })

  // Load bookmarked posts from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedBlogPosts')
    if (savedBookmarks) {
      setBookmarkedPosts(JSON.parse(savedBookmarks))
    }
  }, [])

  const toggleBookmark = (postId: string, postTitle: string) => {
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
    fetchPosts()
  }, [pagination.page, selectedTag])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await publicService.getBlogPosts({
        page: pagination.page,
        limit: pagination.limit,
        tag: selectedTag || undefined
      })

      let postsData: Post[] = []
      let paginationData = { page: 1, limit: 9, total: 0, totalPages: 0 }

      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          postsData = response.data.filter((post: Post) => post.status === 'published')
          if ('meta' in response && response.meta) {
            paginationData = {
              page: response.meta.page,
              limit: response.meta.limit,
              total: response.meta.total,
              totalPages: response.meta.totalPages
            }
          }
        } else if (Array.isArray(response)) {
          postsData = response.filter((post: Post) => post.status === 'published')
        }
      }

      setPosts(postsData)
      setPagination(paginationData)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get unique tags from all posts
  const allTags = [...new Set(posts.flatMap(post => post.tags || []))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2E86AB] to-[#1a5f7a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm mb-6 text-white/80">
            <Link to="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Blog</span>
          </nav>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Tin tức</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Khám phá những bài viết hữu ích về chăm sóc thú cưng, mẹo nuôi dưỡng và tin tức mới nhất
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB]"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === '' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag('')}
                >
                  Tất cả
                </Button>
                {allTags.slice(0, 5).map((tag) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loading size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              title="Chưa có bài viết"
              description="Hiện tại chưa có bài viết nào được đăng. Vui lòng quay lại sau!"
            />
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts
                  .filter(post =>
                    searchQuery === '' ||
                    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    post.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((post) => (
                    <Card key={post.id} padding="none" hover className="overflow-hidden group">
                      {/* Post Image */}
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={typeof post.images[0] === 'string' ? post.images[0] : (post.images[0] as any)?.imageUrl}
                            alt={post.title}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600' }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2E86AB]/10 to-[#F18F01]/10">
                            <BookOpen className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        {post.type && (
                          <span className="absolute top-3 left-3 px-3 py-1 bg-[#2E86AB] text-white text-xs font-medium rounded-full">
                            {post.type === 'news' ? 'Tin tức' : post.type === 'blog' ? 'Blog' : 'Bài viết'}
                          </span>
                        )}
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleBookmark(post.id, post.title)
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                            isBookmarked(post.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
                          }`}
                          title={isBookmarked(post.id) ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                        >
                          <Heart className={`w-4 h-4 ${isBookmarked(post.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="p-5">
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                          {post.views !== undefined && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views}</span>
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2E86AB] transition-colors">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {truncateContent(post.content)}
                        </p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Read More */}
                        <Link
                          to={`/blog/${post.id}`}
                          className="inline-flex items-center gap-2 text-[#2E86AB] font-medium text-sm hover:gap-3 transition-all"
                        >
                          Đọc tiếp
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </Card>
                  ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Trước
                  </Button>

                  {[...Array(pagination.totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      variant={pagination.page === index + 1 ? 'primary' : 'outline'}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Blog
