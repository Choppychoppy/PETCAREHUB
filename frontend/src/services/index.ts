// Export all services
export { authService } from './auth.service'
export { userService } from './user.service'
export { adminService } from './admin.service'
export { staffService } from './staff.service'
export { publicService } from './public.service'
export { profileService } from './profile.service'
export { communityService } from './community.service'
export { aiService } from './ai.service'
export { chatbotService } from './chatbot.service'

// Export API client and config
export { apiClient } from '@/lib/api/client'
export { API_ENDPOINTS, API_CONFIG } from '@/lib/api/config'

// Re-export types for convenience
export * from '@/types'