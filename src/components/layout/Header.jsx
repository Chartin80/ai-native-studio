import { Link, useLocation, useParams } from 'react-router-dom'
import { Settings, Home, ChevronRight } from 'lucide-react'
import { useProjectStore } from '@/lib/store'

export function Header() {
  const location = useLocation()
  const params = useParams()
  const currentProject = useProjectStore((s) => s.currentProject)

  const isProjectPage = location.pathname.startsWith('/project/')
  const currentPage = location.pathname.split('/').pop()

  const pageNames = {
    script: 'Script',
    shots: 'Shots',
    visuals: 'Visuals',
    video: 'Video',
    voice: 'Voice',
    assembly: 'Assembly',
    settings: 'Settings',
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-studio-border bg-studio-surface/50 backdrop-blur-sm">
      {/* Left: Logo and breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <span className="text-sm font-bold">AI</span>
          </div>
          <span className="font-semibold hidden sm:inline">Native Studio</span>
        </Link>

        {/* Breadcrumbs for project pages */}
        {isProjectPage && currentProject && (
          <div className="flex items-center gap-2 text-sm">
            <ChevronRight className="w-4 h-4 text-white/30" />
            <Link
              to={`/project/${params.id}`}
              className="text-white/60 hover:text-white transition-colors"
            >
              {currentProject.name}
            </Link>
            {pageNames[currentPage] && (
              <>
                <ChevronRight className="w-4 h-4 text-white/30" />
                <span className="text-white">{pageNames[currentPage]}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-2">
        <Link to="/" className="btn-icon">
          <Home className="w-5 h-5" />
        </Link>
        <Link to="/settings" className="btn-icon">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  )
}
