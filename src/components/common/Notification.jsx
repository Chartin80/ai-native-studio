import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useUIStore } from '@/lib/store'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'border-accent-success/30 bg-accent-success/10',
  error: 'border-accent-error/30 bg-accent-error/10',
  warning: 'border-accent-warning/30 bg-accent-warning/10',
  info: 'border-accent-primary/30 bg-accent-primary/10',
}

const iconColors = {
  success: 'text-accent-success',
  error: 'text-accent-error',
  warning: 'text-accent-warning',
  info: 'text-accent-primary',
}

function NotificationItem({ notification }) {
  const removeNotification = useUIStore((s) => s.removeNotification)
  const Icon = icons[notification.type] || icons.info

  return (
    <div
      className={`
        flex items-start gap-3 p-4
        border rounded-xl shadow-glass
        animate-slide-in-right
        ${colors[notification.type] || colors.info}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[notification.type]}`} />
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="font-medium text-white">{notification.title}</p>
        )}
        <p className="text-sm text-white/70">{notification.message}</p>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function NotificationContainer() {
  const notifications = useUIStore((s) => s.notifications)

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
