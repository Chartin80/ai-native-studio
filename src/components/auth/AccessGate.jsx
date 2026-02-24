/**
 * AccessGate - Simple access code protection
 */

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE
const STORAGE_KEY = 'ai-native-studio-access'

export function AccessGate({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Check if already authorized
  useEffect(() => {
    // If no access code is configured, allow access
    if (!ACCESS_CODE) {
      setIsAuthorized(true)
      setChecking(false)
      return
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === ACCESS_CODE) {
      setIsAuthorized(true)
    }
    setChecking(false)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (code === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, code)
      setIsAuthorized(true)
    } else {
      setError('Invalid access code')
      setCode('')
    }
  }

  // Still checking localStorage
  if (checking) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Authorized - render app
  if (isAuthorized) {
    return children
  }

  // Show access code form
  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-studio-surface border border-studio-border rounded-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-accent-primary" />
            </div>
            <h1 className="text-xl font-bold text-white">AI Native Studio</h1>
            <p className="text-sm text-white/50 mt-1">Enter access code to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-medium rounded-lg transition-colors"
            >
              Enter
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          Contact the administrator for access
        </p>
      </div>
    </div>
  )
}
