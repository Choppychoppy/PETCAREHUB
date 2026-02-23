import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import type { 
  User, 
  UserProfile, 
  Pet, 
  Appointment, 
  CartItem, 
  Order, 
  Review, 
  Consultation,
  ConsultationMessage,
  Post,
  NotificationPreferences,
  Wishlist,
  WishlistItem,
  PaginatedResponse,
  SearchFilters
} from '@/types'

class UserService {
  // Profile Management
  async getProfile(): Promise<UserProfile> {
    return await apiClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE)
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    return await apiClient.put<UserProfile>(API_ENDPOINTS.USER.PROFILE, profileData)
  }

  // Pet Management
  async getPets(): Promise<Pet[]> {
    return await apiClient.get<Pet[]>(API_ENDPOINTS.USER.PETS)
  }

  async getPet(petId: string): Promise<Pet> {
    return await apiClient.get<Pet>(API_ENDPOINTS.USER.PET(petId))
  }

  async createPet(petData: Omit<Pet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    return await apiClient.post<Pet>(API_ENDPOINTS.USER.PETS, petData)
  }

  async updatePet(petId: string, petData: Partial<Pet>): Promise<Pet> {
    return await apiClient.put<Pet>(API_ENDPOINTS.USER.PET(petId), petData)
  }

  async deletePet(petId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.PET(petId))
  }

  // Appointment Management
  async getAppointments(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Appointment>> {
    return await apiClient.get<PaginatedResponse<Appointment>>(API_ENDPOINTS.USER.APPOINTMENTS, { params })
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    return await apiClient.get<Appointment>(API_ENDPOINTS.USER.APPOINTMENT(appointmentId))
  }

  async createAppointment(appointmentData: {
    serviceId: string
    petId?: string
    dateTime: string
    appointmentDate?: string
    duration?: number
    price?: number
    notes?: string
    specialRequests?: string
  }): Promise<Appointment> {
    return await apiClient.post<Appointment>(API_ENDPOINTS.USER.APPOINTMENTS, appointmentData)
  }

  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    return await apiClient.put<Appointment>(API_ENDPOINTS.USER.APPOINTMENT(appointmentId), appointmentData)
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    await apiClient.patch(`${API_ENDPOINTS.USER.APPOINTMENT(appointmentId)}/cancel`, {
      cancellationReason: reason
    })
  }

  // Shopping Cart
  async getCart(): Promise<CartItem[]> {
    return await apiClient.get<CartItem[]>(API_ENDPOINTS.USER.CART)
  }

  async addToCart(productId: string, variantId?: string, quantity: number = 1): Promise<CartItem> {
    return await apiClient.post<CartItem>(API_ENDPOINTS.USER.CART, {
      productId,
      variantId,
      quantity
    })
  }

  async updateCartItem(cartItemId: string, quantity: number): Promise<CartItem> {
    return await apiClient.put<CartItem>(API_ENDPOINTS.USER.CART_ITEM(cartItemId), { quantity })
  }

  async removeFromCart(cartItemId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.CART_ITEM(cartItemId))
  }

  async clearCart(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.CART)
  }

  // Checkout & Orders
  async checkout(checkoutData: {
    shippingAddress: string
    paymentMethod: string
    discountCode?: string
  }): Promise<Order> {
    return await apiClient.post<Order>(API_ENDPOINTS.USER.CHECKOUT, checkoutData)
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> {
    return await apiClient.get<PaginatedResponse<Order>>(API_ENDPOINTS.USER.ORDERS, { params })
  }

  async getOrder(orderId: string): Promise<Order> {
    return await apiClient.get<Order>(API_ENDPOINTS.USER.ORDER(orderId))
  }

  async reorder(orderId: string): Promise<Order> {
    return await apiClient.post<Order>(`${API_ENDPOINTS.USER.ORDER(orderId)}/reorder`)
  }

  // Reviews
  async createReview(reviewData: {
    reviewableType: 'service' | 'product'
    reviewableId: string
    rating: number
    comment?: string
  }): Promise<Review> {
    return await apiClient.post<Review>(API_ENDPOINTS.USER.REVIEWS, reviewData)
  }

  async getMyReviews(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Review>> {
    return await apiClient.get<PaginatedResponse<Review>>(API_ENDPOINTS.USER.REVIEWS, { params })
  }

  async updateReview(reviewId: string, reviewData: Partial<Review>): Promise<Review> {
    return await apiClient.put<Review>(API_ENDPOINTS.USER.REVIEW(reviewId), reviewData)
  }

  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.REVIEW(reviewId))
  }

  // Consultations
  async getConsultations(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Consultation>> {
    return await apiClient.get<PaginatedResponse<Consultation>>(API_ENDPOINTS.USER.CONSULTATIONS, { params })
  }

  async createConsultation(consultationData: {
    petId: string
    subject: string
    description: string
    priority?: 'low' | 'medium' | 'high'
  }): Promise<Consultation> {
    return await apiClient.post<Consultation>(API_ENDPOINTS.USER.CONSULTATIONS, consultationData)
  }

  async getConsultation(consultationId: string): Promise<Consultation> {
    return await apiClient.get<Consultation>(API_ENDPOINTS.USER.CONSULTATION(consultationId))
  }

  async addConsultationMessage(consultationId: string, message: string, attachments?: File[]): Promise<ConsultationMessage> {
    const formData = new FormData()
    formData.append('message', message)
    
    if (attachments) {
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })
    }

    return await apiClient.post<ConsultationMessage>(
      `${API_ENDPOINTS.USER.CONSULTATION(consultationId)}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  }

  // Community Posts
  async getCommunityPosts(params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Post>> {
    return await apiClient.get<PaginatedResponse<Post>>(API_ENDPOINTS.USER.COMMUNITY, { params })
  }

  async createPost(postData: {
    title: string
    content: string
    categoryId?: string
  }): Promise<Post> {
    return await apiClient.post<Post>(API_ENDPOINTS.USER.COMMUNITY, postData)
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    return await apiClient.put<Post>(API_ENDPOINTS.USER.COMMUNITY_POST(postId), postData)
  }

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.COMMUNITY_POST(postId))
  }

  async likePost(postId: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.USER.COMMUNITY_POST(postId)}/like`)
  }

  async unlikePost(postId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.USER.COMMUNITY_POST(postId)}/like`)
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationPreferences> {
    return await apiClient.get<NotificationPreferences>(API_ENDPOINTS.USER.NOTIFICATION_SETTINGS)
  }

  async updateNotificationSettings(settings: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return await apiClient.put<NotificationPreferences>(API_ENDPOINTS.USER.NOTIFICATION_SETTINGS, settings)
  }

  // Wishlist
  async getWishlists(): Promise<Wishlist[]> {
    return await apiClient.get<Wishlist[]>(API_ENDPOINTS.USER.WISHLIST)
  }

  async createWishlist(name: string, isPublic: boolean = false): Promise<Wishlist> {
    return await apiClient.post<Wishlist>(API_ENDPOINTS.USER.WISHLIST, { name, isPublic })
  }

  async addToWishlist(wishlistId: string, productId?: string, serviceId?: string): Promise<WishlistItem> {
    return await apiClient.post<WishlistItem>(`${API_ENDPOINTS.USER.WISHLIST}/${wishlistId}/items`, {
      productId,
      serviceId
    })
  }

  async removeFromWishlist(wishlistId: string, itemId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.USER.WISHLIST}/${wishlistId}/items/${itemId}`)
  }

  async deleteWishlist(wishlistId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.WISHLIST_ITEM(wishlistId))
  }
}

export const userService = new UserService()
export default userService