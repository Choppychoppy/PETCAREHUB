import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
  onClick?: () => void
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
}

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  size = 'md', 
  fallback,
  className,
  onClick 
}: AvatarProps) {
  const initials = fallback || alt?.slice(0, 2).toUpperCase() || '👤'
  
  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 overflow-hidden',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  )
}

interface PetAvatarProps extends Omit<AvatarProps, 'fallback'> {
  petType?: 'dog' | 'cat' | 'bird' | 'fish' | 'hamster' | 'rabbit' | 'reptile'
}

const petEmojis = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  fish: '🐠',
  hamster: '🐹',
  rabbit: '🐰',
  reptile: '🦎'
}

export function PetAvatar({ petType, ...props }: PetAvatarProps) {
  const fallback = petType ? petEmojis[petType] : '🐾'
  
  return (
    <Avatar 
      {...props} 
      fallback={fallback}
      className={cn('bg-gradient-to-br from-orange-100 to-pink-100', props.className)}
    />
  )
}