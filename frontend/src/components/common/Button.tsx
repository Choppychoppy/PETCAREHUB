import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'icon' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const buttonVariants = {
  primary: 'bg-[#2E86AB] hover:bg-[#245a7a] text-white shadow-sm hover:shadow-md border border-[#2E86AB] transition-all duration-200',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200',
  outline: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow transition-all duration-200',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-500 shadow-sm hover:shadow-md transition-all duration-200',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-500 shadow-sm hover:shadow-md transition-all duration-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white border border-red-500 shadow-sm hover:shadow-md transition-all duration-200',
  icon: 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-0 transition-all duration-200'
}

const buttonSizes = {
  sm: 'px-4 py-2 text-sm font-medium',
  md: 'px-6 py-2.5 text-base font-medium',
  lg: 'px-8 py-3 text-base font-semibold'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 focus:outline-none',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}