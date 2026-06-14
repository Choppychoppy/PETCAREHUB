import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import type { 
  Service, 
  Appointment, 
  Order, 
  User, 
  Product, 
  Category, 
  Post,
  SupportTicket,
  SupportMessage,
  PaginatedResponse,
  Notification
} from '@/types'

class AdminService {
  // Service Management - sử dụng trực tiếp module services
  async getServices(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<Service>> {
    return await apiClient.get<PaginatedResponse<Service>>(API_ENDPOINTS.ADMIN.SERVICES, { params })
  }

  async getService(serviceId: string): Promise<Service> {
    return await apiClient.get<Service>(API_ENDPOINTS.ADMIN.SERVICE(serviceId))
  }

  async createService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    return await apiClient.post<Service>(API_ENDPOINTS.ADMIN.SERVICES, serviceData)
  }

  async updateService(serviceId: string, serviceData: Partial<Service>): Promise<Service> {
    return await apiClient.put<Service>(API_ENDPOINTS.ADMIN.SERVICE(serviceId), serviceData)
  }

  async deleteService(serviceId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.SERVICE(serviceId))
  }

  // Appointment Management - sử dụng trực tiếp module appointments
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    search?: string;
    staffId?: string;
    serviceId?: string;
  }): Promise<PaginatedResponse<Appointment>> {
    return await apiClient.get<PaginatedResponse<Appointment>>(API_ENDPOINTS.ADMIN.APPOINTMENTS, { params })
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    return await apiClient.get<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId))
  }

  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
    return await apiClient.put<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId), appointmentData)
  }

  async assignStaff(appointmentId: string, staffId: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId), { staffId })
  }

  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId), { 
      status: 'confirmed' 
    })
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId), { 
      status: 'cancelled',
      cancellationReason: reason
    })
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.APPOINTMENT(appointmentId))
  }

  // Admin/Nhân viên tạo lịch hẹn cho khách (đã có / chưa có tài khoản)
  async createStaffAppointment(data: {
    customerType: 'registered' | 'guest'
    userId?: string
    petId?: string
    guestName?: string
    guestPhone?: string
    guestEmail?: string
    guestPetName?: string
    guestPetSpecies?: string
    serviceId: string
    appointmentDate: string
    duration?: number
    price?: number
    staffId?: string
    notes?: string
    specialRequests?: string
    isArchived?: boolean
  }): Promise<Appointment> {
    return await apiClient.post<Appointment>(API_ENDPOINTS.ADMIN.APPOINTMENT_CREATE_STAFF, data)
  }

  // Danh sách nhân viên để phân công phụ trách
  async getStaffMembers(): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
    return await apiClient.get(API_ENDPOINTS.ADMIN.APPOINTMENT_STAFF_MEMBERS)
  }

  // Tìm khách hàng đã có tài khoản theo tên/email/sđt
  async searchCustomers(q: string): Promise<Array<{
    id: string
    name: string
    email: string
    phone: string | null
    pets: Array<{ id: string; name: string; species: string }>
  }>> {
    return await apiClient.get(API_ENDPOINTS.ADMIN.APPOINTMENT_SEARCH_CUSTOMERS, { params: { q } })
  }

  // Order Management - sử dụng trực tiếp module orders
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<PaginatedResponse<Order>> {
    return await apiClient.get<PaginatedResponse<Order>>(API_ENDPOINTS.ADMIN.ORDERS, { params })
  }

  async getOrder(orderId: string): Promise<Order> {
    return await apiClient.get<Order>(API_ENDPOINTS.ADMIN.ORDER(orderId))
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return await apiClient.patch<Order>(API_ENDPOINTS.ADMIN.ORDER(orderId), { status })
  }

  async deleteOrder(orderId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.ORDER(orderId))
  }

  // Discount Code Management - sử dụng trực tiếp module discount-codes
  async getDiscountCodes(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<any>> {
    return await apiClient.get<PaginatedResponse<any>>(API_ENDPOINTS.ADMIN.DISCOUNT_CODES, { params })
  }

  async createDiscountCode(discountData: {
    code: string
    name: string
    description?: string
    type: 'fixed_amount' | 'percentage'
    value: number
    minOrderAmount?: number
    maxDiscountAmount?: number
    usageLimit?: number
    validFrom: string
    validTo: string
    status?: string
    applicableProducts?: string[]
    applicableCategories?: string[]
  }): Promise<any> {
    return await apiClient.post<any>(API_ENDPOINTS.ADMIN.DISCOUNT_CODES, discountData)
  }

  async updateDiscountCode(discountId: string, discountData: any): Promise<any> {
    return await apiClient.patch<any>(API_ENDPOINTS.ADMIN.DISCOUNT_CODE(discountId), discountData)
  }

  async deleteDiscountCode(discountId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.DISCOUNT_CODE(discountId))
  }

  // User Management - sử dụng trực tiếp module users
  async getUsers(params?: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    return await apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.ADMIN.USERS, { params })
  }

  async getUser(userId: string): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.ADMIN.USER(userId))
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return await apiClient.put<User>(API_ENDPOINTS.ADMIN.USER(userId), userData)
  }

  async banUser(userId: string, reason?: string): Promise<void> {
    await apiClient.patch(`${API_ENDPOINTS.ADMIN.USER(userId)}/ban`, { reason })
  }

  async unbanUser(userId: string): Promise<void> {
    await apiClient.patch(`${API_ENDPOINTS.ADMIN.USER(userId)}/unban`, {})
  }

  async resetUserPassword(userId: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.USER(userId)}/reset-password`)
  }

  // Product Management - sử dụng trực tiếp module products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: string;
    search?: string;
    lowStock?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    minStockQuantity?: number;
    maxStockQuantity?: number;
  }): Promise<PaginatedResponse<Product>> {
    return await apiClient.get<PaginatedResponse<Product>>(API_ENDPOINTS.ADMIN.PRODUCTS, { params })
  }

  async getProduct(productId: string): Promise<Product> {
    return await apiClient.get<Product>(API_ENDPOINTS.ADMIN.PRODUCT(productId))
  }

  async createProduct(productData: any): Promise<Product> {
    return await apiClient.post<Product>(API_ENDPOINTS.ADMIN.PRODUCTS, productData)
  }

  async updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    return await apiClient.put<Product>(API_ENDPOINTS.ADMIN.PRODUCT(productId), productData)
  }

  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.PRODUCT(productId))
  }

  async updateStock(productId: string, quantity: number): Promise<any> {
    return await apiClient.put(API_ENDPOINTS.ADMIN.PRODUCT_UPDATE_STOCK(productId), { quantity })
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    return await apiClient.get<Product[]>(API_ENDPOINTS.ADMIN.PRODUCT_LOW_STOCK, { 
      params: threshold ? { threshold } : {} 
    })
  }

  async uploadProductImages(productId: string, images: File[]): Promise<any> {
    const formData = new FormData()
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image)
    })
    
    return await apiClient.upload(`${API_ENDPOINTS.ADMIN.PRODUCT(productId)}/images`, formData)
  }

  // Category Management - sử dụng trực tiếp module categories
  async getCategories(params?: { 
    page?: number; 
    limit?: number; 
    type?: string;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Category>> {
    return await apiClient.get<PaginatedResponse<Category>>(API_ENDPOINTS.ADMIN.CATEGORIES, { params })
  }

  async getCategory(categoryId: string): Promise<Category> {
    return await apiClient.get<Category>(API_ENDPOINTS.ADMIN.CATEGORY(categoryId))
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    return await apiClient.post<Category>(API_ENDPOINTS.ADMIN.CATEGORIES, categoryData)
  }

  async updateCategory(categoryId: string, categoryData: Partial<Category>): Promise<Category> {
    return await apiClient.put<Category>(API_ENDPOINTS.ADMIN.CATEGORY(categoryId), categoryData)
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.CATEGORY(categoryId))
  }

  // Content Management - sử dụng trực tiếp module posts
  async getPosts(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<Post>> {
    return await apiClient.get<PaginatedResponse<Post>>(API_ENDPOINTS.ADMIN.POSTS, { params })
  }

  async getPost(postId: string): Promise<Post> {
    return await apiClient.get<Post>(API_ENDPOINTS.ADMIN.POST(postId))
  }

  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    return await apiClient.post<Post>(API_ENDPOINTS.ADMIN.POSTS, postData)
  }

  async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
    return await apiClient.put<Post>(API_ENDPOINTS.ADMIN.POST(postId), postData)
  }

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.POST(postId))
  }

  // Support Management - sử dụng trực tiếp module support
  async getSupportTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PaginatedResponse<SupportTicket>> {
    return await apiClient.get<PaginatedResponse<SupportTicket>>(API_ENDPOINTS.ADMIN.SUPPORT, { params })
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicket> {
    return await apiClient.get<SupportTicket>(API_ENDPOINTS.ADMIN.SUPPORT_TICKET(ticketId))
  }

  async createSupportTicket(ticketData: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<SupportTicket> {
    return await apiClient.post<SupportTicket>(API_ENDPOINTS.ADMIN.SUPPORT, ticketData)
  }

  async updateSupportTicket(ticketId: string, ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    return await apiClient.put<SupportTicket>(API_ENDPOINTS.ADMIN.SUPPORT_TICKET(ticketId), ticketData)
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<SupportTicket> {
    return await apiClient.put<SupportTicket>(API_ENDPOINTS.ADMIN.SUPPORT_TICKET(ticketId), { status })
  }

  async assignSupportTicket(ticketId: string, staffId: string): Promise<SupportTicket> {
    return await apiClient.put<SupportTicket>(API_ENDPOINTS.ADMIN.SUPPORT_TICKET_ASSIGN(ticketId), { staffId })
  }

  async addSupportMessage(ticketId: string, message: string): Promise<SupportMessage> {
    return await apiClient.post<SupportMessage>(API_ENDPOINTS.ADMIN.SUPPORT_TICKET_MESSAGES(ticketId), { message })
  }

  // Notifications - sử dụng trực tiếp module notifications  
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<Notification>> {
    return await apiClient.get<PaginatedResponse<Notification>>(API_ENDPOINTS.ADMIN.NOTIFICATIONS, { params })
  }

  // Reports - for analytics and reporting
  async getReport(reportType: string, params?: any): Promise<any> {
    return await apiClient.get<any>(`/reports/${reportType}`, { params })
  }

  // Settings Management
  async getSettings(): Promise<any> {
    return await apiClient.get<any>('/settings')
  }

  async getBusinessHours(): Promise<any> {
    return await apiClient.get<any>('/settings/business-hours')
  }

  async updateSettings(settingsData: any): Promise<any> {
    return await apiClient.put<any>('/settings', settingsData)
  }

  async updateBusinessHours(businessHours: any): Promise<any> {
    return await apiClient.put<any>('/settings/business-hours', businessHours)
  }

  async sendNotification(notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    userId?: string;
  }): Promise<Notification> {
    return await apiClient.post<Notification>(API_ENDPOINTS.ADMIN.NOTIFICATIONS, notificationData)
  }

  // Dashboard Statistics - sử dụng reports API với fallback
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    totalAppointments: number;
    totalProducts?: number;
    thisMonth?: {
      orders: number;
      revenue: number;
      newUsers: number;
    };
    trends?: {
      orders: number;
      revenue: number;
    };
    recentOrders?: Order[];
    recentAppointments?: Appointment[];
    lowStockProducts?: Product[];
    pendingSupport?: SupportTicket[];
  }> {
    try {
      // Try the dedicated reports endpoint first
      return await apiClient.get<any>('/reports/dashboard')
    } catch (error) {
      // Fallback to original logic if reports API not available
      const [
        users,
        orders,
        appointments,
        lowStockProducts,
        pendingSupport
      ] = await Promise.all([
        this.getUsers({ limit: 1 }),
        this.getOrders({ limit: 5 }),
        this.getAppointments({ limit: 5 }),
        this.getLowStockProducts().catch(() => []),
        this.getSupportTickets({ status: 'open', limit: 5 }).catch(() => ({ data: [] }))
      ])

      const totalRevenue = orders.data?.reduce((sum: number, order: Order) => {
        return sum + (order.totalAmount || 0)
      }, 0) || 0

      return {
        totalUsers: users.meta?.total || 0,
        totalOrders: orders.meta?.total || 0,
        totalRevenue,
        totalAppointments: appointments.meta?.total || 0,
        recentOrders: orders.data || [],
        recentAppointments: appointments.data || [],
        lowStockProducts: lowStockProducts || [],
        pendingSupport: pendingSupport.data || []
      }
    }
  }

  // Analytics & Reports - tạo từ dữ liệu các module
  async getRevenuereport(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    data: number[];
    total: number;
  }> {
    // Lấy orders trong khoảng thời gian
    const orders = await this.getOrders({ limit: 1000 }) // Có thể cần pagination
    
    // Xử lý dữ liệu để tạo chart
    const processedData = this.processRevenueData(orders.data || [], period)
    
    return processedData
  }

  async getTopProducts(limit = 10): Promise<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
  }[]> {
    // Logic để tính top products từ orders
    const orders = await this.getOrders({ limit: 1000 })
    return this.processTopProducts(orders.data || [], limit)
  }

  async getCustomerAnalytics(): Promise<{
    newCustomers: number;
    returningCustomers: number;
    customerRetentionRate: number;
  }> {
    // Logic để tính customer analytics
    const users = await this.getUsers({ limit: 1000 })
    return this.processCustomerAnalytics(users.data || [])
  }

  // Helper methods để xử lý data
  private processRevenueData(orders: Order[], period: string) {
    // Implementation để group orders theo thời gian
    const labels: string[] = []
    const data: number[] = []
    let total = 0
    
    // Logic xử lý tùy theo period
    orders.forEach(order => {
      total += order.totalAmount || 0
    })
    
    return { labels, data, total }
  }

  private processTopProducts(orders: Order[], limit: number) {
    // Implementation để tính top products
    return []
  }

  private processCustomerAnalytics(users: User[]) {
    // Implementation để tính customer analytics
    return {
      newCustomers: users.length,
      returningCustomers: 0,
      customerRetentionRate: 0
    }
  }
}

export const adminService = new AdminService()