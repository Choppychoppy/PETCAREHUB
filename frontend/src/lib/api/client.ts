import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_CONFIG } from './config'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.API_PREFIX}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and handle FormData
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Remove Content-Type for FormData so axios sets it automatically with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config

        // Các endpoint xác thực (đăng nhập, đăng ký, refresh, OTP) KHÔNG được tự refresh
        // hoặc redirect khi gặp 401 — lỗi phải được trả về cho form xử lý (vd: sai mật khẩu
        // thì giữ lại giao diện đăng nhập và hiển thị thông báo lỗi).
        const requestUrl: string = originalRequest?.url || ''
        const isAuthEndpoint = /\/auth\/(login|register|refresh|verify-otp|resend-otp)/.test(requestUrl)

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true

          try {
            await this.refreshToken()
            return this.client(originalRequest)
          } catch (refreshError) {
            this.clearToken()
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user_info')
            // Chỉ redirect khi không đang ở sẵn trang đăng nhập (tránh reload mất thông báo)
            if (!window.location.pathname.startsWith('/auth/login')) {
              window.location.href = '/auth/login'
            }
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Token management
  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    if (this.token) return this.token
    
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      this.token = stored
      return stored
    }
    
    return null
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) throw new Error('No refresh token')

    const response = await this.client.post('/auth/refresh', {
      refreshToken
    })

    // Unwrap data from response wrapper if it exists
    const data = response.data?.data ?? response.data
    const { accessToken } = data
    this.setToken(accessToken)

    return accessToken
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    // For paginated responses with meta, return both data and meta
    if (response.data?.meta) {
      return { data: response.data.data, meta: response.data.meta } as T
    }
    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    // For paginated responses with meta, return both data and meta
    if (response.data?.meta) {
      return { data: response.data.data, meta: response.data.meta } as T
    }
    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    // For paginated responses with meta, return both data and meta
    if (response.data?.meta) {
      return { data: response.data.data, meta: response.data.meta } as T
    }
    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config)
    // For paginated responses with meta, return both data and meta
    if (response.data?.meta) {
      return { data: response.data.data, meta: response.data.meta } as T
    }
    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    // For paginated responses with meta, return both data and meta
    if (response.data?.meta) {
      return { data: response.data.data, meta: response.data.meta } as T
    }
    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }

  // File upload
  async upload<T = any>(url: string, file: File | FormData, config?: AxiosRequestConfig): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData()
    if (file instanceof File) {
      formData.append('file', file)
    }

    const response = await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    })

    // Unwrap data from response wrapper if it exists
    return response.data?.data ?? response.data
  }
}

// Create singleton instance
export const apiClient = new ApiClient()
export default apiClient