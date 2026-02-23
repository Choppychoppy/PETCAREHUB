import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  required,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200',
          'placeholder:text-gray-400 text-gray-900 font-medium',
          'bg-white/80 backdrop-blur-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20 focus:border-[#2E86AB] focus:shadow-md focus:bg-white',
          'hover:border-gray-300 hover:shadow-sm',
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/50' 
            : 'border-gray-200',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input