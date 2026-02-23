import { Calendar, Trophy, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/common'
import type { Contest } from '@/types'
import { format, differenceInDays, isPast, isFuture } from 'date-fns'
import { vi } from 'date-fns/locale'

interface ContestCardProps {
  contest: Contest
  onViewDetails: (contestId: string) => void
  onJoin?: (contestId: string) => void
}

export const ContestCard = ({
  contest,
  onViewDetails,
  onJoin
}: ContestCardProps) => {
  const startDate = new Date(contest.startDate)
  const endDate = new Date(contest.endDate)
  const now = new Date()

  const getContestStatus = () => {
    if (isPast(endDate)) {
      return {
        label: 'Đã kết thúc',
        color: 'bg-gray-100 text-gray-700',
        status: 'ended' as const
      }
    }
    if (isFuture(startDate)) {
      const daysUntilStart = differenceInDays(startDate, now)
      return {
        label: `Sắp diễn ra (${daysUntilStart} ngày)`,
        color: 'bg-blue-100 text-blue-700',
        status: 'upcoming' as const
      }
    }
    const daysRemaining = differenceInDays(endDate, now)
    return {
      label: `Đang diễn ra (còn ${daysRemaining} ngày)`,
      color: 'bg-green-100 text-green-700',
      status: 'active' as const
    }
  }

  const status = getContestStatus()
  const entriesCount = contest.entries?.length || 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Contest Image */}
      <div className="relative aspect-video bg-gradient-to-br from-[#2E86AB] to-[#F18F01] overflow-hidden">
        {contest.imageUrl ? (
          <img
            src={contest.imageUrl}
            alt={contest.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${status.color} backdrop-blur-sm`}>
            {status.label}
          </span>
        </div>

        {/* Prize Badge */}
        {contest.prizes && (
          <div className="absolute bottom-3 left-3 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
            <Trophy className="w-4 h-4" />
            Giải thưởng hấp dẫn
          </div>
        )}
      </div>

      {/* Contest Info */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#2E86AB] transition-colors">
          {contest.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {contest.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{entriesCount} tham gia</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {format(startDate, 'dd/MM', { locale: vi })} - {format(endDate, 'dd/MM', { locale: vi })}
            </span>
          </div>
        </div>

        {/* Date Details */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bắt đầu:</span>
            <span className="font-medium text-gray-900">
              {format(startDate, 'dd/MM/yyyy HH:mm', { locale: vi })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Kết thúc:</span>
            <span className="font-medium text-gray-900">
              {format(endDate, 'dd/MM/yyyy HH:mm', { locale: vi })}
            </span>
          </div>
        </div>

        {/* Prizes */}
        {contest.prizes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Giải thưởng
            </h4>
            <p className="text-amber-800 text-sm line-clamp-2">
              {contest.prizes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onViewDetails(contest.id)}
            className="flex-1"
          >
            Xem chi tiết
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {status.status === 'active' && onJoin && (
            <Button
              onClick={() => onJoin(contest.id)}
              className="flex-1 bg-gradient-to-r from-[#2E86AB] to-[#F18F01] hover:opacity-90"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Tham gia
            </Button>
          )}

          {status.status === 'upcoming' && (
            <Button
              disabled
              className="flex-1"
            >
              Sắp diễn ra
            </Button>
          )}

          {status.status === 'ended' && (
            <Button
              variant="outline"
              onClick={() => onViewDetails(contest.id)}
              className="flex-1"
            >
              Xem kết quả
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContestCard
