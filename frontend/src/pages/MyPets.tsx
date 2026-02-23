import { useState, useEffect } from 'react'
import { Button, Card, Modal, Input, Loading, EmptyState } from '@/components/common'
import { userService } from '@/services'
import { uploadToCloudinary } from '@/utils/cloudinary'
import type { Pet } from '@/types'
import {
  Plus,
  Edit,
  Trash2,
  PawPrint,
  Calendar,
  Scale,
  FileText,
  Upload,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const speciesOptions = [
  { value: 'dog', label: 'Chó' },
  { value: 'cat', label: 'Mèo' },
  { value: 'bird', label: 'Chim' },
  { value: 'fish', label: 'Cá' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'rabbit', label: 'Thỏ' },
  { value: 'other', label: 'Khác' }
]

const MyPets = () => {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    age: 0,
    weight: 0,
    photoUrl: '',
    medicalNotes: ''
  })

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    try {
      setLoading(true)
      const response = await userService.getPets()
      setPets(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Failed to fetch pets:', error)
      setPets([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      species: 'dog',
      breed: '',
      age: 0,
      weight: 0,
      photoUrl: '',
      medicalNotes: ''
    })
    setSelectedPet(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (pet: Pet) => {
    setSelectedPet(pet)
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      age: pet.age || 0,
      weight: pet.weight || 0,
      photoUrl: pet.photoUrl || '',
      medicalNotes: pet.medicalNotes || ''
    })
    setShowModal(true)
  }

  const handleDelete = (pet: Pet) => {
    setSelectedPet(pet)
    setShowDeleteModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadToCloudinary(file, 'pets')
      setFormData(prev => ({ ...prev, photoUrl: result.secure_url }))
      toast.success('Tải ảnh thành công!')
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên thú cưng')
      return
    }

    const toastId = toast.loading(selectedPet ? 'Đang cập nhật...' : 'Đang thêm mới...')

    try {
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || undefined,
        age: formData.age || undefined,
        weight: formData.weight || undefined,
        photoUrl: formData.photoUrl || undefined,
        medicalNotes: formData.medicalNotes || undefined
      }

      if (selectedPet) {
        await userService.updatePet(selectedPet.id, petData)
        toast.success('Cập nhật thành công!', { id: toastId })
      } else {
        await userService.createPet(petData)
        toast.success('Thêm thú cưng thành công!', { id: toastId })
      }

      setShowModal(false)
      resetForm()
      fetchPets()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!', { id: toastId })
    }
  }

  const confirmDelete = async () => {
    if (!selectedPet) return

    const toastId = toast.loading('Đang xóa...')
    try {
      await userService.deletePet(selectedPet.id)
      toast.success('Xóa thành công!', { id: toastId })
      setShowDeleteModal(false)
      setSelectedPet(null)
      fetchPets()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra!', { id: toastId })
    }
  }

  const getSpeciesLabel = (species: string) => {
    return speciesOptions.find(s => s.value === species)?.label || species
  }

  const getSpeciesEmoji = (species: string) => {
    const emojis: Record<string, string> = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      fish: '🐟',
      hamster: '🐹',
      rabbit: '🐰',
      other: '🐾'
    }
    return emojis[species] || '🐾'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thú cưng của tôi</h1>
              <p className="text-gray-600">Quản lý thông tin thú cưng của bạn</p>
            </div>
            <Button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-5 h-5 mr-2" />
              Thêm thú cưng
            </Button>
          </div>
        </Card>

        {/* Pets Grid */}
        {pets.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<PawPrint className="w-16 h-16 text-gray-300" />}
              title="Chưa có thú cưng"
              description="Bạn chưa thêm thú cưng nào. Hãy thêm thú cưng để quản lý thông tin và đặt lịch dịch vụ."
              action={
                <Button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm thú cưng đầu tiên
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Pet Image */}
                <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 relative">
                  {pet.photoUrl ? (
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">{getSpeciesEmoji(pet.species)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(pet)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(pet)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Pet Info */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-500">
                        {getSpeciesLabel(pet.species)} {pet.breed && `• ${pet.breed}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {pet.age && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{pet.age} tuổi</span>
                      </div>
                    )}
                    {pet.weight && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Scale className="w-4 h-4" />
                        <span>{pet.weight} kg</span>
                      </div>
                    )}
                  </div>

                  {pet.medicalNotes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4 mt-0.5" />
                        <p className="line-clamp-2">{pet.medicalNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedPet ? 'Chỉnh sửa thú cưng' : 'Thêm thú cưng mới'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Pet" className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="pet-photo"
                    disabled={uploading}
                  />
                  <label htmlFor="pet-photo" className="cursor-pointer">
                    <span className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm transition-all duration-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? (
                        <Loading size="sm" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Tải ảnh lên
                        </>
                      )}
                    </span>
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                      className="ml-2 text-red-500 text-sm hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên thú cưng *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Milu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loài *</label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData(prev => ({ ...prev, species: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {speciesOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giống</label>
              <Input
                value={formData.breed}
                onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                placeholder="VD: Corgi, Poodle, Maine Coon..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tuổi (năm)</label>
                <Input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cân nặng (kg)</label>
                <Input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú y tế</label>
              <textarea
                value={formData.medicalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalNotes: e.target.value }))}
                placeholder="Tiền sử bệnh, dị ứng, ghi chú đặc biệt..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                {selectedPet ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Xác nhận xóa"
          size="sm"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa <strong>{selectedPet?.name}</strong>?
              <br />
              <span className="text-sm">Hành động này không thể hoàn tác.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                Xóa
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default MyPets
