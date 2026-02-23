import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/config'
import type { Appointment, Service, PaginatedResponse } from '@/types'

interface Promotion {
  id: string
  name: string
  description: string
  type: 'bundle' | 'discount' | 'seasonal'
  conditions: {
    minAmount?: number
    validUntil?: string
    applicableServices?: string[]
  }
  discount: {
    type: 'percentage' | 'fixed'
    value: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

class StaffService {
  // Personal Appointment Management
  async getMyAppointments(params?: { 
    page?: number; 
    limit?: number; 
    date?: string;
    status?: string;
  }): Promise<PaginatedResponse<Appointment>> {
    return await apiClient.get<PaginatedResponse<Appointment>>(API_ENDPOINTS.STAFF.APPOINTMENTS, { params })
  }

  async getMyAppointment(appointmentId: string): Promise<Appointment> {
    return await apiClient.get<Appointment>(API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId))
  }

  async updateAppointmentStatus(appointmentId: string, status: 'in-progress' | 'completed'): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId), { status })
  }

  async addAppointmentNotes(appointmentId: string, notes: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId), { notes })
  }

  async uploadGroomingPhotos(appointmentId: string, photos: File[]): Promise<void> {
    const formData = new FormData()
    photos.forEach((photo, index) => {
      formData.append(`photo_${index}`, photo)
    })
    
    await apiClient.upload(`${API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId)}/photos`, formData)
  }

  async markAppointmentComplete(appointmentId: string, completionData: {
    notes?: string
    beforePhotos?: File[]
    afterPhotos?: File[]
    recommendations?: string
  }): Promise<Appointment> {
    const formData = new FormData()
    formData.append('status', 'completed')
    
    if (completionData.notes) {
      formData.append('notes', completionData.notes)
    }
    
    if (completionData.recommendations) {
      formData.append('recommendations', completionData.recommendations)
    }
    
    if (completionData.beforePhotos) {
      completionData.beforePhotos.forEach((photo, index) => {
        formData.append(`before_photo_${index}`, photo)
      })
    }
    
    if (completionData.afterPhotos) {
      completionData.afterPhotos.forEach((photo, index) => {
        formData.append(`after_photo_${index}`, photo)
      })
    }
    
    return await apiClient.post<Appointment>(
      `${API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId)}/complete`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  }

  // Service Information (Read-only)
  async getServices(params?: { 
    page?: number; 
    limit?: number; 
    categoryId?: string;
    search?: string;
  }): Promise<PaginatedResponse<Service>> {
    return await apiClient.get<PaginatedResponse<Service>>(API_ENDPOINTS.STAFF.SERVICES, { params })
  }

  async getService(serviceId: string): Promise<Service> {
    return await apiClient.get<Service>(`${API_ENDPOINTS.STAFF.SERVICES}/${serviceId}`)
  }

  // Promotion Management
  async getPromotions(params?: { 
    page?: number; 
    limit?: number; 
    type?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Promotion>> {
    return await apiClient.get<PaginatedResponse<Promotion>>(API_ENDPOINTS.STAFF.PROMOTIONS, { params })
  }

  async getPromotion(promotionId: string): Promise<Promotion> {
    return await apiClient.get<Promotion>(API_ENDPOINTS.STAFF.PROMOTION(promotionId))
  }

  async createPromotion(promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Promotion> {
    return await apiClient.post<Promotion>(API_ENDPOINTS.STAFF.PROMOTIONS, promotionData)
  }

  async updatePromotion(promotionId: string, promotionData: Partial<Promotion>): Promise<Promotion> {
    return await apiClient.put<Promotion>(API_ENDPOINTS.STAFF.PROMOTION(promotionId), promotionData)
  }

  async deletePromotion(promotionId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.STAFF.PROMOTION(promotionId))
  }

  async togglePromotion(promotionId: string, isActive: boolean): Promise<Promotion> {
    return await apiClient.patch<Promotion>(API_ENDPOINTS.STAFF.PROMOTION(promotionId), { isActive })
  }

  // Performance & Statistics
  async getMyStats(params?: { 
    dateFrom?: string; 
    dateTo?: string;
  }): Promise<{
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    totalRevenue: number
    averageRating: number
    customerSatisfaction: number
    upcomingAppointments: Appointment[]
    recentCompletedAppointments: Appointment[]
  }> {
    return await apiClient.get<any>(`${API_ENDPOINTS.STAFF.APPOINTMENTS}/stats`, { params })
  }

  // Schedule & Availability
  async getMySchedule(date: string): Promise<{
    date: string
    appointments: Appointment[]
    availableSlots: string[]
    workingHours: {
      start: string
      end: string
    }
  }> {
    return await apiClient.get<any>(`${API_ENDPOINTS.STAFF.APPOINTMENTS}/schedule`, { 
      params: { date }
    })
  }

  async setAvailability(availabilityData: {
    date: string
    availableSlots: string[]
    unavailableSlots?: string[]
    notes?: string
  }): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.STAFF.APPOINTMENTS}/availability`, availabilityData)
  }

  // Customer Communication
  async sendAppointmentReminder(appointmentId: string, message?: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId)}/reminder`, {
      message
    })
  }

  async sendFollowUpMessage(appointmentId: string, message: string): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId)}/follow-up`, {
      message
    })
  }

  // Quick Actions
  async checkInCustomer(appointmentId: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId), {
      status: 'in-progress',
      checkedInAt: new Date().toISOString()
    })
  }

  async rescheduleAppointment(appointmentId: string, newDateTime: string, reason?: string): Promise<Appointment> {
    return await apiClient.patch<Appointment>(API_ENDPOINTS.STAFF.APPOINTMENT(appointmentId), {
      dateTime: newDateTime,
      rescheduleReason: reason
    })
  }
}

export const staffService = new StaffService()
export default staffService