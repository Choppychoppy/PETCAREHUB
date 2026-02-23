import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

const roundedClasses = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl'
}

export default function Card({ 
  children, 
  className, 
  hover = false,
  padding = 'md',
  rounded = 'lg'
}: CardProps) {
  return (
    <div 
      className={cn(
        'bg-white shadow-sm border border-gray-200',
        paddingClasses[padding],
        roundedClasses[rounded],
        hover && 'hover:shadow-md hover:-translate-y-1 transform transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-gray-200 pb-4 mb-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('border-t border-gray-200 pt-4 mt-4', className)}>
      {children}
    </div>
  )
}

interface ProductCardProps {
  image?: string
  title: string
  price?: number
  originalPrice?: number
  rating?: number
  reviews?: number
  badge?: string
  onAddToCart?: () => void
  onClick?: () => void
  className?: string
}

export function ProductCard({
  image,
  title,
  price,
  originalPrice,
  rating,
  reviews,
  badge,
  onAddToCart,
  onClick,
  className
}: ProductCardProps) {
  return (
    <Card 
      hover 
      padding="none" 
      rounded="xl" 
      className={cn('overflow-hidden group', className)}
      onClick={onClick}
    >
      <div className="relative">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-4xl">🐾</div>
          </div>
        )}
        {badge && (
          <div className="absolute top-2 left-2 bg-[#F18F01] text-white px-2 py-1 rounded-full text-xs font-medium">
            {badge}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-[#2E86AB] transition-colors">
          {title}
        </h3>
        
        {(rating || reviews) && (
          <div className="flex items-center gap-2 text-sm">
            {rating && (
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">({reviews || 0})</span>
              </div>
            )}
          </div>
        )}
        
        {price && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#2E86AB]">
              {price.toLocaleString()}đ
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                {originalPrice.toLocaleString()}đ
              </span>
            )}
          </div>
        )}
        
        {onAddToCart && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart()
            }}
            className="w-full mt-3 bg-[#2E86AB] hover:bg-[#2574A3] text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Thêm vào giỏ
          </button>
        )}
      </div>
    </Card>
  )
}

interface ServiceCardProps {
  icon?: ReactNode
  title: string
  description?: string
  price?: number
  duration?: string
  petTypes?: string[]
  onBook?: () => void
  onClick?: () => void
  className?: string
}

export function ServiceCard({
  icon,
  title,
  description,
  price,
  duration,
  petTypes,
  onBook,
  onClick,
  className
}: ServiceCardProps) {
  return (
    <Card 
      hover 
      padding="md" 
      rounded="xl" 
      className={cn('bg-gradient-to-br from-pink-50 to-white border-pink-100', className)}
      onClick={onClick}
    >
      <div className="text-center space-y-4">
        {icon && (
          <div className="flex justify-center text-4xl text-[#F18F01]">
            {icon}
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          {price && (
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium">Giá:</span>
              <span className="text-lg font-bold text-[#2E86AB]">
                {price.toLocaleString()}đ
              </span>
            </div>
          )}
          
          {duration && (
            <div className="flex items-center justify-center gap-2">
              <span>⏱️ {duration}</span>
            </div>
          )}
          
          {petTypes && petTypes.length > 0 && (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span>Phù hợp:</span>
              {petTypes.map((type, index) => (
                <span key={type} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {onBook && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBook()
            }}
            className="w-full bg-[#F18F01] hover:bg-[#E8810A] text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Đặt lịch ngay
          </button>
        )}
      </div>
    </Card>
  )
}