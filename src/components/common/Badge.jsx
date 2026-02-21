const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  default: 'bg-white/10 text-white/70',
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
