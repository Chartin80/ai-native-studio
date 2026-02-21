import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Image, Wand2, Star, Download, Trash2 } from 'lucide-react'
import { useProjectStore, useUIStore, useGenerationStore } from '@/lib/store'
import { getModelSchema, getDefaultModel } from '@/lib/models'
import { Button, Textarea, Select, ModelSelector, EmptyState, ProgressBar, Spinner } from '../common'
import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { ShotSelector } from './ShotSelector'
import { KeyframeGrid } from './KeyframeGrid'

export function VisualsPage() {
  const [searchParams] = useSearchParams()
  const shotIdParam = searchParams.get('shot')

  const { currentProject, setCurrentShot, currentScene, currentShot, addKeyframe } = useProjectStore()
  const { addNotification } = useUIStore()
  const { generateImage, activeTasks } = useGenerationStore()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedModelId, setSelectedModelId] = useState(() => getDefaultModel('imageGeneration')?.id)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('2K')
  const [isGenerating, setIsGenerating] = useState(false)

  const modelSchema = useMemo(
    () => getModelSchema(selectedModelId) || {},
    [selectedModelId]
  )

  // Set initial shot from URL param
  useEffect(() => {
    if (shotIdParam) {
      setCurrentShot(shotIdParam)
    }
  }, [shotIdParam])

  // Build prompt from shot description
  useEffect(() => {
    if (currentShot && !prompt) {
      const scene = currentScene
      const parts = []

      if (scene?.location) parts.push(scene.location)
      if (scene?.timeOfDay) parts.push(scene.timeOfDay)
      if (scene?.mood) parts.push(scene.mood + ' mood')
      if (currentShot.shotType) parts.push(currentShot.shotType + ' shot')
      if (currentShot.description) parts.push(currentShot.description)

      setPrompt(parts.filter(Boolean).join(', '))
    }
  }, [currentShot?.id])

  const currentTask = activeTasks.find(
    (t) => t.type === 'image' && t.shotId === currentShot?.id
  )

  const handleGenerate = async () => {
    if (!currentShot) {
      addNotification({
        type: 'warning',
        message: 'Please select a shot first',
      })
      return
    }

    if (!prompt.trim()) {
      addNotification({
        type: 'warning',
        message: 'Please enter a prompt',
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateImage({
        projectId: currentProject.id,
        sceneId: currentScene.id,
        shotId: currentShot.id,
        modelId: selectedModelId,
        prompt,
        negativePrompt,
        aspectRatio,
        resolution,
      })

      // Add keyframe to shot
      if (result.outputs?.length > 0) {
        await addKeyframe(currentScene.id, currentShot.id, {
          url: result.outputs[0],
          prompt,
          modelId: selectedModelId,
          settings: { aspectRatio, resolution },
        })
      }

      addNotification({
        type: 'success',
        message: 'Image generated successfully',
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

  const aspectRatioOptions = (modelSchema.aspectRatios || ['16:9', '9:16', '1:1']).map(
    (ar) => ({ value: ar, label: ar })
  )

  const resolutionOptions = (modelSchema.resolutions || ['1K', '2K']).map(
    (r) => ({ value: r, label: r })
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SplitView
        left={
          <div className="h-full flex flex-col">
            {/* Shot selector */}
            <ShotSelector />

            {/* Generation controls */}
            <Panel className="flex-1 flex flex-col border-0 rounded-none border-t border-studio-border">
              <PanelHeader title="Generate Keyframe" />
              <PanelContent className="flex-1 overflow-auto space-y-4">
                {/* Model selector */}
                <ModelSelector
                  category="imageGeneration"
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  label="Model"
                />

                {/* Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Aspect Ratio"
                    options={aspectRatioOptions}
                    value={aspectRatio}
                    onChange={setAspectRatio}
                  />
                  <Select
                    label="Resolution"
                    options={resolutionOptions}
                    value={resolution}
                    onChange={setResolution}
                  />
                </div>

                {/* Prompt */}
                <Textarea
                  label="Prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={4}
                />

                {/* Negative prompt */}
                {modelSchema.supportsNegativePrompt && (
                  <Textarea
                    label="Negative Prompt (optional)"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to avoid in the image..."
                    rows={2}
                  />
                )}

                {/* Progress */}
                {currentTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Generating...</span>
                      <span className="text-white/60">{currentTask.progress || 0}%</span>
                    </div>
                    <ProgressBar value={currentTask.progress || 0} />
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!currentShot || !prompt.trim()}
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Keyframe
                </Button>
              </PanelContent>
            </Panel>
          </div>
        }
        right={
          <div className="h-full flex flex-col">
            <Panel className="flex-1 flex flex-col border-0 rounded-none">
              <PanelHeader
                title={currentShot ? `Keyframes (${currentShot.keyframes?.length || 0})` : 'Keyframes'}
              />
              <PanelContent className="flex-1 overflow-auto">
                {currentShot ? (
                  currentShot.keyframes?.length > 0 ? (
                    <KeyframeGrid
                      keyframes={currentShot.keyframes}
                      selectedKeyframe={currentShot.selectedKeyframe}
                      onSelect={(kf) => {
                        // TODO: Update selected keyframe
                      }}
                    />
                  ) : (
                    <EmptyState
                      icon={Image}
                      title="No keyframes yet"
                      description="Generate keyframes using the controls on the left"
                      className="h-full"
                    />
                  )
                ) : (
                  <EmptyState
                    icon={Image}
                    title="Select a shot"
                    description="Choose a shot from the list to view and generate keyframes"
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
