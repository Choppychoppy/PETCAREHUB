/**
 * AI Service for Dog Breed Prediction
 * Connects to Flask AI API Server (default: http://localhost:5000)
 */

export interface DogBreed {
  index: number
  code: string
  name: string
}

export interface PredictionResult {
  breed: string
  breed_code: string
  confidence: number
  confidence_percent: number
}

export interface SinglePredictionResponse {
  success: boolean
  prediction: PredictionResult
  top_predictions: PredictionResult[]
  error?: string
}

export interface BatchPredictionResult {
  filename: string
  success: boolean
  prediction?: PredictionResult
  top_predictions?: PredictionResult[]
  error?: string
}

export interface BatchPredictionResponse {
  success: boolean
  total: number
  predictions: BatchPredictionResult[]
  error?: string
}

export interface HealthCheckResponse {
  status: string
  model_loaded: boolean
  num_classes: number
}

export interface BreedsResponse {
  total: number
  breeds: DogBreed[]
}

class AIService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://127.0.0.1:5000') {
    this.baseUrl = baseUrl
  }

  /**
   * Set custom AI API URL
   */
  setBaseUrl(url: string) {
    this.baseUrl = url
  }

  /**
   * Health check - verify AI server is running
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('AI Server health check failed:', error)
      throw new Error('AI Server không phản hồi. Vui lòng đảm bảo server đang chạy.')
    }
  }

  /**
   * Get list of all supported dog breeds
   */
  async getBreeds(): Promise<BreedsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/breeds`)

      if (!response.ok) {
        throw new Error(`Failed to get breeds: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get breeds:', error)
      throw new Error('Không thể lấy danh sách giống chó.')
    }
  }

  /**
   * Predict dog breed from image file
   * @param imageFile - Image file to predict
   * @param topK - Number of top predictions to return (default: 5)
   */
  async predictFromFile(imageFile: File, topK: number = 5): Promise<SinglePredictionResponse> {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('top_k', topK.toString())

      const response = await fetch(`${this.baseUrl}/api/predict`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Prediction failed')
      }

      return data
    } catch (error: any) {
      console.error('Prediction failed:', error)
      throw new Error(error.message || 'Không thể nhận diện giống chó. Vui lòng thử lại.')
    }
  }

  /**
   * Predict dog breed from base64 encoded image
   * @param base64Image - Base64 encoded image string
   * @param topK - Number of top predictions to return (default: 5)
   */
  async predictFromBase64(base64Image: string, topK: number = 5): Promise<SinglePredictionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/predict/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          top_k: topK
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Prediction failed')
      }

      return data
    } catch (error: any) {
      console.error('Prediction failed:', error)
      throw new Error(error.message || 'Không thể nhận diện giống chó. Vui lòng thử lại.')
    }
  }

  /**
   * Predict multiple images at once
   * @param imageFiles - Array of image files
   * @param topK - Number of top predictions per image (default: 5)
   */
  async predictBatch(imageFiles: File[], topK: number = 5): Promise<BatchPredictionResponse> {
    try {
      const formData = new FormData()

      imageFiles.forEach(file => {
        formData.append('images', file)
      })

      formData.append('top_k', topK.toString())

      const response = await fetch(`${this.baseUrl}/api/predict/batch`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Batch prediction failed')
      }

      return data
    } catch (error: any) {
      console.error('Batch prediction failed:', error)
      throw new Error(error.message || 'Không thể xử lý nhiều ảnh. Vui lòng thử lại.')
    }
  }

  /**
   * Convert image file to base64 string
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)'
      }
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Kích thước file không được vượt quá 10MB'
      }
    }

    return { valid: true }
  }
}

// Export singleton instance
export const aiService = new AIService()
export default aiService
