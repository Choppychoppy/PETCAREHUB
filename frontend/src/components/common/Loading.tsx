import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

export default function Loading({ size = 'md', className, text }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <div 
        className={cn(
          'border-2 border-[#2E86AB] border-t-transparent rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
      {text && (
        <span className="text-gray-600 text-sm">{text}</span>
      )}
    </div>
  )
}

export function PetLoading({ size = 'md', className, text }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-8', className)}>
      <div className="relative">
        <div className="animate-bounce text-4xl">🐾</div>
      </div>
      {text && (
        <div className="text-gray-600 text-sm text-center max-w-xs">
          {text}
        </div>
      )}
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  className?: string
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]'
}

const spinnerColors = {
  primary: 'border-[#2E86AB] border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-300 border-t-transparent'
}

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <div 
      className={cn(
        'rounded-full animate-spin',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
    />
  )
}

interface LoadingScreenProps {
  title?: string
  subtitle?: string
  className?: string
}

export function LoadingScreen({ 
  title = 'Đang tải...', 
  subtitle,
  className 
}: LoadingScreenProps) {
  return (
    <div className={cn(
      'min-h-screen flex flex-col items-center justify-center bg-gray-50',
      className
    )}>
      <PetLoading size="xl" />
      <div className="mt-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-600 max-w-md">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}