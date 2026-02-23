import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'

export interface UserProfile {
  id: string
  email: string
  role: string
  status: string
  emailVerified: boolean
  lastLoginAt: string
  createdAt: string
  updatedAt: string
  profile: {
    id: string
    name: string
    phone: string
    address: string
    avatarUrl: string
    dateOfBirth: string
    gender: 'male' | 'female' | 'other'
    bio: string
    city: string
    country: string
    postalCode: string
  }
}

export interface UpdateProfileData {
  email?: string
  name?: string
  phone?: string
  address?: string
  avatarUrl?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  city?: string
  country?: string
  postalCode?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

class ProfileService {
  async getProfile(): Promise<UserProfile> {
    return await apiClient.get<UserProfile>(
      API_ENDPOINTS.USER.PROFILE
    )
  }

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    return await apiClient.put<UserProfile>(
      API_ENDPOINTS.USER.PROFILE,
      data
    )
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return await apiClient.put<{ message: string }>(
      API_ENDPOINTS.USER.CHANGE_PASSWORD,
      data
    )
  }
}

export const profileService = new ProfileService()
export default profileService