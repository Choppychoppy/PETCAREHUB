export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_PREFIX: 'api',
  TIMEOUT: 30000,
} as const

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    ME: '/auth/me',
  },

  // Admin Endpoints - Using direct module endpoints
  ADMIN: {
    // Service Management
    SERVICES: '/services',
    SERVICE: (id: string) => `/services/${id}`,
    
    // Appointment Management
    APPOINTMENTS: '/appointments',
    APPOINTMENT: (id: string) => `/appointments/${id}`,
    APPOINTMENT_CREATE_STAFF: '/appointments/staff',
    APPOINTMENT_STAFF_MEMBERS: '/appointments/staff-members',
    APPOINTMENT_SEARCH_CUSTOMERS: '/appointments/search-customers',

    // Order Management
    ORDERS: '/orders',
    ORDER: (id: string) => `/orders/${id}`,
    
    // Discount Code Management
    DISCOUNT_CODES: '/discount-codes',
    DISCOUNT_CODE: (id: string) => `/discount-codes/${id}`,
    
    // User Management
    USERS: '/users',
    USER: (id: string) => `/users/${id}`,
    
    // Product Management
    PRODUCTS: '/products',
    PRODUCT: (id: string) => `/products/${id}`,
    PRODUCT_LOW_STOCK: '/products/low-stock',
    PRODUCT_UPDATE_STOCK: (id: string) => `/products/${id}/stock`,
    
    // Category Management
    CATEGORIES: '/categories',
    CATEGORY: (id: string) => `/categories/${id}`,
    
    // Content Management (Posts)
    POSTS: '/posts',
    POST: (id: string) => `/posts/${id}`,
    
    // Support Management
    SUPPORT: '/support/tickets',
    SUPPORT_TICKET: (id: string) => `/support/tickets/${id}`,
    SUPPORT_TICKET_ASSIGN: (id: string) => `/support/tickets/${id}/assign`,
    SUPPORT_TICKET_MESSAGES: (id: string) => `/support/tickets/${id}/messages`,
    
    // Notifications
    NOTIFICATIONS: '/notifications',
  },

  // Staff Endpoints
  STAFF: {
    // Personal Appointments
    APPOINTMENTS: '/staff/appointments',
    APPOINTMENT: (id: string) => `/staff/appointments/${id}`,
    
    // Promotions
    PROMOTIONS: '/staff/promotions',
    PROMOTION: (id: string) => `/staff/promotions/${id}`,
    
    // Services (Read-only)
    SERVICES: '/staff/services',
  },

  // User Endpoints
  USER: {
    // Profile Management
    PROFILE: '/profile',
    CHANGE_PASSWORD: '/profile/change-password',
    
    // Pet Management
    PETS: '/pets',
    PET: (id: string) => `/pets/${id}`,
    
    // Appointments
    APPOINTMENTS: '/appointments',
    APPOINTMENT: (id: string) => `/appointments/${id}`,
    
    // Shopping & Cart
    CART: '/user/cart',
    CART_ITEM: (id: string) => `/user/cart/${id}`,
    CHECKOUT: '/orders',
    
    // Orders
    ORDERS: '/orders/my-orders',
    ORDER: (id: string) => `/orders/${id}`,
    
    // Reviews
    REVIEWS: '/user/reviews',
    REVIEW: (id: string) => `/user/reviews/${id}`,
    
    // Consultations
    CONSULTATIONS: '/user/consultations',
    CONSULTATION: (id: string) => `/user/consultations/${id}`,
    
    // Community
    COMMUNITY: '/user/community',
    COMMUNITY_POST: (id: string) => `/user/community/${id}`,
    
    // Notification Settings
    NOTIFICATION_SETTINGS: '/user/notification-settings',
    
    // Wishlist
    WISHLIST: '/user/wishlist',
    WISHLIST_ITEM: (id: string) => `/user/wishlist/${id}`,
  },

  // Public Endpoints (no auth required)
  PUBLIC: {
    // Search
    SEARCH: {
      SERVICES: '/search/services',
      PRODUCTS: '/search/products',
    },
    
    // Services & Products (Browse)
    SERVICES: '/services',
    SERVICE: (id: string) => `/services/${id}`,
    PRODUCTS: '/products',
    PRODUCT: (id: string) => `/products/${id}`,
    CATEGORIES: '/categories',
    
    // Blog & Content
    BLOG: '/posts/published',
    BLOG_POST: (id: string) => `/posts/${id}`,

    // Discount Code Validation
    VALIDATE_DISCOUNT: (code: string) => `/discount-codes/validate/${code}`,
  },
} as const