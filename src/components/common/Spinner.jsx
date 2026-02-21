import { Loader2 } from 'lucide-react'

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

export function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2 className={`animate-spin ${sizes[size]} ${className}`} />
  )
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-white/70">{message}</p>
      </div>
    </div>
  )
}
