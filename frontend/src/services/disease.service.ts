/**
 * Disease Detection Service - Nhận diện bệnh thường gặp ở chó.
 * Kết nối Flask AI API (mặc định http://localhost:5000).
 */

export type DiseaseSeverity = 'low' | 'medium' | 'high' | 'unknown'

export interface DiseaseClass {
  index: number
  code: string
  name_vi: string
  description: string
  severity: DiseaseSeverity
  suggestion: string
}

export interface DiseaseBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface DiseaseDetection {
  class: string
  name_vi: string
  confidence: number
  confidence_percent: number
  box: DiseaseBox
  description: string
  severity: DiseaseSeverity
  suggestion: string
}

export interface DiseaseSummary {
  total_detections: number
  diseases_found: string[]
  highest_severity: DiseaseSeverity | 'none'
}

export interface DiseasePredictionResponse {
  success: boolean
  detections: DiseaseDetection[]
  summary: DiseaseSummary
  error?: string
}

export interface DiseaseHealthResponse {
  status: 'healthy' | 'no_model' | string
  model_loaded: boolean
  num_classes: number
}

export interface DiseaseClassesResponse {
  total: number
  classes: DiseaseClass[]
}

class DiseaseService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://127.0.0.1:5000') {
    this.baseUrl = baseUrl
  }

  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  async healthCheck(): Promise<DiseaseHealthResponse> {
    const res = await fetch(`${this.baseUrl}/api/disease/health`)
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`)
    return res.json()
  }

  async getClasses(): Promise<DiseaseClassesResponse> {
    const res = await fetch(`${this.baseUrl}/api/disease/classes`)
    if (!res.ok) throw new Error(`Failed to get disease classes: ${res.statusText}`)
    return res.json()
  }

  async predictFromFile(file: File, conf: number = 0.25): Promise<DiseasePredictionResponse> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('conf', conf.toString())
    const res = await fetch(`${this.baseUrl}/api/disease/predict`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Phát hiện bệnh thất bại')
    }
    return data
  }

  async predictFromBase64(base64Image: string, conf: number = 0.25): Promise<DiseasePredictionResponse> {
    const res = await fetch(`${this.baseUrl}/api/disease/predict/base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, conf }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Phát hiện bệnh thất bại')
    }
    return data
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)' }
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { valid: false, error: 'Kích thước file không được vượt quá 10MB' }
    }
    return { valid: true }
  }
}

export const diseaseService = new DiseaseService()
export default diseaseService
