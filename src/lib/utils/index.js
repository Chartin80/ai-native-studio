/**
 * Utility functions
 */

/**
 * Generate a unique ID
 */
export function generateId() {
  return crypto.randomUUID()
}

/**
 * Format a date for display
 */
export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date relative to now
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return formatDate(dateString)
  } else if (days > 0) {
    return days === 1 ? 'Yesterday' : `${days} days ago`
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  } else {
    return 'Just now'
  }
}

/**
 * Format seconds as timecode
 */
export function formatTimecode(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Delay for specified milliseconds
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Convert file to base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Debounce a function
 */
export function debounce(fn, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(this, args), wait)
  }
}

/**
 * Throttle a function
 */
export function throttle(fn, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Classify a string by common patterns
 */
export function classifyContent(text) {
  const patterns = {
    sceneHeading: /^(INT\.|EXT\.|INT\/EXT\.)/i,
    character: /^[A-Z][A-Z\s]+$/,
    dialogue: /^\([^)]+\)$|^.{1,200}$/,
    action: /.{50,}/,
  }

  if (patterns.sceneHeading.test(text.trim())) return 'scene'
  if (patterns.character.test(text.trim())) return 'character'
  return 'action'
}
