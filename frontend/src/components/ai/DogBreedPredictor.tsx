import { useState, useRef } from 'react'
import { Upload, X, Loader2, Dog, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { aiService, type PredictionResult, type SinglePredictionResponse } from '@/services/ai.service'
import { Button, Card } from '@/components/common'

interface DogBreedPredictorProps {
  onPredictionComplete?: (result: SinglePredictionResponse) => void
  maxFileSize?: number // in MB
  topK?: number
}

export const DogBreedPredictor = ({
  onPredictionComplete,
  maxFileSize = 10,
  topK = 5
}: DogBreedPredictorProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = aiService.validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'File không hợp lệ')
      return
    }

    // Set selected file
    setSelectedImage(file)
    setPrediction(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setPrediction(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePredict = async () => {
    if (!selectedImage) {
      toast.error('Vui lòng chọn ảnh trước!')
      return
    }

    const toastId = toast.loading('Đang phân tích ảnh...')
    setPredicting(true)

    try {
      // Perform prediction
      const result = await aiService.predictFromFile(selectedImage, topK)

      setPrediction(result)
      toast.success('Phân tích thành công!', { id: toastId })

      if (onPredictionComplete) {
        onPredictionComplete(result)
      }
    } catch (error: any) {
      console.error('Prediction error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi phân tích ảnh', { id: toastId })
    } finally {
      setPredicting(false)
    }
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 70) return '#10B981' // Green - High confidence
    if (confidence >= 40) return '#F59E0B' // Amber - Medium confidence
    return '#EF4444' // Red - Low confidence
  }

  const getConfidenceBgColor = (confidence: number): string => {
    if (confidence >= 70) return 'bg-green-100'
    if (confidence >= 40) return 'bg-amber-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#2E86AB]" />
            <h3 className="font-semibold text-gray-900">Tải ảnh lên</h3>
          </div>

          {!imagePreview ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#2E86AB] bg-blue-50'
                  : 'border-gray-300 hover:border-[#2E86AB] hover:bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Dog className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Hỗ trợ: JPG, PNG, WEBP (tối đa {maxFileSize}MB)
              </p>
              <Button onClick={handleClickUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Chọn ảnh
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedImage && !prediction && (
            <div className="flex justify-center">
              <Button
                onClick={handlePredict}
                disabled={predicting}
                size="lg"
              >
                {predicting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Dog className="w-5 h-5 mr-2" />
                    Nhận diện giống chó
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results Section */}
      {prediction && prediction.success && (
        <Card>
          <div className="space-y-6">
            {/* Main Prediction */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Kết quả nhận diện</h3>
              </div>

              <div className="bg-gradient-to-r from-[#2E86AB]/10 to-[#F18F01]/10 rounded-xl p-6 border border-[#2E86AB]/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Giống chó được nhận diện:</p>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {prediction.prediction.breed}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Độ chính xác:</p>
                    <p className="text-3xl font-bold" style={{ color: getConfidenceColor(prediction.prediction.confidence_percent) }}>
                      {prediction.prediction.confidence_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prediction.prediction.confidence_percent}%`,
                      backgroundColor: getConfidenceColor(prediction.prediction.confidence_percent)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top Predictions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top {topK} giống chó phù hợp nhất:</h4>
              <div className="space-y-3">
                {prediction.top_predictions.map((pred, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      index === 0
                        ? 'border-[#2E86AB] bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0
                            ? 'bg-[#2E86AB] text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {pred.breed}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBgColor(pred.confidence_percent)}`}
                        style={{ color: getConfidenceColor(pred.confidence_percent) }}>
                        {pred.confidence_percent.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pred.confidence_percent}%`,
                          backgroundColor: getConfidenceColor(pred.confidence_percent)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Try Another */}
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleRemoveImage}>
                <Upload className="w-4 h-4 mr-2" />
                Thử ảnh khác
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {prediction && !prediction.success && (
        <Card>
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Có lỗi xảy ra</p>
              <p className="text-sm text-red-700">{prediction.error || 'Không thể phân tích ảnh này'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DogBreedPredictor
