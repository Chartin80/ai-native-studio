import { forwardRef } from 'react'

export const Input = forwardRef(
  ({ label, error, className = '', variant = 'base', ...props }, ref) => {
    const inputClass = variant === 'dark' ? 'input-dark' : 'input-base'

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <input ref={ref} className={`${inputClass} ${className}`} {...props} />
        {error && <p className="text-sm text-accent-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export const Textarea = forwardRef(
  ({ label, error, className = '', variant = 'base', rows = 4, ...props }, ref) => {
    const inputClass = variant === 'dark' ? 'input-dark' : 'input-base'

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`${inputClass} resize-none ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-accent-error">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
