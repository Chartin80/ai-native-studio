export function ProgressBar({ value = 0, max = 100, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
