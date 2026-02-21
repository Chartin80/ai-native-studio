import { useState, useMemo } from 'react'
import { Layers, Download, Play, Pause, SkipBack, SkipForward, Wand2 } from 'lucide-react'
import { useProjectStore, useUIStore, useGenerationStore } from '@/lib/store'
import { Button, EmptyState, ProgressBar, Badge } from '../common'
import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { Timeline } from './Timeline'
import { PreviewPlayer } from './PreviewPlayer'
import { ExportPanel } from './ExportPanel'

export function AssemblyPage() {
  const { currentProject, updateProject } = useProjectStore()
  const { addNotification } = useUIStore()
  const { generateLipsync, activeTasks } = useGenerationStore()

  const [selectedClipIndex, setSelectedClipIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Gather all approved shots with videos
  const availableClips = useMemo(() => {
    if (!currentProject?.scenes) return []

    return currentProject.scenes.flatMap((scene) =>
      (scene.shots || [])
        .filter((shot) => shot.videoTakes?.length > 0 || shot.keyframes?.length > 0)
        .map((shot) => {
          const selectedVideo = shot.selectedVideo
            ? shot.videoTakes?.find((v) => v.id === shot.selectedVideo)
            : shot.videoTakes?.[0]

          const selectedKeyframe = shot.selectedKeyframe
            ? shot.keyframes?.find((k) => k.id === shot.selectedKeyframe)
            : shot.keyframes?.[0]

          const selectedAudio = shot.selectedAudio
            ? shot.audioTakes?.find((a) => a.id === shot.selectedAudio)
            : shot.audioTakes?.[0]

          return {
            id: shot.id,
            sceneNumber: scene.sceneNumber,
            shotNumber: shot.shotNumber,
            shotType: shot.shotType,
            description: shot.description,
            video: selectedVideo,
            keyframe: selectedKeyframe,
            audio: selectedAudio,
            duration: selectedVideo?.settings?.duration || 5,
            hasLipsync: !!shot.lipsyncVideo,
          }
        })
    )
  }, [currentProject?.scenes])

  // Timeline clips - use assembly timeline or default to available clips
  const timelineClips = useMemo(() => {
    if (currentProject?.assembly?.timeline?.length > 0) {
      return currentProject.assembly.timeline
        .map((id) => availableClips.find((c) => c.id === id))
        .filter(Boolean)
    }
    return availableClips
  }, [currentProject?.assembly?.timeline, availableClips])

  const currentLipsyncTask = activeTasks.find((t) => t.type === 'lipsync')

  const handleGenerateLipsync = async (clip) => {
    if (!clip.video || !clip.audio) {
      addNotification({
        type: 'warning',
        message: 'Need both video and audio to generate lipsync',
      })
      return
    }

    try {
      const result = await generateLipsync({
        projectId: currentProject.id,
        shotId: clip.id,
        modelId: 'longcat',
        videoUrl: clip.video.url || clip.video.outputs?.[0],
        audioUrl: clip.audio.url || clip.audio.outputs?.[0],
      })

      addNotification({
        type: 'success',
        message: 'Lipsync generated successfully',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Lipsync failed: ${error.message}`,
      })
    }
  }

  const handleReorderClips = async (newOrder) => {
    await updateProject({
      assembly: {
        ...currentProject.assembly,
        timeline: newOrder.map((c) => c.id),
      },
    })
  }

  const totalDuration = timelineClips.reduce((sum, clip) => sum + (clip.duration || 5), 0)

  if (availableClips.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Layers}
          title="No clips to assemble"
          description="Generate keyframes and videos for your shots first, then come back here to assemble them"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview area */}
        <div className="flex-1 flex flex-col">
          <PreviewPlayer
            clips={timelineClips}
            currentIndex={selectedClipIndex}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSelectClip={setSelectedClipIndex}
          />
        </div>

        {/* Right panel - clip details */}
        <div className="w-80 border-l border-studio-border flex flex-col">
          <Panel className="flex-1 flex flex-col border-0 rounded-none">
            <PanelHeader title="Clip Details" />
            <PanelContent className="flex-1 overflow-auto">
              {selectedClipIndex !== null && timelineClips[selectedClipIndex] ? (
                <ClipDetails
                  clip={timelineClips[selectedClipIndex]}
                  onGenerateLipsync={handleGenerateLipsync}
                  isGenerating={!!currentLipsyncTask}
                />
              ) : (
                <div className="text-center text-white/40 py-8">
                  Select a clip from the timeline
                </div>
              )}
            </PanelContent>
          </Panel>
        </div>
      </div>

      {/* Timeline */}
      <div className="border-t border-studio-border">
        <div className="flex items-center justify-between px-4 py-2 border-b border-studio-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedClipIndex(Math.max(0, (selectedClipIndex || 0) - 1))}
                className="btn-icon"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() =>
                  setSelectedClipIndex(
                    Math.min(timelineClips.length - 1, (selectedClipIndex || 0) + 1)
                  )
                }
                className="btn-icon"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-white/50">
              {timelineClips.length} clips • {totalDuration}s total
            </span>
          </div>
          <Button onClick={() => setShowExport(true)}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <Timeline
          clips={timelineClips}
          selectedIndex={selectedClipIndex}
          onSelectClip={setSelectedClipIndex}
          onReorder={handleReorderClips}
        />
      </div>

      {/* Export modal */}
      {showExport && (
        <ExportPanel
          clips={timelineClips}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

function ClipDetails({ clip, onGenerateLipsync, isGenerating }) {
  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
        {clip.video ? (
          <video
            src={clip.video.url || clip.video.outputs?.[0]}
            className="w-full h-full object-cover"
          />
        ) : clip.keyframe ? (
          <img
            src={clip.keyframe.url || clip.keyframe.outputs?.[0]}
            alt="Keyframe"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            No preview
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">
            Scene {clip.sceneNumber} / Shot {clip.shotNumber}
          </span>
          <Badge variant="default">{clip.shotType || 'wide'}</Badge>
        </div>
        <p className="text-sm text-white/50 mb-4">
          {clip.description || 'No description'}
        </p>
      </div>

      {/* Status */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/50">Video</span>
          <Badge variant={clip.video ? 'success' : 'default'}>
            {clip.video ? 'Ready' : 'Missing'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">Audio</span>
          <Badge variant={clip.audio ? 'success' : 'default'}>
            {clip.audio ? 'Ready' : 'Missing'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">Lipsync</span>
          <Badge variant={clip.hasLipsync ? 'success' : 'default'}>
            {clip.hasLipsync ? 'Applied' : 'Not applied'}
          </Badge>
        </div>
      </div>

      {/* Lipsync button */}
      {clip.video && clip.audio && !clip.hasLipsync && (
        <Button
          onClick={() => onGenerateLipsync(clip)}
          loading={isGenerating}
          className="w-full"
          variant="secondary"
        >
          <Wand2 className="w-4 h-4" />
          Generate Lipsync
        </Button>
      )}
    </div>
  )
}
