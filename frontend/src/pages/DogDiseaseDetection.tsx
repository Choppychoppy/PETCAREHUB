import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, Info, Sparkles, BookOpen, ShieldAlert, Calendar, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

import { DogDiseaseDetector } from '@/components/ai/DogDiseaseDetector'
import { Card, Button } from '@/components/common'
import {
  diseaseService,
  type DiseaseClass,
  type DiseasePredictionResponse,
} from '@/services/disease.service'
import { publicService } from '@/services'
import { formatVND } from '@/utils'

export const DogDiseaseDetection = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'no_model'>('checking')
  const [classes, setClasses] = useState<DiseaseClass[]>([])
  const [history, setHistory] = useState<Array<{
    timestamp: string
    diseases: string[]
    severity: string
  }>>([])
  const [suggestedServices, setSuggestedServices] = useState<any[]>([])
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    checkServerStatus()
    loadClasses()
    fetchVetServices()
  }, [])

  const checkServerStatus = async () => {
    try {
      const res = await diseaseService.healthCheck()
      if (res.model_loaded) {
        setServerStatus('online')
      } else {
        setServerStatus('no_model')
        toast.error('Mô hình AI chưa được train. Hãy chạy "py train_disease.py" tại folder AI.')
      }
    } catch (err) {
      setServerStatus('offline')
      toast.error('AI Server đang offline. Hãy khởi động "python api_server.py" trong folder AI.')
    }
  }

  const loadClasses = async () => {
    try {
      const res = await diseaseService.getClasses()
      setClasses(res.classes)
    } catch (err) {
      console.error('Failed to load disease classes:', err)
    }
  }

  const fetchVetServices = async () => {
    try {
      const res = await publicService.getServices({ limit: 20 })
      let list: any[] = []
      if (res && typeof res === 'object') {
        if ('data' in res && Array.isArray((res as any).data)) list = (res as any).data
        else if (Array.isArray(res)) list = res
      }
      // Ưu tiên dịch vụ khám / thú y / vaccine / da liễu
      const scored = list.map((s) => {
        const text = `${s.name || ''} ${s.description || ''}`.toLowerCase()
        let score = 0
        if (text.includes('khám') || text.includes('thú y') || text.includes('bác sĩ')) score += 10
        if (text.includes('vaccin') || text.includes('tiêm')) score += 6
        if (text.includes('da') || text.includes('lông')) score += 5
        if (text.includes('chó') || text.includes('dog')) score += 3
        return { ...s, _score: score }
      })
      const sorted = scored.sort((a, b) => b._score - a._score).slice(0, 4)
      setSuggestedServices(sorted)
    } catch (err) {
      console.error('Failed to fetch services:', err)
    }
  }

  const handlePredictionComplete = (result: DiseasePredictionResponse) => {
    if (!result.success) return
    setHistory((prev) => [
      {
        timestamp: new Date().toLocaleString('vi-VN'),
        diseases:
          result.detections.length === 0
            ? ['Không phát hiện']
            : Array.from(new Set(result.detections.map((d) => d.name_vi))),
        severity: result.summary.highest_severity,
      },
      ...prev.slice(0, 9),
    ])
  }

  const severityLabel: Record<string, string> = {
    low: 'Nhẹ',
    medium: 'Trung bình',
    high: 'Nghiêm trọng',
    unknown: 'Không rõ',
    none: 'Không phát hiện',
  }

  const severityColor: Record<string, string> = {
    low: 'text-blue-700',
    medium: 'text-amber-700',
    high: 'text-red-700',
    unknown: 'text-gray-700',
    none: 'text-green-700',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-[#2E86AB] to-[#F18F01] rounded-2xl">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Nhận diện bệnh chó</h1>
            <Sparkles className="w-8 h-8 text-[#F18F01]" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tải ảnh thú cưng để AI tự động phát hiện các dấu hiệu bệnh ngoài da và đường hô hấp.
            Hỗ trợ nhận diện sừng hóa, chảy nước mũi, tổn thương da.
          </p>
        </div>

        {/* Server status */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Trạng thái AI Server:</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  serverStatus === 'online'
                    ? 'bg-green-500 animate-pulse'
                    : serverStatus === 'offline'
                    ? 'bg-red-500'
                    : serverStatus === 'no_model'
                    ? 'bg-amber-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span
                className={`font-medium ${
                  serverStatus === 'online'
                    ? 'text-green-700'
                    : serverStatus === 'offline'
                    ? 'text-red-700'
                    : serverStatus === 'no_model'
                    ? 'text-amber-700'
                    : 'text-yellow-700'
                }`}
              >
                {serverStatus === 'online'
                  ? 'Mô hình đã sẵn sàng'
                  : serverStatus === 'offline'
                  ? 'Offline'
                  : serverStatus === 'no_model'
                  ? 'Chưa train mô hình'
                  : 'Đang kiểm tra...'}
              </span>
              {serverStatus !== 'online' && serverStatus !== 'checking' && (
                <Button variant="outline" size="sm" onClick={checkServerStatus} className="ml-2">
                  Thử lại
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2">
            {serverStatus === 'online' ? (
              <DogDiseaseDetector onPredictionComplete={handlePredictionComplete} conf={0.25} />
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {serverStatus === 'no_model'
                      ? 'Mô hình bệnh chưa được train'
                      : 'AI Server chưa sẵn sàng'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {serverStatus === 'no_model'
                      ? 'Chạy lệnh dưới đây tại folder AI để train mô hình:'
                      : 'Vui lòng khởi động AI Server trước khi sử dụng tính năng này'}
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-sm font-mono text-gray-700 mb-2">cd AI</p>
                    {serverStatus === 'no_model' ? (
                      <p className="text-sm font-mono text-gray-700">py train_disease.py</p>
                    ) : (
                      <p className="text-sm font-mono text-gray-700">python api_server.py</p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#2E86AB]" />
                <h3 className="font-semibold text-gray-900">Cách sử dụng</h3>
              </div>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">1</span>
                  <span>Tải lên ảnh rõ nét vùng nghi ngờ bị bệnh</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">2</span>
                  <span>Nhấn "Phát hiện bệnh" để AI quét hình</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2E86AB] text-white rounded-full flex items-center justify-center font-medium text-xs">3</span>
                  <span>Xem các khung phát hiện và gợi ý xử lý</span>
                </li>
              </ol>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-[#F18F01]" />
                <h3 className="font-semibold text-gray-900">Loại bệnh nhận diện</h3>
              </div>
              <div className="space-y-3">
                {classes.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa kết nối được mô hình.</p>
                )}
                {classes.map((c) => (
                  <div key={c.index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm">{c.name_vi}</p>
                      <span className={`text-xs ${severityColor[c.severity] || 'text-gray-700'}`}>
                        {severityLabel[c.severity] || c.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{c.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            {history.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#C73E1D]" />
                  <h3 className="font-semibold text-gray-900">Lịch sử phân tích</h3>
                </div>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {h.diseases.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500">{h.timestamp}</p>
                        </div>
                        <span className={`text-xs font-medium ${severityColor[h.severity] || 'text-gray-700'}`}>
                          {severityLabel[h.severity] || h.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Warning */}
        <Card className="mt-8 bg-gradient-to-r from-amber-50 to-red-50 border-amber-200">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Lưu ý quan trọng</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Kết quả AI chỉ mang tính tham khảo, không thay thế chẩn đoán của bác sĩ thú y</li>
                <li>• Ảnh nên chụp gần, đủ sáng, tập trung vào vùng nghi bị bệnh</li>
                <li>• Trường hợp có dấu hiệu nghiêm trọng, hãy đưa thú cưng đến phòng khám ngay</li>
                <li>• Mô hình hiện hỗ trợ 3 loại tổn thương: sừng hóa, chảy nước mũi, tổn thương da</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Suggested vet services */}
        {suggestedServices.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-[#2E86AB]" />
                <h3 className="text-xl font-semibold text-gray-900">Dịch vụ khám phù hợp</h3>
              </div>
              <Link to="/services" className="flex items-center gap-1 text-[#2E86AB] hover:underline">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {suggestedServices.map((service: any) => (
                <Card key={service.id} padding="none" hover className="overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-[#2E86AB]/10 to-[#F18F01]/10 flex items-center justify-center">
                    {service.images?.[0]?.imageUrl ? (
                      <img src={service.images[0].imageUrl} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope className="w-12 h-12 text-[#2E86AB]/50" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{service.name}</h4>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#2E86AB] font-bold">
                        {service.price ? formatVND(service.price) : 'Liên hệ'}
                      </span>
                      <Link to={`/booking?service=${service.id}`}>
                        <Button size="sm" variant="outline">
                          <Calendar className="w-4 h-4 mr-1" /> Đặt lịch
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DogDiseaseDetection
