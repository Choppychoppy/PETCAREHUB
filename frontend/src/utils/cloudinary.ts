/**
 * Cloudinary Upload Utility
 * Upload images via backend API (secure method)
 */

const API_URL = 'http://localhost:3001/api'
const CLOUDINARY_CLOUD_NAME = 'daytrfyrg'

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  format: string
  width: number
  height: number
  bytes: number
  [key: string]: any
}

/**
 * Upload a file to Cloudinary via backend API
 * @param file - The file to upload (from input type="file")
 * @param folder - Optional folder path in Cloudinary (e.g., 'products', 'services')
 * @returns Promise with the secure URL and other metadata
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = 'petcare'
): Promise<CloudinaryUploadResponse> => {
  // Validate file
  if (!file) {
    throw new Error('No file provided')
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.')
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit')
  }

  try {
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)

    // Get token from localStorage
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required. Please login.')
    }

    // Upload via backend API
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      let errorMessage = 'Upload failed'
      try {
        const error = await response.json()
        errorMessage = error.message || errorMessage
      } catch (e) {
        // If can't parse JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      console.error('Upload response error:', errorMessage)
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('Upload result:', result)

    // Return in expected format
    return {
      secure_url: result.data?.url || result.url,
      public_id: result.data?.publicId || result.public_id,
      format: result.data?.format || result.format,
      width: result.data?.width || result.width,
      height: result.data?.height || result.height,
      bytes: result.data?.size || result.bytes
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    throw new Error(error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.')
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  folder: string = 'petcare'
): Promise<CloudinaryUploadResponse[]> => {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder))
  return Promise.all(uploadPromises)
}

/**
 * Delete an image from Cloudinary (requires backend API endpoint)
 * This should be called via your backend for security
 * @param publicId - The public_id of the image to delete
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  // This should be handled by your backend API for security
  // Cloudinary API secret should never be exposed to frontend
  console.warn('Delete operation should be handled by backend API')
  throw new Error('Delete operation not implemented. Use backend API instead.')
}

/**
 * Generate Cloudinary URL with transformations
 * @param publicId - The public_id of the image
 * @param transformations - Cloudinary transformation options
 * @returns Transformed image URL
 */
export const getCloudinaryUrl = (
  publicId: string,
  transformations?: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  }
): string => {
  let url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`

  if (transformations) {
    const params: string[] = []
    if (transformations.width) params.push(`w_${transformations.width}`)
    if (transformations.height) params.push(`h_${transformations.height}`)
    if (transformations.crop) params.push(`c_${transformations.crop}`)
    if (transformations.quality) params.push(`q_${transformations.quality}`)
    if (transformations.format) params.push(`f_${transformations.format}`)

    if (params.length > 0) {
      url += params.join(',') + '/'
    }
  }

  url += publicId
  return url
}

/**
 * Get optimized thumbnail URL
 * @param publicId - The public_id of the image
 * @param size - Thumbnail size (default: 200)
 * @returns Optimized thumbnail URL
 */
export const getThumbnailUrl = (publicId: string, size: number = 200): string => {
  return getCloudinaryUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'webp'
  })
}
