/**
 * CameraExplorerPage - 3D Camera Explorer for cinematic shot composition
 *
 * Workflow:
 * 1. Select a keyframe from the current shot
 * 2. Reconstruct 3D scene via Modal endpoint (Apple ml-sharp)
 * 3. Navigate 3D space with cinematic lens presets
 * 4. Capture reference snapshots from desired camera positions
 * 5. Generate consistent frames using AI (Gemini/Nano Banana Pro)
 * 6. Save results as keyframe variants
 */

import { useState, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Camera, Aperture, Sparkles, AlertCircle, RefreshCw, Upload } from 'lucide-react'

import { useProjectStore, useUIStore } from '../../lib/store'
import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { modalProvider } from '../../lib/providers/modal'
import { aiService } from '../../lib/providers'

import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { Button, Select, ProgressBar, EmptyState, Spinner } from '../common'
import { ShotSelector } from '../visuals/ShotSelector'
import { GaussianSplatViewer } from './GaussianSplatViewer'
import { CameraControls } from './CameraControls'
import { SnapshotGrid } from './SnapshotGrid'
import { ImageDropZone } from './ImageDropZone'

export function CameraExplorerPage() {
  const [searchParams] = useSearchParams()
  const captureRef = useRef(null)

  // Project store
  const { currentProject, currentScene, currentShot, addKeyframe } = useProjectStore()
  const { addNotification } = useUIStore()

  // Camera explorer store
  const {
    reconstructionStatus,
    reconstructionError,
    plyUrl,
    sourceKeyframeId,
    sourceKeyframeUrl,
    setReconstructionProcessing,
    setReconstructionCompleted,
    setReconstructionError,
    resetReconstruction,
    snapshots,
    selectedSnapshotId,
    getSelectedSnapshot,
    generationStatus,
    setGenerationProcessing,
    setGenerationCompleted,
    setGenerationError,
  } = useCameraExplorerStore()

  // Local state
  const [selectedKeyframeId, setSelectedKeyframeId] = useState(null)
  const [droppedImage, setDroppedImage] = useState(null)
  const [imageSource, setImageSource] = useState('drop') // 'drop' | 'keyframe'

  // Get keyframes from current shot
  const keyframes = useMemo(() => {
    return currentShot?.keyframes || []
  }, [currentShot])

  // Selected keyframe object
  const selectedKeyframe = useMemo(() => {
    if (selectedKeyframeId) {
      return keyframes.find((kf) => kf.id === selectedKeyframeId)
    }
    return keyframes[0] || null
  }, [keyframes, selectedKeyframeId])

  // Check if we have a valid source image
  const hasSourceImage = useMemo(() => {
    if (imageSource === 'drop') {
      return !!droppedImage
    }
    return !!selectedKeyframe
  }, [imageSource, droppedImage, selectedKeyframe])

  // Handle 3D reconstruction
  const handleReconstruct = async () => {
    let imageData = null
    let sourceId = null

    if (imageSource === 'drop') {
      if (!droppedImage) {
        addNotification({
          type: 'warning',
          message: 'Please drop an image first',
        })
        return
      }
      imageData = { imageBase64: droppedImage.dataUrl }
      sourceId = 'dropped-image'
    } else {
      if (!selectedKeyframe) {
        addNotification({
          type: 'warning',
          message: 'Please select a keyframe first',
        })
        return
      }
      const imageUrl = selectedKeyframe.url || selectedKeyframe.outputs?.[0]
      if (!imageUrl) {
        addNotification({
          type: 'error',
          message: 'Selected keyframe has no image URL',
        })
        return
      }
      imageData = { imageUrl }
      sourceId = selectedKeyframe.id
    }

    const sourceUrl = imageSource === 'drop' ? droppedImage.dataUrl : (selectedKeyframe?.url || selectedKeyframe?.outputs?.[0])
    setReconstructionProcessing(sourceId, sourceUrl)

    try {
      const result = await modalProvider.generate3DReconstruction(imageData)

      setReconstructionCompleted(result.plyUrl)
      addNotification({
        type: 'success',
        message: '3D scene reconstructed successfully',
      })
    } catch (error) {
      console.error('Reconstruction error:', error)
      setReconstructionError(error.message)
      addNotification({
        type: 'error',
        message: error.message || 'Failed to reconstruct 3D scene',
        duration: 8000,
      })
    }
  }

  // Handle snapshot capture
  const handleCapture = () => {
    if (captureRef.current) {
      const snapshot = captureRef.current()
      if (snapshot) {
        addNotification({
          type: 'success',
          message: 'Snapshot captured',
          duration: 2000,
        })
      }
    }
  }

  // Handle frame generation
  const handleGenerateFrame = async () => {
    const snapshot = getSelectedSnapshot()
    if (!snapshot) {
      addNotification({
        type: 'warning',
        message: 'Please select a snapshot first',
      })
      return
    }

    if (!sourceKeyframeUrl) {
      addNotification({
        type: 'error',
        message: 'Original keyframe not available',
      })
      return
    }

    setGenerationProcessing()

    try {
      // Build prompt for consistent frame generation
      const prompt = `Create a new cinematic frame from exactly this camera POV.
The reference image shows the desired framing and camera angle.
Keep all environmental details, lighting, and style consistent with the original wide shot.
Maintain character appearances, props, and set design exactly as shown in the original.
Use a ${snapshot.lens} lens perspective with natural depth of field.`

      // Call AI service for frame generation
      // Using the existing image generation with reference image
      const result = await aiService.generateImage({
        modelId: 'seedream-v4.5', // or make this configurable
        prompt,
        // Pass both original and reference for consistency
        // Note: This depends on the AI model's capabilities
        referenceImage: sourceKeyframeUrl,
        compositionReference: snapshot.thumbnailDataUrl,
        aspectRatio: '16:9',
        resolution: '2K',
      })

      if (result.outputs?.length > 0) {
        // Save as new keyframe variant
        await addKeyframe(currentScene.id, currentShot.id, {
          url: result.outputs[0],
          prompt,
          modelId: 'seedream-v4.5',
          settings: {
            sourceKeyframe: sourceKeyframeId,
            cameraPosition: snapshot.position,
            cameraRotation: snapshot.rotation,
            lens: snapshot.lens,
            type: 'camera-explorer-variant',
          },
        })

        setGenerationCompleted(result.outputs[0])
        addNotification({
          type: 'success',
          message: 'New frame generated and saved',
        })
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationError(error.message)
      addNotification({
        type: 'error',
        message: error.message || 'Failed to generate frame',
      })
    }
  }

  // Keyframe options for dropdown
  const keyframeOptions = keyframes.map((kf, index) => ({
    value: kf.id,
    label: `Keyframe ${index + 1}${kf.modelId ? ` (${kf.modelId})` : ''}`,
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SplitView
        left={
          <div className="h-full flex flex-col">
            {/* Shot Selector */}
            <ShotSelector />

            {/* Main Controls Panel */}
            <Panel className="flex-1 flex flex-col border-0 rounded-none border-t border-studio-border">
              <PanelHeader
                title="Camera Explorer"
                icon={<Box className="w-4 h-4" />}
              />
              <PanelContent className="flex-1 overflow-auto space-y-6">
                {/* Image Source Tabs */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Source Image
                  </label>
                  <div className="flex gap-1 p-1 bg-studio-surface rounded-lg mb-3">
                    <button
                      onClick={() => setImageSource('drop')}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                        ${imageSource === 'drop'
                          ? 'bg-accent-primary text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <Upload className="w-4 h-4" />
                      Drop Image
                    </button>
                    <button
                      onClick={() => setImageSource('keyframe')}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                        ${imageSource === 'keyframe'
                          ? 'bg-accent-primary text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <Box className="w-4 h-4" />
                      From Shot
                    </button>
                  </div>

                  {/* Drop Zone */}
                  {imageSource === 'drop' && (
                    <ImageDropZone
                      onImageSelect={setDroppedImage}
                      currentImage={droppedImage}
                      onClear={() => setDroppedImage(null)}
                    />
                  )}

                  {/* Keyframe Selection */}
                  {imageSource === 'keyframe' && (
                    <>
                      {keyframes.length > 0 ? (
                        <>
                          <Select
                            options={keyframeOptions}
                            value={selectedKeyframeId || keyframes[0]?.id}
                            onChange={(e) => setSelectedKeyframeId(e.target.value)}
                            placeholder="Select keyframe"
                          />
                          {selectedKeyframe && (
                            <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-studio-surface">
                              <img
                                src={selectedKeyframe.url || selectedKeyframe.outputs?.[0]}
                                alt="Selected keyframe"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-white/40 bg-studio-surface rounded-lg p-4 text-center">
                          No keyframes available. Generate keyframes in the Visuals page first.
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Reconstruction Button */}
                <div>
                  <Button
                    onClick={handleReconstruct}
                    disabled={!hasSourceImage || reconstructionStatus === 'processing'}
                    loading={reconstructionStatus === 'processing'}
                    className="w-full"
                  >
                    <Aperture className="w-4 h-4 mr-2" />
                    {reconstructionStatus === 'processing'
                      ? 'Reconstructing 3D...'
                      : 'Reconstruct 3D Scene'}
                  </Button>

                  {reconstructionStatus === 'processing' && (
                    <div className="mt-2">
                      <ProgressBar value={50} indeterminate />
                      <p className="text-xs text-white/40 mt-1 text-center">
                        Processing with Apple ml-sharp...
                      </p>
                    </div>
                  )}

                  {reconstructionStatus === 'error' && (
                    <div className="mt-2 bg-accent-error/10 border border-accent-error/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-accent-error flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-accent-error">Reconstruction failed</p>
                          <p className="text-xs text-white/60 mt-1">{reconstructionError}</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleReconstruct}
                            className="mt-2"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls (only when PLY is loaded) */}
                {plyUrl && (
                  <>
                    <div className="border-t border-studio-border pt-4">
                      <CameraControls />
                    </div>

                    {/* Capture Button */}
                    <div>
                      <Button
                        variant="secondary"
                        onClick={handleCapture}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Snapshot (Space)
                      </Button>
                    </div>

                    {/* Snapshots */}
                    <div className="border-t border-studio-border pt-4">
                      <h3 className="text-sm font-medium text-white/80 mb-3">
                        Captured Positions ({snapshots.length})
                      </h3>
                      <SnapshotGrid />
                    </div>

                    {/* Generate Frame Button */}
                    {snapshots.length > 0 && (
                      <div>
                        <Button
                          onClick={handleGenerateFrame}
                          disabled={!selectedSnapshotId || generationStatus === 'generating'}
                          loading={generationStatus === 'generating'}
                          className="w-full"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {generationStatus === 'generating'
                            ? 'Generating Frame...'
                            : 'Generate Frame from Snapshot'}
                        </Button>
                        <p className="text-xs text-white/40 mt-2 text-center">
                          Uses AI to render a consistent frame from your camera position
                        </p>
                      </div>
                    )}
                  </>
                )}
              </PanelContent>
            </Panel>
          </div>
        }
        right={
          <Panel className="flex-1 flex flex-col border-0 rounded-none">
            <PanelHeader title="3D View" />
            <PanelContent className="flex-1 overflow-hidden p-0">
              {plyUrl ? (
                <GaussianSplatViewer plyUrl={plyUrl} onCaptureRef={captureRef} />
              ) : (
                <EmptyState
                  icon={Box}
                  title="No 3D Scene Loaded"
                  description={
                    currentShot
                      ? 'Select a keyframe and click "Reconstruct 3D Scene" to create an explorable 3D environment.'
                      : 'Select a shot from the left panel to get started.'
                  }
                  className="h-full"
                />
              )}
            </PanelContent>
          </Panel>
        }
        defaultLeftWidth={380}
      />
    </div>
  )
}
