import { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export const Select = forwardRef(
  ({ label, options = [], value, onChange, placeholder = 'Select...', className = '' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef(null)

    const selectedOption = options.find((opt) => opt.value === value)

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div className="space-y-1.5" ref={selectRef}>
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            ref={ref}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between
              bg-white/5 border border-studio-border rounded-lg px-4 py-2.5
              text-left text-white
              hover:bg-white/10 transition-colors
              focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/50
              ${className}
            `}
          >
            <span className={selectedOption ? 'text-white' : 'text-white/40'}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/40 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 py-1 bg-studio-surface border border-studio-border rounded-lg shadow-glass animate-fade-in">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-2
                    text-left hover:bg-white/5 transition-colors
                    ${option.value === value ? 'text-accent-primary' : 'text-white'}
                  `}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-white/40">{option.description}</div>
                    )}
                  </div>
                  {option.value === value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'
