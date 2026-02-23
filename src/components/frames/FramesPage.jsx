/**
 * FramesPage - Generate and edit frames using Nano Banana Pro Edit
 */

import { useState, useCallback, useRef } from 'react'
import { Image, Upload, X, Move, ZoomIn, MoreVertical, Video, Camera, Layers } from 'lucide-react'
import { Panel, PanelHeader, PanelContent } from '../layout'
import { Button, Textarea, Spinner, EmptyState } from '../common'
import { wavespeedProvider } from '@/lib/providers/wavespeed'
import { useUIStore } from '@/lib/store'

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
]

export function FramesPage() {
  // Input state
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [sourceImages, setSourceImages] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)

  // Output state - frames on canvas
  const [frames, setFrames] = useState([])
  const [selectedFrameId, setSelectedFrameId] = useState(null)
  const [magnifiedFrameId, setMagnifiedFrameId] = useState(null)

  const { addNotification } = useUIStore()
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      processFiles(files)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Process uploaded files
  const processFiles = useCallback((files) => {
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSourceImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          dataUrl: e.target.result,
          name: file.name,
        }])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Remove source image
  const removeSourceImage = useCallback((id) => {
    setSourceImages(prev => prev.filter(img => img.id !== id))
  }, [])

  // Generate with Nano Banana Pro Edit
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      addNotification({ type: 'error', message: 'Please enter a prompt' })
      return
    }
    if (sourceImages.length === 0) {
      addNotification({ type: 'error', message: 'Please add at least one source image' })
      return
    }

    setIsGenerating(true)

    try {
      const result = await wavespeedProvider.editImageWithNanoBanana({
        prompt: prompt.trim(),
        images: sourceImages.map(img => img.dataUrl),
        aspectRatio,
      })

      if (result.imageUrl) {
        // Add to canvas with initial position
        const newFrame = {
          id: Date.now(),
          imageUrl: result.imageUrl,
          name: `Frame ${frames.length + 1}`,
          notes: '',
          position: { x: 50 + (frames.length % 3) * 320, y: 50 + Math.floor(frames.length / 3) * 220 },
          prompt: prompt.trim(),
          sourceImages: sourceImages.map(img => img.name),
          createdAt: new Date().toISOString(),
        }
        setFrames(prev => [...prev, newFrame])
        addNotification({ type: 'success', message: 'Frame generated successfully!' })
      }
    } catch (error) {
      console.error('Generation error:', error)
      addNotification({ type: 'error', message: error.message || 'Generation failed' })
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, sourceImages, aspectRatio, frames.length, addNotification])

  // Frame actions
  const handleFrameAction = useCallback((frameId, action) => {
    const frame = frames.find(f => f.id === frameId)
    if (!frame) return

    switch (action) {
      case 'create-video':
        addNotification({ type: 'info', message: 'Video generation coming soon!' })
        break
      case 'step-into':
        addNotification({ type: 'info', message: 'Step into frame (3D) coming soon!' })
        break
      case 'new-angles':
        addNotification({ type: 'info', message: 'Generate new angles coming soon!' })
        break
      case 'delete':
        setFrames(prev => prev.filter(f => f.id !== frameId))
        break
      default:
        break
    }
  }, [frames, addNotification])

  // Update frame name/notes
  const updateFrame = useCallback((frameId, updates) => {
    setFrames(prev => prev.map(f =>
      f.id === frameId ? { ...f, ...updates } : f
    ))
  }, [])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Controls */}
      <div className="w-[380px] flex flex-col border-r border-studio-border bg-studio-surface/30">
        <Panel className="flex-1 flex flex-col">
          <PanelHeader title="Nano Banana Pro Edit" />
          <PanelContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Edit Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how to edit the image..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Image Drop Zone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Source Images</label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
                `}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                <p className="text-sm text-white/60">
                  Drop images here or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => processFiles(Array.from(e.target.files))}
                  className="hidden"
                />
              </div>

              {/* Source Image Previews */}
              {sourceImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sourceImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSourceImage(img.id)
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Aspect Ratio</label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map(ar => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${aspectRatio === ar.value
                        ? 'bg-accent-primary text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Info */}
            <div className="text-xs text-white/40 bg-white/5 rounded-lg p-3">
              Output: 2K resolution ({aspectRatio === '16:9' ? '2560×1440' : '1440×2560'})
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || sourceImages.length === 0}
              className="w-full mt-auto"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
                  Generate Frame
                </>
              )}
            </Button>
          </PanelContent>
        </Panel>
      </div>

      {/* Right Panel - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Panel className="flex-1 flex flex-col">
          <PanelHeader title="Frame Canvas" />
          <PanelContent className="flex-1 relative overflow-auto bg-studio-bg/50" ref={canvasRef}>
            {frames.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <EmptyState
                  icon={Image}
                  title="No Frames Yet"
                  description="Generate frames using Nano Banana Pro Edit to see them here."
                />
              </div>
            ) : (
              <div className="min-h-full min-w-full p-4 relative">
                {frames.map(frame => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    isSelected={selectedFrameId === frame.id}
                    isMagnified={magnifiedFrameId === frame.id}
                    onSelect={() => setSelectedFrameId(frame.id)}
                    onMagnify={() => setMagnifiedFrameId(magnifiedFrameId === frame.id ? null : frame.id)}
                    onUpdate={(updates) => updateFrame(frame.id, updates)}
                    onAction={(action) => handleFrameAction(frame.id, action)}
                  />
                ))}
              </div>
            )}
          </PanelContent>
        </Panel>
      </div>

      {/* Magnified View Modal */}
      {magnifiedFrameId && (
        <MagnifiedView
          frame={frames.find(f => f.id === magnifiedFrameId)}
          onClose={() => setMagnifiedFrameId(null)}
        />
      )}
    </div>
  )
}

// Frame Card Component
function FrameCard({ frame, isSelected, isMagnified, onSelect, onMagnify, onUpdate, onAction }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [localName, setLocalName] = useState(frame.name)
  const [localNotes, setLocalNotes] = useState(frame.notes)

  const handleNameSave = () => {
    onUpdate({ name: localName })
    setIsEditingName(false)
  }

  const handleNotesSave = () => {
    onUpdate({ notes: localNotes })
    setIsEditingNotes(false)
  }

  return (
    <div
      className={`
        absolute bg-studio-surface rounded-lg overflow-hidden shadow-xl
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-accent-primary' : 'hover:ring-1 hover:ring-white/20'}
      `}
      style={{
        left: frame.position.x,
        top: frame.position.y,
        width: 300,
      }}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative aspect-video bg-black">
        <img
          src={frame.imageUrl}
          alt={frame.name}
          className="w-full h-full object-cover"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMagnify()
            }}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Magnify"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-12 right-2 bg-studio-surface border border-studio-border rounded-lg shadow-xl z-10 py-1 min-w-[160px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('create-video')
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Create Video
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('step-into')
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Step Into Frame
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('new-angles')
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              Create New Angles
            </button>
            <div className="border-t border-studio-border my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction('delete')
                setShowDropdown(false)
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 space-y-2">
        {/* Name */}
        {isEditingName ? (
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h4
            className="font-medium text-sm cursor-text hover:text-accent-primary"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingName(true)
            }}
          >
            {frame.name}
          </h4>
        )}

        {/* Notes */}
        {isEditingNotes ? (
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesSave}
            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs resize-none min-h-[60px]"
            placeholder="Add notes..."
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className="text-xs text-white/50 cursor-text hover:text-white/70 min-h-[20px]"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingNotes(true)
            }}
          >
            {frame.notes || 'Click to add notes...'}
          </p>
        )}
      </div>
    </div>
  )
}

// Magnified View Modal
function MagnifiedView({ frame, onClose }) {
  if (!frame) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={frame.imageUrl}
        alt={frame.name}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-studio-surface/90 rounded-lg px-4 py-2">
        <p className="text-sm font-medium">{frame.name}</p>
        {frame.notes && <p className="text-xs text-white/60">{frame.notes}</p>}
      </div>
    </div>
  )
}
