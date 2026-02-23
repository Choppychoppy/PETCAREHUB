import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    icon: '✅',
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  error: {
    icon: '❌',
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: '⚠️',
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  info: {
    icon: 'ℹ️',
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  }
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const config = toastConfig[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 200)
  }

  return (
    <div
      className={cn(
        'transform transition-all duration-200 ease-out',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        'max-w-md w-full border rounded-lg shadow-lg p-4',
        config.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-xl">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <div className={cn('font-medium text-sm', config.textColor)}>
              {title}
            </div>
          )}
          <div className={cn('text-sm', config.textColor, title && 'mt-1')}>
            {message}
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 transition-colors',
            config.textColor
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title?: string
    message: string
    duration?: number
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  )
}

let toastId = 0

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    const id = String(++toastId)
    const event = new CustomEvent('add-toast', {
      detail: { id, type: 'success', message, title, duration }
    })
    window.dispatchEvent(event)
  },
  
  error: (message: string, title?: string, duration?: number) => {
    const id = String(++toastId)
    const event = new CustomEvent('add-toast', {
      detail: { id, type: 'error', message, title, duration }
    })
    window.dispatchEvent(event)
  },
  
  warning: (message: string, title?: string, duration?: number) => {
    const id = String(++toastId)
    const event = new CustomEvent('add-toast', {
      detail: { id, type: 'warning', message, title, duration }
    })
    window.dispatchEvent(event)
  },
  
  info: (message: string, title?: string, duration?: number) => {
    const id = String(++toastId)
    const event = new CustomEvent('add-toast', {
      detail: { id, type: 'info', message, title, duration }
    })
    window.dispatchEvent(event)
  }
}