import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Folder, Clock, Trash2, MoreVertical } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { Button, Card, EmptyState, Modal, Input, Spinner } from '../common'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading, loadProjects, createProject, deleteProject } =
    useProjectStore()
  const { addNotification } = useUIStore()
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const project = await createProject(newProjectName.trim())
      setShowNewProject(false)
      setNewProjectName('')
      navigate(`/project/${project.id}/script`)
      addNotification({
        type: 'success',
        message: `Project "${project.name}" created`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to create project: ${error.message}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (id, name) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return

    try {
      await deleteProject(id)
      addNotification({
        type: 'success',
        message: `Project "${name}" deleted`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to delete project: ${error.message}`,
      })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              AI Native Studio
            </h1>
            <p className="text-white/60">
              Cinematic AI pipeline for filmmakers
            </p>
          </div>
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No projects yet"
            description="Create your first project to start generating cinematic content"
            action={
              <Button onClick={() => setShowNewProject(true)}>
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            }
            className="py-16"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                hover
                className="group relative"
                onClick={() => navigate(`/project/${project.id}/script`)}
              >
                <div className="p-5">
                  {/* Project thumbnail placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                    <Folder className="w-12 h-12 text-white/20" />
                  </div>

                  {/* Project info */}
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-accent-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(project.updatedAt)}
                    </span>
                    <span>
                      {project.scenes?.length || 0} scenes
                    </span>
                  </div>
                </div>

                {/* Actions menu */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(menuOpen === project.id ? null : project.id)
                    }}
                    className="p-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === project.id && (
                    <div
                      className="absolute right-0 mt-1 py-1 w-40 bg-studio-surface border border-studio-border rounded-lg shadow-glass z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          handleDeleteProject(project.id, project.name)
                          setMenuOpen(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-accent-error hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* New project modal */}
        <Modal
          isOpen={showNewProject}
          onClose={() => setShowNewProject(false)}
          title="Create New Project"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Project Name"
              placeholder="My Film Project"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject()
              }}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                loading={isCreating}
                disabled={!newProjectName.trim()}
              >
                Create Project
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
