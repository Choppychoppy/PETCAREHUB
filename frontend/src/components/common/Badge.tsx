import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'health' | 'need-care'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  rounded?: boolean
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  health: 'bg-green-500 text-white',
  'need-care': 'bg-yellow-400 text-black'
}

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  rounded = true,
  className 
}: BadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium whitespace-nowrap',
        badgeVariants[variant],
        badgeSizes[size],
        rounded ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'processing' | 'shipped' | 'delivered'
  className?: string
}

const statusConfig = {
  pending: { variant: 'warning' as const, label: 'Chờ xử lý' },
  confirmed: { variant: 'info' as const, label: 'Đã xác nhận' },
  'in-progress': { variant: 'info' as const, label: 'Đang thực hiện' },
  completed: { variant: 'success' as const, label: 'Hoàn thành' },
  cancelled: { variant: 'danger' as const, label: 'Đã hủy' },
  processing: { variant: 'warning' as const, label: 'Đang xử lý' },
  shipped: { variant: 'info' as const, label: 'Đang giao' },
  delivered: { variant: 'success' as const, label: 'Đã giao' }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}

interface OrderStatusBadgeProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />
}

interface AppointmentStatusBadgeProps {
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  className?: string
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />
}

interface PetHealthBadgeProps {
  status: 'healthy' | 'need-care' | 'sick'
  className?: string
}

export function PetHealthBadge({ status, className }: PetHealthBadgeProps) {
  const config = {
    healthy: { variant: 'health' as const, label: 'Khỏe mạnh' },
    'need-care': { variant: 'need-care' as const, label: 'Cần khám' },
    sick: { variant: 'danger' as const, label: 'Đang bệnh' }
  }
  
  const statusConfig = config[status]
  
  return (
    <Badge 
      variant={statusConfig.variant} 
      className={cn('rounded-full', className)}
    >
      {statusConfig.label}
    </Badge>
  )
}