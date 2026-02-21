import { useState, useMemo, useEffect } from 'react'
import { Video, Wand2, Play, Pause, Download } from 'lucide-react'
import { useProjectStore, useUIStore, useGenerationStore } from '@/lib/store'
import { getModelSchema, getDefaultModel } from '@/lib/models'
import { Button, Textarea, Select, ModelSelector, EmptyState, ProgressBar } from '../common'
import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { ShotSelector } from '../visuals/ShotSelector'
import { VideoTakesGrid } from './VideoTakesGrid'

export function VideoPage() {
  const { currentProject, currentScene, currentShot, addVideoTake } = useProjectStore()
  const { addNotification } = useUIStore()
  const { generateVideo, activeTasks } = useGenerationStore()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedModelId, setSelectedModelId] = useState(() => getDefaultModel('imageToVideo')?.id)
  const [motionType, setMotionType] = useState('static')
  const [duration, setDuration] = useState(5)
  const [resolution, setResolution] = useState('1080p')
  const [isGenerating, setIsGenerating] = useState(false)

  const modelSchema = useMemo(
    () => getModelSchema(selectedModelId) || {},
    [selectedModelId]
  )

  // Get selected keyframe
  const selectedKeyframe = useMemo(() => {
    if (!currentShot) return null
    const selectedId = currentShot.selectedKeyframe
    if (selectedId) {
      return currentShot.keyframes?.find((kf) => kf.id === selectedId)
    }
    return currentShot.keyframes?.[0]
  }, [currentShot])

  // Build motion prompt from shot description
  useEffect(() => {
    if (currentShot && !prompt) {
      const parts = []
      if (currentShot.movement && currentShot.movement !== 'static') {
        parts.push(currentShot.movement)
      }
      if (currentShot.description) {
        parts.push(currentShot.description)
      }
      setPrompt(parts.filter(Boolean).join(', '))
    }
  }, [currentShot?.id])

  const currentTask = activeTasks.find(
    (t) => t.type === 'video' && t.shotId === currentShot?.id
  )

  const handleGenerate = async () => {
    if (!currentShot) {
      addNotification({
        type: 'warning',
        message: 'Please select a shot first',
      })
      return
    }

    if (!selectedKeyframe) {
      addNotification({
        type: 'warning',
        message: 'Please generate a keyframe first',
      })
      return
    }

    setIsGenerating(true)
    try {
      const imageUrl = selectedKeyframe.url || selectedKeyframe.outputs?.[0]

      const result = await generateVideo({
        projectId: currentProject.id,
        sceneId: currentScene.id,
        shotId: currentShot.id,
        modelId: selectedModelId,
        imageUrl,
        prompt,
        negativePrompt,
        motionType,
        duration,
        resolution,
      })

      // Add video take to shot
      if (result.outputs?.length > 0) {
        await addVideoTake(currentScene.id, currentShot.id, {
          url: result.outputs[0],
          sourceKeyframe: selectedKeyframe.id,
          prompt,
          modelId: selectedModelId,
          settings: { motionType, duration, resolution },
        })
      }

      addNotification({
        type: 'success',
        message: 'Video generated successfully',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Generation failed: ${error.message}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const motionOptions = (modelSchema.motionTypes || [
    { id: 'static', name: 'Static' },
    { id: 'dolly_in', name: 'Dolly In' },
    { id: 'dolly_out', name: 'Dolly Out' },
    { id: 'pan_left', name: 'Pan Left' },
    { id: 'pan_right', name: 'Pan Right' },
  ]).map((m) => ({
    value: m.id,
    label: m.name,
    description: m.description,
  }))

  const durationOptions = (modelSchema.durations || [5, 10]).map((d) => ({
    value: d,
    label: `${d} seconds`,
  }))

  const resolutionOptions = (modelSchema.resolutions || ['720p', '1080p']).map((r) => ({
    value: r,
    label: r,
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SplitView
        left={
          <div className="h-full flex flex-col">
            {/* Shot selector */}
            <ShotSelector />

            {/* Source keyframe preview */}
            {selectedKeyframe && (
              <div className="px-4 py-3 border-b border-studio-border">
                <p className="text-xs text-white/50 mb-2">Source Keyframe</p>
                <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
                  <img
                    src={selectedKeyframe.url || selectedKeyframe.outputs?.[0]}
                    alt="Source keyframe"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Generation controls */}
            <Panel className="flex-1 flex flex-col border-0 rounded-none border-t border-studio-border">
              <PanelHeader title="Generate Video" />
              <PanelContent className="flex-1 overflow-auto space-y-4">
                {/* Model selector */}
                <ModelSelector
                  category="imageToVideo"
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  label="Model"
                />

                {/* Motion type */}
                <Select
                  label="Camera Motion"
                  options={motionOptions}
                  value={motionType}
                  onChange={setMotionType}
                />

                {/* Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Duration"
                    options={durationOptions}
                    value={duration}
                    onChange={setDuration}
                  />
                  <Select
                    label="Resolution"
                    options={resolutionOptions}
                    value={resolution}
                    onChange={setResolution}
                  />
                </div>

                {/* Motion prompt */}
                {modelSchema.supportsMotionPrompt && (
                  <Textarea
                    label="Motion Description"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the motion and action..."
                    rows={3}
                  />
                )}

                {/* Negative prompt */}
                {modelSchema.supportsNegativePrompt && (
                  <Textarea
                    label="Negative Prompt (optional)"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid..."
                    rows={2}
                  />
                )}

                {/* Progress */}
                {currentTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Generating video...</span>
                      <span className="text-white/60">{currentTask.progress || 0}%</span>
                    </div>
                    <ProgressBar value={currentTask.progress || 0} />
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!currentShot || !selectedKeyframe}
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Video
                </Button>
              </PanelContent>
            </Panel>
          </div>
        }
        right={
          <div className="h-full flex flex-col">
            <Panel className="flex-1 flex flex-col border-0 rounded-none">
              <PanelHeader
                title={currentShot ? `Video Takes (${currentShot.videoTakes?.length || 0})` : 'Video Takes'}
              />
              <PanelContent className="flex-1 overflow-auto">
                {currentShot ? (
                  currentShot.videoTakes?.length > 0 ? (
                    <VideoTakesGrid
                      takes={currentShot.videoTakes}
                      selectedTake={currentShot.selectedVideo}
                      onSelect={(take) => {
                        // TODO: Update selected video
                      }}
                    />
                  ) : (
                    <EmptyState
                      icon={Video}
                      title="No video takes yet"
                      description={
                        selectedKeyframe
                          ? 'Generate videos using the controls on the left'
                          : 'Generate a keyframe first, then create videos'
                      }
                      className="h-full"
                    />
                  )
                ) : (
                  <EmptyState
                    icon={Video}
                    title="Select a shot"
                    description="Choose a shot with a keyframe to generate videos"
                    className="h-full"
                  />
                )}
              </PanelContent>
            </Panel>
          </div>
        }
        defaultLeftWidth={380}
        minLeftWidth={300}
        maxLeftWidth={500}
      />
    </div>
  )
}
