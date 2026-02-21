export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-white/30" />
        </div>
      )}
      <h3 className="text-lg font-medium text-white/80 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-white/50 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
