import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Loading } from '@/components/common'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { publicService } from '@/services'
import { formatVND } from '@/utils'
import type { Post } from '@/types'
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  Eye,
  ShoppingBag,
  BookOpen,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const Wishlist = () => {
  const { addToCart } = useCart()
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const [activeTab, setActiveTab] = useState<'products' | 'blogs'>('products')
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([])
  const [savedBlogs, setSavedBlogs] = useState<Post[]>([])
  const [loadingBlogs, setLoadingBlogs] = useState(false)

  // Load bookmarked posts from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedBlogPosts')
    if (savedBookmarks) {
      const bookmarks = JSON.parse(savedBookmarks)
      setBookmarkedPosts(bookmarks)
      if (bookmarks.length > 0) {
        fetchSavedBlogs(bookmarks)
      }
    }
  }, [])

  const fetchSavedBlogs = async (bookmarkIds: string[]) => {
    setLoadingBlogs(true)
    try {
      const response = await publicService.getBlogPosts({ limit: 100 })
      const postsData = response?.data || response || []
      const filtered = postsData.filter((post: Post) => bookmarkIds.includes(post.id))
      setSavedBlogs(filtered)
    } catch (error) {
      console.error('Failed to fetch saved blogs:', error)
    } finally {
      setLoadingBlogs(false)
    }
  }

  const removeBookmark = (postId: string) => {
    const newBookmarks = bookmarkedPosts.filter(id => id !== postId)
    setBookmarkedPosts(newBookmarks)
    setSavedBlogs(prev => prev.filter(post => post.id !== postId))
    localStorage.setItem('bookmarkedBlogPosts', JSON.stringify(newBookmarks))
    toast.success('Đã bỏ lưu bài viết')
  }

  const clearAllBookmarks = () => {
    setBookmarkedPosts([])
    setSavedBlogs([])
    localStorage.removeItem('bookmarkedBlogPosts')
    toast.success('Đã xóa tất cả bài viết đã lưu')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      stockQuantity: item.stockQuantity
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách yêu thích</h1>
              <p className="text-gray-600">
                Quản lý sản phẩm và bài viết yêu thích của bạn
              </p>
            </div>
            <div className="flex gap-3">
              {activeTab === 'products' && items.length > 0 && (
                <Button variant="outline" onClick={clearWishlist} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tất cả
                </Button>
              )}
              {activeTab === 'blogs' && savedBlogs.length > 0 && (
                <Button variant="outline" onClick={clearAllBookmarks} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tất cả
                </Button>
              )}
              {activeTab === 'products' ? (
                <Link to="/products">
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Mua sắm
                  </Button>
                </Link>
              ) : (
                <Link to="/blog">
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Xem Blog
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
                activeTab === 'products'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Sản phẩm</span>
                {items.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs">
                    {items.length}
                  </span>
                )}
              </div>
              {activeTab === 'products' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative ${
                activeTab === 'blogs'
                  ? 'text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Bài viết</span>
                {savedBlogs.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs">
                    {savedBlogs.length}
                  </span>
                )}
              </div>
              {activeTab === 'blogs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"></div>
              )}
            </button>
          </div>
        </Card>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {items.length === 0 ? (
              <Card padding="lg">
                <EmptyState
                  icon={<Heart className="w-16 h-16 text-gray-300" />}
                  title="Danh sách yêu thích trống"
                  description="Bạn chưa thêm sản phẩm nào vào danh sách yêu thích. Hãy khám phá và lưu các sản phẩm bạn yêu thích."
                  action={
                    <Link to="/products">
                      <Button className="bg-emerald-500 hover:bg-emerald-600">
                        Khám phá sản phẩm
                      </Button>
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </button>

                      {/* Discount Badge */}
                      {item.comparePrice && item.comparePrice > item.price && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{Math.round((1 - item.price / item.comparePrice) * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link to={`/products/${item.productId}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-emerald-600 line-clamp-2 mb-2">
                          {item.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-emerald-600">
                          {formatVND(item.price)}
                        </span>
                        {item.comparePrice && item.comparePrice > item.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatVND(item.comparePrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock Status */}
                      <div className="mb-4">
                        {item.stockQuantity > 0 ? (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Còn hàng
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Hết hàng
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 min-w-0"
                          size="sm"
                          disabled={item.stockQuantity <= 0}
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                          <span className="ml-1 truncate">Thêm giỏ hàng</span>
                        </Button>
                        <Link to={`/products/${item.productId}`} className="flex-shrink-0">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <>
            {loadingBlogs ? (
              <div className="flex justify-center py-20">
                <Loading size="lg" />
              </div>
            ) : savedBlogs.length === 0 ? (
              <Card padding="lg">
                <EmptyState
                  icon={<BookOpen className="w-16 h-16 text-gray-300" />}
                  title="Chưa có bài viết đã lưu"
                  description="Bạn chưa lưu bài viết nào. Hãy khám phá blog và lưu các bài viết hữu ích."
                  action={
                    <Link to="/blog">
                      <Button className="bg-emerald-500 hover:bg-emerald-600">
                        Khám phá Blog
                      </Button>
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBlogs.map((post) => (
                  <Card key={post.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    {/* Post Image */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {post.images && post.images.length > 0 ? (
                        <img
                          src={typeof post.images[0] === 'string' ? post.images[0] : (post.images[0] as any)?.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2E86AB]/10 to-[#F18F01]/10">
                          <BookOpen className="w-12 h-12 text-gray-300" />
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => removeBookmark(post.id)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </button>

                      {/* Type Badge */}
                      {post.type && (
                        <div className="absolute top-3 left-3 bg-[#2E86AB] text-white px-2 py-1 rounded-full text-xs font-medium">
                          {post.type === 'news' ? 'Tin tức' : post.type === 'blog' ? 'Blog' : 'Bài viết'}
                        </div>
                      )}
                    </div>

                    {/* Post Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.createdAt)}</span>
                      </div>

                      <Link to={`/blog/${post.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-[#2E86AB] line-clamp-2 mb-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {post.content.substring(0, 100)}...
                      </p>

                      {/* Actions */}
                      <Link to={`/blog/${post.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Đọc bài viết
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Summary */}
        {activeTab === 'products' && items.length > 0 && (
          <Card className="mt-6 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600">
                Tổng cộng: <span className="font-bold text-gray-900">{items.length}</span> sản phẩm yêu thích
              </p>
              <div className="flex gap-3">
                <Link to="/products">
                  <Button variant="outline">
                    Xem thêm sản phẩm
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'blogs' && savedBlogs.length > 0 && (
          <Card className="mt-6 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600">
                Tổng cộng: <span className="font-bold text-gray-900">{savedBlogs.length}</span> bài viết đã lưu
              </p>
              <div className="flex gap-3">
                <Link to="/blog">
                  <Button variant="outline">
                    Xem thêm bài viết
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Wishlist
