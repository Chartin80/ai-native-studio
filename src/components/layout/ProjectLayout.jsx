import { useEffect } from 'react'
import { Outlet, useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  List,
  Image,
  Video,
  Mic2,
  Layers,
  Box,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { Spinner } from '../common'

const navItems = [
  { path: 'script', icon: FileText, label: 'Script' },
  { path: 'shots', icon: List, label: 'Shots' },
  { path: 'visuals', icon: Image, label: 'Visuals' },
  { path: 'video', icon: Video, label: 'Video' },
  { path: 'voice', icon: Mic2, label: 'Voice' },
  { path: 'camera', icon: Box, label: 'Camera 3D' },
  { path: 'assembly', icon: Layers, label: 'Assembly' },
]

export function ProjectLayout() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentProject, loading, error, loadProject, clearCurrentProject } =
    useProjectStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  useEffect(() => {
    if (id && (!currentProject || currentProject.id !== id)) {
      loadProject(id)
    }

    return () => {
      clearCurrentProject()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-accent-error">{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const currentPath = location.pathname.split('/').pop()

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`
          flex flex-col border-r border-studio-border bg-studio-surface/50
          transition-all duration-300
          ${sidebarOpen ? 'w-56' : 'w-14'}
        `}
      >
        {/* Nav items */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path

            return (
              <Link
                key={item.path}
                to={`/project/${id}/${item.path}`}
                className={`
                  flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-12 border-t border-studio-border hover:bg-white/5 text-white/40 hover:text-white transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
