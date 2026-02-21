import { useState, useCallback, useRef } from 'react'

export function SplitView({
  left,
  right,
  defaultLeftWidth = 400,
  minLeftWidth = 200,
  maxLeftWidth = 600,
  className = '',
}) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left

      if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
        setLeftWidth(newWidth)
      }
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`flex h-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left panel */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: leftWidth }}
      >
        {left}
      </div>

      {/* Resize handle */}
      <div
        className={`
          w-1 flex-shrink-0 cursor-col-resize
          bg-studio-border hover:bg-accent-primary/50
          transition-colors duration-200
          ${isDragging ? 'bg-accent-primary' : ''}
        `}
        onMouseDown={handleMouseDown}
      />

      {/* Right panel */}
      <div className="flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  )
}
