import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        {icon ? (
          <div className="text-4xl text-gray-400">
            {icon}
          </div>
        ) : (
          <svg 
            className="w-12 h-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

export function EmptyAppointments() {
  return (
    <EmptyState
      icon="📅"
      title="Chưa có lịch hẹn nào"
      description="Bạn chưa có lịch hẹn nào. Hãy đặt lịch chăm sóc cho thú cưng của bạn!"
      action={{
        label: 'Đặt lịch ngay',
        onClick: () => {
          // Navigate to booking page
        }
      }}
    />
  )
}

export function EmptyProducts() {
  return (
    <EmptyState
      icon="🛍️"
      title="Không tìm thấy sản phẩm nào"
      description="Hiện tại không có sản phẩm nào phù hợp với tìm kiếm của bạn."
    />
  )
}

export function EmptyServices() {
  return (
    <EmptyState
      icon="🐾"
      title="Không có dịch vụ nào"
      description="Hiện tại chưa có dịch vụ nào được cung cấp."
    />
  )
}

export function EmptyPets() {
  return (
    <EmptyState
      icon="🐕"
      title="Chưa có thú cưng nào"
      description="Hãy thêm thông tin thú cưng của bạn để có thể đặt lịch chăm sóc."
      action={{
        label: 'Thêm thú cưng',
        onClick: () => {
          // Navigate to add pet page
        }
      }}
    />
  )
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon="📦"
      title="Chưa có đơn hàng nào"
      description="Bạn chưa có đơn hàng nào. Hãy mua sắm các sản phẩm tuyệt vời cho thú cưng!"
      action={{
        label: 'Mua sắm ngay',
        onClick: () => {
          // Navigate to shop page
        }
      }}
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="Không có thông báo mới"
      description="Tất cả thông báo đã được xem hết."
    />
  )
}

export function EmptyReviews() {
  return (
    <EmptyState
      icon="⭐"
      title="Chưa có đánh giá nào"
      description="Hãy là người đầu tiên đánh giá sản phẩm/dịch vụ này!"
    />
  )
}

export function EmptyCart() {
  return (
    <EmptyState
      icon="🛒"
      title="Giỏ hàng trống"
      description="Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm."
      action={{
        label: 'Tiếp tục mua sắm',
        onClick: () => {
          // Navigate to shop page
        }
      }}
    />
  )
}

export function EmptyWishlist() {
  return (
    <EmptyState
      icon="💝"
      title="Danh sách yêu thích trống"
      description="Hãy thêm các sản phẩm yêu thích vào danh sách của bạn."
    />
  )
}