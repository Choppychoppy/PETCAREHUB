import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import type { Service, Product, Category, Post, Review, SearchFilters, PaginatedResponse } from '@/types'

class PublicService {
  // Services (Public browsing)
  async getServices(params?: SearchFilters): Promise<PaginatedResponse<Service>> {
    return await apiClient.get<PaginatedResponse<Service>>(API_ENDPOINTS.PUBLIC.SERVICES, { params })
  }

  async getService(serviceId: string): Promise<Service & { reviews: Review[] }> {
    return await apiClient.get<Service & { reviews: Review[] }>(API_ENDPOINTS.PUBLIC.SERVICE(serviceId))
  }

  async getServiceReviews(serviceId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Review>> {
    return await apiClient.get<PaginatedResponse<Review>>(`${API_ENDPOINTS.PUBLIC.SERVICE(serviceId)}/reviews`, { params })
  }

  // Products (Public browsing)
  async getProducts(params?: SearchFilters): Promise<PaginatedResponse<Product>> {
    return await apiClient.get<PaginatedResponse<Product>>(API_ENDPOINTS.PUBLIC.PRODUCTS, { params })
  }

  async getProduct(productId: string): Promise<Product & { reviews: Review[] }> {
    return await apiClient.get<Product & { reviews: Review[] }>(API_ENDPOINTS.PUBLIC.PRODUCT(productId))
  }

  async getProductReviews(productId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Review>> {
    return await apiClient.get<PaginatedResponse<Review>>(`${API_ENDPOINTS.PUBLIC.PRODUCT(productId)}/reviews`, { params })
  }

  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    return await apiClient.get<Product[]>(`${API_ENDPOINTS.PUBLIC.PRODUCT(productId)}/related`, { 
      params: { limit }
    })
  }

  // Categories
  async getCategories(type?: 'service' | 'product' | 'pet'): Promise<Category[]> {
    return await apiClient.get<Category[]>(API_ENDPOINTS.PUBLIC.CATEGORIES, { 
      params: { type }
    })
  }

  async getCategoryProducts(categoryId: string, params?: SearchFilters): Promise<PaginatedResponse<Product>> {
    return await apiClient.get<PaginatedResponse<Product>>(`${API_ENDPOINTS.PUBLIC.CATEGORIES}/${categoryId}/products`, { params })
  }

  async getCategoryServices(categoryId: string, params?: SearchFilters): Promise<PaginatedResponse<Service>> {
    return await apiClient.get<PaginatedResponse<Service>>(`${API_ENDPOINTS.PUBLIC.CATEGORIES}/${categoryId}/services`, { params })
  }

  // Search
  async searchServices(filters: SearchFilters): Promise<PaginatedResponse<Service>> {
    return await apiClient.get<PaginatedResponse<Service>>(API_ENDPOINTS.PUBLIC.SEARCH.SERVICES, { 
      params: filters
    })
  }

  async searchProducts(filters: SearchFilters): Promise<PaginatedResponse<Product>> {
    return await apiClient.get<PaginatedResponse<Product>>(API_ENDPOINTS.PUBLIC.SEARCH.PRODUCTS, { 
      params: filters
    })
  }

  async getSearchSuggestions(query: string, type: 'service' | 'product' | 'all' = 'all'): Promise<{
    services: Service[]
    products: Product[]
  }> {
    return await apiClient.get<any>('/search/suggestions', { 
      params: { query, type, limit: 5 }
    })
  }

  // Blog & Content
  async getBlogPosts(params?: { 
    page?: number; 
    limit?: number; 
    categoryId?: string;
    tag?: string;
  }): Promise<PaginatedResponse<Post>> {
    return await apiClient.get<PaginatedResponse<Post>>(API_ENDPOINTS.PUBLIC.BLOG, { params })
  }

  async getBlogPost(postId: string): Promise<Post & { relatedPosts: Post[] }> {
    return await apiClient.get<Post & { relatedPosts: Post[] }>(API_ENDPOINTS.PUBLIC.BLOG_POST(postId))
  }

  async getFeaturedPosts(limit: number = 6): Promise<Post[]> {
    return await apiClient.get<Post[]>('/posts/featured', {
      params: { limit }
    })
  }

  // Popular & Trending
  async getPopularServices(limit: number = 8): Promise<Service[]> {
    return await apiClient.get<Service[]>(`${API_ENDPOINTS.PUBLIC.SERVICES}/popular`, {
      params: { limit }
    })
  }

  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    return await apiClient.get<Product[]>(`${API_ENDPOINTS.PUBLIC.PRODUCTS}/trending`, {
      params: { limit }
    })
  }

  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return await apiClient.get<Product[]>(`${API_ENDPOINTS.PUBLIC.PRODUCTS}/featured`, {
      params: { limit }
    })
  }

  async getNewArrivals(limit: number = 8): Promise<Product[]> {
    return await apiClient.get<Product[]>(`${API_ENDPOINTS.PUBLIC.PRODUCTS}/new`, {
      params: { limit }
    })
  }

  // Statistics & Insights (Public)
  async getPublicStats(): Promise<{
    totalUsers: number
    totalAppointments: number
    totalReviews: number
    averageRating: number
    happyCustomers: number
  }> {
    return await apiClient.get<any>('/public/stats')
  }

  // FAQ & Help
  async getFAQs(category?: string): Promise<Array<{
    id: string
    question: string
    answer: string
    category: string
    order: number
  }>> {
    return await apiClient.get<any>('/public/faqs', { 
      params: { category }
    })
  }

  async getHelpArticles(params?: { 
    page?: number; 
    limit?: number; 
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<{
    id: string
    title: string
    content: string
    category: string
    tags: string[]
    views: number
    helpful: number
    createdAt: string
  }>> {
    return await apiClient.get<any>('/public/help', { params })
  }

  // Contact & Feedback
  async submitContactForm(formData: {
    name: string
    email: string
    phone?: string
    subject: string
    message: string
    petType?: string
    urgency?: string
  }): Promise<{ success: boolean; message: string; ticketId?: string }> {
    return await apiClient.post('/support/contact', formData)
  }

  async submitFeedback(feedbackData: {
    type: 'suggestion' | 'complaint' | 'compliment' | 'bug'
    message: string
    rating?: number
    email?: string
  }): Promise<void> {
    await apiClient.post('/public/feedback', feedbackData)
  }

  // Newsletter
  async subscribeNewsletter(email: string, preferences?: {
    productUpdates: boolean
    promotions: boolean
    tips: boolean
  }): Promise<void> {
    await apiClient.post('/public/newsletter/subscribe', { 
      email, 
      preferences 
    })
  }

  async unsubscribeNewsletter(email: string, token: string): Promise<void> {
    await apiClient.post('/public/newsletter/unsubscribe', { 
      email, 
      token 
    })
  }

  // Availability Check
  async checkServiceAvailability(serviceId: string, date: string): Promise<{
    available: boolean
    availableSlots: string[]
    nextAvailableDate?: string
  }> {
    return await apiClient.get<any>(`${API_ENDPOINTS.PUBLIC.SERVICE(serviceId)}/availability`, {
      params: { date }
    })
  }

  // Price Calculator
  async calculateServicePrice(serviceId: string, petType: string, addons?: string[]): Promise<{
    basePrice: number
    addonPrice: number
    totalPrice: number
    estimatedDuration: number
  }> {
    return await apiClient.post<any>(`${API_ENDPOINTS.PUBLIC.SERVICE(serviceId)}/calculate-price`, {
      petType,
      addons
    })
  }

  // Discount Code Validation
  async validateDiscountCode(code: string, orderTotal: number): Promise<{
    valid: boolean
    discountCode?: {
      id: string
      code: string
      name: string
      type: 'percentage' | 'fixed_amount'
      value: number
      minOrderAmount?: number
      maxDiscountAmount?: number
    }
    discountAmount?: number
    message?: string
  }> {
    try {
      const discountCode = await apiClient.get<any>(API_ENDPOINTS.PUBLIC.VALIDATE_DISCOUNT(code))

      // Calculate discount amount
      let discountAmount = 0
      if (discountCode.type === 'percentage') {
        discountAmount = (orderTotal * discountCode.value) / 100
        if (discountCode.maxDiscountAmount && discountAmount > discountCode.maxDiscountAmount) {
          discountAmount = discountCode.maxDiscountAmount
        }
      } else {
        discountAmount = discountCode.value
      }

      return {
        valid: true,
        discountCode: {
          id: discountCode.id,
          code: discountCode.code,
          name: discountCode.name,
          type: discountCode.type,
          value: discountCode.value,
          minOrderAmount: discountCode.minOrderAmount,
          maxDiscountAmount: discountCode.maxDiscountAmount
        },
        discountAmount
      }
    } catch (error: any) {
      return {
        valid: false,
        message: error?.response?.data?.message || 'Mã giảm giá không hợp lệ'
      }
    }
  }
}

export const publicService = new PublicService()
export default publicService