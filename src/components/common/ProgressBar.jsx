export function ProgressBar({ value = 0, max = 100, indeterminate = false, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className={`
          h-full bg-gradient-to-r from-accent-primary to-accent-secondary
          ${indeterminate ? 'animate-progress-indeterminate w-1/3' : 'transition-all duration-300'}
        `}
        style={indeterminate ? {} : { width: `${percentage}%` }}
      />
    </div>
  )
}
