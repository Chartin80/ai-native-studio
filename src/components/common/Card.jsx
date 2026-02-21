export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      className={`
        ${hover ? 'glass-card-hover cursor-pointer' : 'glass-card'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`panel-header ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`panel-content ${className}`}>
      {children}
    </div>
  )
}
