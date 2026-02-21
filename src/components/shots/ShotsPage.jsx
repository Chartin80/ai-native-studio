import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Grid, Plus, Camera, Image, Video, Mic2 } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { Button, EmptyState, Badge, Card } from '../common'
import { Panel, PanelHeader, PanelContent } from '../layout'

export function ShotsPage() {
  const navigate = useNavigate()
  const { currentProject, addScene, addShot } = useProjectStore()
  const { viewMode, setViewMode } = useUIStore()
  const [selectedShot, setSelectedShot] = useState(null)

  // Flatten all shots from all scenes
  const allShots = useMemo(() => {
    if (!currentProject?.scenes) return []
    return currentProject.scenes.flatMap((scene) =>
      (scene.shots || []).map((shot) => ({
        ...shot,
        scene,
      }))
    )
  }, [currentProject?.scenes])

  const handleAddScene = async () => {
    const scene = await addScene()
    await addShot(scene.id)
  }

  const handleGoToVisuals = (shot) => {
    navigate(`/project/${currentProject.id}/visuals?shot=${shot.id}`)
  }

  if (allShots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Camera}
          title="No shots yet"
          description="Add scenes and shots to your project to start generating visuals"
          action={
            <Button onClick={handleAddScene}>
              <Plus className="w-4 h-4" />
              Add Scene with Shot
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Panel className="flex-1 flex flex-col border-0 rounded-none">
        <PanelHeader
          title={`All Shots (${allShots.length})`}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex border border-studio-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          }
        />

        <PanelContent className="flex-1 overflow-auto">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allShots.map((shot) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  onClick={() => handleGoToVisuals(shot)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {allShots.map((shot) => (
                <ShotListItem
                  key={shot.id}
                  shot={shot}
                  onClick={() => handleGoToVisuals(shot)}
                />
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>
    </div>
  )
}

function ShotCard({ shot, onClick }) {
  const hasKeyframes = shot.keyframes?.length > 0
  const hasVideo = shot.videoTakes?.length > 0
  const hasAudio = shot.audioTakes?.length > 0

  return (
    <Card hover onClick={onClick} className="overflow-hidden">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/10 relative">
        {hasKeyframes ? (
          <img
            src={shot.keyframes[0].url || shot.keyframes[0].outputs?.[0]}
            alt="Keyframe"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex gap-1">
          {hasKeyframes && (
            <span className="p-1 bg-black/50 rounded">
              <Image className="w-3 h-3 text-accent-primary" />
            </span>
          )}
          {hasVideo && (
            <span className="p-1 bg-black/50 rounded">
              <Video className="w-3 h-3 text-accent-success" />
            </span>
          )}
          {hasAudio && (
            <span className="p-1 bg-black/50 rounded">
              <Mic2 className="w-3 h-3 text-accent-warning" />
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/50">
            Scene {shot.scene.sceneNumber} / Shot {shot.shotNumber}
          </span>
          <Badge variant="default" className="text-xs">
            {shot.shotType || 'wide'}
          </Badge>
        </div>
        <p className="text-sm text-white/70 line-clamp-2">
          {shot.description || 'No description'}
        </p>
      </div>
    </Card>
  )
}

function ShotListItem({ shot, onClick }) {
  const hasKeyframes = shot.keyframes?.length > 0
  const hasVideo = shot.videoTakes?.length > 0
  const hasAudio = shot.audioTakes?.length > 0

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-studio-border hover:bg-white/10 cursor-pointer transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-24 h-14 bg-gradient-to-br from-white/5 to-white/10 rounded flex-shrink-0 overflow-hidden">
        {hasKeyframes ? (
          <img
            src={shot.keyframes[0].url || shot.keyframes[0].outputs?.[0]}
            alt="Keyframe"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-white/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            Scene {shot.scene.sceneNumber} / Shot {shot.shotNumber}
          </span>
          <Badge variant="default">{shot.shotType || 'wide'}</Badge>
        </div>
        <p className="text-sm text-white/50 truncate">
          {shot.description || 'No description'}
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className={hasKeyframes ? 'text-accent-primary' : ''}>
            {shot.keyframes?.length || 0} keyframes
          </span>
          <span className={hasVideo ? 'text-accent-success' : ''}>
            {shot.videoTakes?.length || 0} videos
          </span>
          <span className={hasAudio ? 'text-accent-warning' : ''}>
            {shot.audioTakes?.length || 0} audio
          </span>
        </div>
      </div>
    </div>
  )
}
