// Common Types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// User Types
export interface User {
  id: string
  email: string
  role: 'admin' | 'staff' | 'user'
  status: 'active' | 'inactive' | 'banned'
  profile?: UserProfile
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  name: string
  phone?: string
  address?: string
  avatarUrl?: string
  dateOfBirth?: string
}

// Pet Types
export interface Pet {
  id: string
  userId: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  photoUrl?: string
  medicalNotes?: string
  createdAt: string
  updatedAt: string
}

// Service Types
export interface Service {
  id: string
  name: string
  slug?: string
  description: string
  price: number
  duration: number
  categoryId: string
  category?: Category
  petTypes: string[]
  imageUrl?: string
  images?: string[]
  features?: string[]
  requirements?: string[]
  preparation?: string
  aftercare?: string
  isActive: boolean
  isBookable?: boolean
  sortOrder?: number
  createdAt: string
  updatedAt: string
}

// Product Types
export interface Product {
  id: string
  name: string
  slug?: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  categoryId: string
  category?: Category
  stockQuantity: number
  stock?: number // alias for stockQuantity
  lowStockThreshold?: number
  minStock?: number // alias for lowStockThreshold
  maxStock?: number
  sku: string
  weight?: number
  brand?: string
  images: ProductImage[]
  variants?: ProductVariant[]
  isActive: boolean
  isFeatured?: boolean
  featured?: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  productId: string
  imageUrl: string
  altText?: string
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  priceModifier: number
  stock: number
  attributes: Record<string, string>
}

// Category Types
export interface Category {
  id: string
  name: string
  type: 'service' | 'product' | 'pet'
  description?: string
  icon?: string
  imageUrl?: string
  parentId?: string
  sortOrder?: number
  seoMeta?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  parent?: Category
  children?: Category[]
  createdAt: string
  updatedAt: string
}

// Appointment Types
export interface Appointment {
  id: string
  userId?: string
  serviceId: string
  petId?: string
  staffId?: string
  dateTime: string
  appointmentDate?: string
  duration?: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  specialRequests?: string
  price: number
  // Phân loại khách hàng & thông tin khách vãng lai
  customerType?: 'registered' | 'guest'
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestPetName?: string
  guestPetSpecies?: string
  createdBy?: string
  isArchived?: boolean
  user?: User
  service?: Service
  pet?: Pet
  staff?: User
  createdAt: string
  updatedAt: string
}

// Order Types
export interface Order {
  id: string
  orderNumber?: string
  userId: string
  totalAmount: number
  subtotal?: number
  discountAmount?: number
  shippingFee?: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod?: string
  shippingAddress: string
  notes?: string
  items?: OrderItem[]
  orderItems?: OrderItem[]
  user?: User
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  price: number
  totalPrice?: number
  productName?: string
  productSku?: string
  productImage?: string
  product?: Product
  variant?: ProductVariant
}

// Cart Types
export interface CartItem {
  id: string
  userId: string
  productId: string
  variantId?: string
  quantity: number
  product?: Product
  variant?: ProductVariant
}

// Review Types
export interface Review {
  id: string
  userId: string
  reviewableType: 'service' | 'product'
  reviewableId: string
  rating: number
  comment?: string
  status: 'pending' | 'approved' | 'rejected'
  user?: User
  createdAt: string
  updatedAt: string
}

// Consultation Types
export interface Consultation {
  id: string
  userId: string
  petId: string
  subject: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  messages: ConsultationMessage[]
  user?: User
  pet?: Pet
  createdAt: string
  updatedAt: string
}

export interface ConsultationMessage {
  id: string
  consultationId: string
  userId: string
  message: string
  attachments?: string[]
  isStaff: boolean
  user?: User
  createdAt: string
}

// Support Types
export interface SupportTicket {
  id: string
  userId?: string
  subject?: string
  title?: string
  description?: string
  status: 'open' | 'in-progress' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  assignedTo?: string | User
  assignedToId?: string
  ticketNumber?: string
  resolution?: string
  resolvedAt?: string
  messages: SupportMessage[]
  user?: User
  assignedStaff?: User
  assignedToUser?: User
  // Guest contact fields
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  petType?: string
  createdAt: string
  updatedAt: string
}

export interface SupportMessage {
  id: string
  ticketId: string
  userId: string
  message: string
  isStaff: boolean
  user?: User
  createdAt: string
}

// Community Types
export interface Post {
  id: string
  userId?: string
  authorId?: string
  title: string
  content: string
  type: 'blog' | 'user' | 'user_post' | 'news' | 'question'
  slug?: string
  categoryId?: string
  status: 'draft' | 'published' | 'archived'
  views: number
  images?: PostImage[] | string[]
  tags?: string[]
  likes?: Like[]
  comments?: Comment[]
  likesCount?: number
  commentsCount?: number
  isPinned?: boolean
  isFeatured?: boolean
  user?: User
  author?: User
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface PostImage {
  id: string
  postId: string
  imageUrl: string
  altText?: string
  sortOrder: number
}

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  parentId?: string
  status: 'approved' | 'pending' | 'spam'
  replies?: Comment[]
  user?: User
  likesCount?: number
  createdAt: string
  updatedAt: string
}

export interface Like {
  id: string
  userId: string
  likeableType: 'post' | 'comment'
  likeableId: string
  user?: User
  createdAt: string
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  follower?: User
  following?: User
  createdAt: string
}

export interface Contest {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  rules?: string
  prizes?: string
  status: 'upcoming' | 'active' | 'ended'
  imageUrl?: string
  entries?: ContestEntry[]
  createdAt: string
  updatedAt: string
}

export interface ContestEntry {
  id: string
  contestId: string
  userId: string
  petId: string
  imageUrl: string
  caption?: string
  votesCount?: number
  user?: User
  pet?: Pet
  createdAt: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'appointment' | 'order' | 'promotion' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  readAt?: string
  createdAt: string
}

// Wishlist Types
export interface Wishlist {
  id: string
  userId: string
  name: string
  isPublic: boolean
  items: WishlistItem[]
  createdAt: string
}

export interface WishlistItem {
  id: string
  wishlistId: string
  productId?: string
  serviceId?: string
  product?: Product
  service?: Service
  addedAt: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  phone?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string  // Optional since backend doesn't return it yet
}

// Đăng ký không trả token: phải xác minh OTP trước
export interface RegisterResponse {
  message: string
  email: string
}

// Search Types
export interface SearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  petType?: string
  rating?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Settings Types
export interface NotificationPreferences {
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  appointmentReminders: boolean
  orderUpdates: boolean
  promotions: boolean
  newsletter: boolean
}