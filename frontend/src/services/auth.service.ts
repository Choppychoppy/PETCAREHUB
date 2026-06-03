import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import type { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, User } from '@/types'

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )

    // Store tokens and user info
    apiClient.setToken(response.accessToken)
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken)
    }
    localStorage.setItem('user_info', JSON.stringify(response.user))

    return response
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    // Đăng ký xong KHÔNG nhận token: cần xác minh OTP trước.
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    )

    return response
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      { email, otp }
    )

    // Xác minh thành công -> tự đăng nhập (lưu token + user)
    apiClient.setToken(response.accessToken)
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken)
    }
    localStorage.setItem('user_info', JSON.stringify(response.user))

    return response
  }

  async resendOtp(email: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { email })
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } finally {
      // Clear all auth data regardless of API response
      apiClient.clearToken()
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await apiClient.post<{ accessToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    )
    
    apiClient.setToken(response.accessToken)
    return response.accessToken
  }

  async resetPassword(email: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email })
  }

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
  }

  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.AUTH.ME)
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!apiClient.getToken()
  }

  getCurrentToken(): string | null {
    return apiClient.getToken()
  }

  getCachedUser(): User | null {
    const userInfo = localStorage.getItem('user_info')
    if (!userInfo) return null
    try {
      return JSON.parse(userInfo)
    } catch {
      return null
    }
  }

  getUserRole(): 'admin' | 'staff' | 'user' | null {
    const user = this.getCachedUser()
    return user?.role || null
  }

  redirectAfterLogin(): void {
    const role = this.getUserRole()
    switch (role) {
      case 'admin':
        window.location.href = '/admin/dashboard'
        break
      case 'staff':
        window.location.href = '/staff/dashboard'
        break
      default:
        window.location.href = '/'
        break
    }
  }
}

export const authService = new AuthService()
export default authService