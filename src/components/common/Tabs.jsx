import { createContext, useContext, useState } from 'react'

const TabsContext = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, children, className = '' }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue
  const handleChange = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return (
    <div className={`flex gap-1 p-1 bg-white/5 rounded-lg ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = '' }) {
  const context = useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      onClick={() => context.onChange(value)}
      className={`
        px-4 py-2 text-sm font-medium rounded-md transition-all
        ${isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white hover:bg-white/5'}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const context = useContext(TabsContext)

  if (context.value !== value) return null

  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}
