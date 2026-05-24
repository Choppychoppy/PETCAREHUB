import { useRef, useState } from 'react'
import { Upload, X, Loader2, AlertCircle, CheckCircle, Stethoscope, ShieldAlert, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  diseaseService,
  type DiseasePredictionResponse,
  type DiseaseSeverity,
} from '@/services/disease.service'
import { Button, Card } from '@/components/common'

interface DogDiseaseDetectorProps {
  onPredictionComplete?: (result: DiseasePredictionResponse) => void
  maxFileSize?: number
  conf?: number
}

const SEVERITY_LABEL: Record<DiseaseSeverity | 'none', string> = {
  low: 'Nhẹ',
  medium: 'Trung bình',
  high: 'Nghiêm trọng',
  unknown: 'Không rõ',
  none: 'Không phát hiện',
}

const SEVERITY_STYLES: Record<DiseaseSeverity | 'none', { bg: string; text: string; border: string }> = {
  low:    { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300' },
  medium: { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  high:   { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  unknown:{ bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300' },
  none:   { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
}

export const DogDiseaseDetector = ({
  onPredictionComplete,
  maxFileSize = 10,
  conf = 0.25,
}: DogDiseaseDetectorProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<DiseasePredictionResponse | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)

  const handleFileSelect = (file: File) => {
    const v = diseaseService.validateImageFile(file)
    if (!v.valid) {
      toast.error(v.error || 'File không hợp lệ')
      return
    }
    setSelectedImage(file)
    setPrediction(null)
    setImgNatural(null)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setPrediction(null)
    setImgNatural(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePredict = async () => {
    if (!selectedImage) {
      toast.error('Vui lòng chọn ảnh trước!')
      return
    }
    const toastId = toast.loading('Đang phân tích ảnh...')
    setPredicting(true)
    try {
      const result = await diseaseService.predictFromFile(selectedImage, conf)
      setPrediction(result)
      if (result.detections.length === 0) {
        toast.success('Không phát hiện dấu hiệu bệnh!', { id: toastId })
      } else {
        toast.success(`Phát hiện ${result.detections.length} dấu hiệu`, { id: toastId })
      }
      onPredictionComplete?.(result)
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi phân tích ảnh', { id: toastId })
    } finally {
      setPredicting(false)
    }
  }

  const handleImgLoad = () => {
    const img = imgRef.current
    if (img) setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
  }

  const renderBoxes = () => {
    if (!prediction || !imgNatural || !imgRef.current) return null
    const displayW = imgRef.current.clientWidth
    const displayH = imgRef.current.clientHeight
    const scaleX = displayW / imgNatural.w
    const scaleY = displayH / imgNatural.h
    return prediction.detections.map((d, i) => {
      const left = d.box.x1 * scaleX
      const top = d.box.y1 * scaleY
      const w = (d.box.x2 - d.box.x1) * scaleX
      const h = (d.box.y2 - d.box.y1) * scaleY
      const color = d.severity === 'high' ? '#EF4444' : d.severity === 'medium' ? '#F59E0B' : '#3B82F6'
      return (
        <div
          key={i}
          className="absolute border-2 rounded-md pointer-events-none"
          style={{ left, top, width: w, height: h, borderColor: color }}
        >
          <span
            className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium text-white rounded"
            style={{ backgroundColor: color }}
          >
            {d.name_vi} {d.confidence_percent.toFixed(0)}%
          </span>
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#2E86AB]" />
            <h3 className="font-semibold text-gray-900">Tải ảnh thú cưng cần kiểm tra</h3>
          </div>

          {!imagePreview ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#2E86AB] bg-blue-50'
                  : 'border-gray-300 hover:border-[#2E86AB] hover:bg-gray-50'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFileSelect(f)
              }}
            >
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Hỗ trợ: JPG, PNG, WEBP (tối đa {maxFileSize}MB)
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Chọn ảnh
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
            <div className="relative inline-block w-full">
              <img
                ref={imgRef}
                src={imagePreview}
                alt="Preview"
                onLoad={handleImgLoad}
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
              {renderBoxes()}
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
              <Button onClick={handlePredict} disabled={predicting} size="lg">
                {predicting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang phân tích...</>
                ) : (
                  <><Activity className="w-5 h-5 mr-2" /> Phát hiện bệnh</>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Result */}
      {prediction && prediction.success && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Kết quả phát hiện</h3>
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-lg border ${SEVERITY_STYLES[prediction.summary.highest_severity].border} ${SEVERITY_STYLES[prediction.summary.highest_severity].bg}`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className={`w-6 h-6 ${SEVERITY_STYLES[prediction.summary.highest_severity].text}`} />
                <div className="flex-1">
                  <p className={`font-semibold ${SEVERITY_STYLES[prediction.summary.highest_severity].text}`}>
                    {prediction.summary.total_detections === 0
                      ? 'Không phát hiện dấu hiệu bệnh trong ảnh'
                      : `Phát hiện ${prediction.summary.total_detections} dấu hiệu - Mức độ: ${SEVERITY_LABEL[prediction.summary.highest_severity]}`}
                  </p>
                  {prediction.summary.diseases_found.length > 0 && (
                    <p className="text-sm text-gray-700 mt-1">
                      Loại bệnh: {prediction.summary.diseases_found.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detail list */}
            {prediction.detections.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Chi tiết từng dấu hiệu:</h4>
                {prediction.detections.map((d, i) => {
                  const s = SEVERITY_STYLES[d.severity]
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${s.border} bg-white`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.bg} ${s.text}`}>
                            {i + 1}
                          </span>
                          <h5 className="font-semibold text-gray-900">{d.name_vi}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                            {SEVERITY_LABEL[d.severity]}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#2E86AB]">
                          {d.confidence_percent.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{d.description}</p>
                      {d.suggestion && (
                        <div className="text-sm bg-gray-50 border-l-4 border-[#2E86AB] p-3 rounded">
                          <span className="font-medium text-gray-900">Gợi ý: </span>
                          <span className="text-gray-700">{d.suggestion}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={handleRemoveImage}>
                <Upload className="w-4 h-4 mr-2" /> Thử ảnh khác
              </Button>
            </div>
          </div>
        </Card>
      )}

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

export default DogDiseaseDetector
