export function Panel({ children, className = '' }) {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, actions, className = '' }) {
  return (
    <div className={`panel-header ${className}`}>
      <h3 className="font-medium text-white">{title}</h3>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PanelContent({ children, className = '' }) {
  return (
    <div className={`panel-content ${className}`}>
      {children}
    </div>
  )
}
