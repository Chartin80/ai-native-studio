/**
 * ShotsPage - Display and manage video clips in a draggable canvas
 * Similar to FramesPage but for video clips generated from frames
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Video, X, ZoomIn, MoreVertical, GripVertical, Download, Play, Pause, Trash2 } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { EmptyState } from '../common'
import { Panel, PanelHeader, PanelContent } from '../layout'

export function ShotsPage() {
  // Project store - clips are persisted here
  const { currentProject, updateClip, deleteClip } = useProjectStore()
  const clips = currentProject?.clips || []

  // UI state
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [magnifiedClipId, setMagnifiedClipId] = useState(null)

  // Drag state for canvas items
  const [draggingClipId, setDraggingClipId] = useState(null)
  const [localClipPositions, setLocalClipPositions] = useState({})
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const draggingClipIdRef = useRef(null)

  const { addNotification } = useUIStore()
  const canvasRef = useRef(null)

  // Clip actions
  const handleClipAction = useCallback(async (clipId, action) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    switch (action) {
      case 'delete':
        await deleteClip(clipId)
        addNotification({ type: 'success', message: 'Clip deleted' })
        break
      default:
        break
    }
  }, [clips, addNotification, deleteClip])

  // Update clip properties (name, notes)
  const handleUpdateClip = useCallback(async (clipId, updates) => {
    await updateClip(clipId, updates)
  }, [updateClip])

  // Drag handlers for moving clips on canvas
  const handleDragStart = useCallback((e, clipId) => {
    e.preventDefault()
    e.stopPropagation()

    const clip = clips.find(c => c.id === clipId)
    if (!clip) return

    const clipCard = e.target.closest('.clip-card')
    if (!clipCard) return

    const rect = clipCard.getBoundingClientRect()
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    draggingClipIdRef.current = clipId
    setDraggingClipId(clipId)
    setSelectedClipId(clipId)

    // Track position during drag locally for smooth UI
    let currentPosition = { ...clip.position }

    const handleMouseMove = (moveEvent) => {
      if (!draggingClipIdRef.current || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const scrollLeft = canvasRef.current.scrollLeft
      const scrollTop = canvasRef.current.scrollTop

      const newX = moveEvent.clientX - canvasRect.left + scrollLeft - dragOffsetRef.current.x
      const newY = moveEvent.clientY - canvasRect.top + scrollTop - dragOffsetRef.current.y

      currentPosition = {
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      }

      // Update local state for smooth dragging
      setLocalClipPositions(prev => ({
        ...prev,
        [clipId]: currentPosition,
      }))
    }

    const handleMouseUp = async () => {
      const draggedClipId = draggingClipIdRef.current
      draggingClipIdRef.current = null
      setDraggingClipId(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      // Save final position to database
      if (draggedClipId && currentPosition) {
        await updateClip(draggedClipId, { position: currentPosition })
        // Clear local position after save
        setLocalClipPositions(prev => {
          const next = { ...prev }
          delete next[draggedClipId]
          return next
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [clips, updateClip])

  // Bring clip to front when selected
  const getClipZIndex = useCallback((clipId) => {
    if (draggingClipId === clipId) return 100
    if (selectedClipId === clipId) return 50
    return 10
  }, [draggingClipId, selectedClipId])

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas takes full width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Panel className="flex-1 flex flex-col">
          <PanelHeader title={`Video Clips (${clips.length})`} />
          <PanelContent className="flex-1 relative overflow-hidden">
            {/* Canvas container with ref for drag calculations */}
            <div
              ref={canvasRef}
              className={`absolute inset-0 overflow-auto bg-studio-bg/50 ${draggingClipId ? 'cursor-grabbing' : ''}`}
              onClick={() => setSelectedClipId(null)}
            >
              {clips.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyState
                    icon={Video}
                    title="No Video Clips Yet"
                    description="Generate videos from frames in the Frames tab to see them here."
                  />
                </div>
              ) : (
                <div className="min-h-[2000px] min-w-[2000px] p-4 relative">
                  {clips.map(clip => {
                    // Use local position during drag for smooth UI, otherwise use stored position
                    const effectivePosition = localClipPositions[clip.id] || clip.position
                    return (
                      <ClipCard
                        key={clip.id}
                        clip={{ ...clip, position: effectivePosition }}
                        isSelected={selectedClipId === clip.id}
                        isDragging={draggingClipId === clip.id}
                        zIndex={getClipZIndex(clip.id)}
                        onSelect={() => setSelectedClipId(clip.id)}
                        onMagnify={() => setMagnifiedClipId(clip.id)}
                        onUpdate={(updates) => handleUpdateClip(clip.id, updates)}
                        onAction={(action) => handleClipAction(clip.id, action)}
                        onDragStart={(e) => handleDragStart(e, clip.id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </PanelContent>
        </Panel>
      </div>

      {/* Magnified View Modal */}
      {magnifiedClipId && (
        <MagnifiedView
          clip={clips.find(c => c.id === magnifiedClipId)}
          onClose={() => setMagnifiedClipId(null)}
        />
      )}
    </div>
  )
}

// Clip Card Component with drag support
function ClipCard({ clip, isSelected, isDragging, zIndex, onSelect, onMagnify, onUpdate, onAction, onDragStart }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [localName, setLocalName] = useState(clip.name)
  const [localNotes, setLocalNotes] = useState(clip.notes)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)
  const dropdownRef = useRef(null)

  const handleNameSave = () => {
    onUpdate({ name: localName })
    setIsEditingName(false)
  }

  const handleNotesSave = () => {
    onUpdate({ notes: localNotes })
    setIsEditingNotes(false)
  }

  const togglePlayback = (e) => {
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    // Use setTimeout to avoid immediate trigger from the click that opened it
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div
      className={`
        clip-card absolute bg-studio-surface rounded-lg overflow-hidden shadow-xl
        transition-shadow duration-200 cursor-grab active:cursor-grabbing
        ${isSelected ? 'ring-2 ring-accent-success shadow-accent-success/20' : 'hover:ring-1 hover:ring-white/20'}
        ${isDragging ? 'shadow-2xl cursor-grabbing' : ''}
      `}
      style={{
        left: clip.position.x,
        top: clip.position.y,
        width: 300,
        zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseDown={(e) => {
        // Don't start drag if clicking on buttons or inputs or video
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('video')) {
          return
        }
        onDragStart(e)
      }}
    >
      {/* Header with title and actions */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-1 text-white/40">
          <GripVertical className="w-4 h-4" />
          <Video className="w-3.5 h-3.5 text-accent-success" />
          <span className="text-xs font-medium truncate max-w-[180px]">{clip.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMagnify()
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Magnify"
          >
            <ZoomIn className="w-3.5 h-3.5 text-white/40 hover:text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Actions"
          >
            <MoreVertical className="w-3.5 h-3.5 text-white/40 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={clip.videoUrl}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onEnded={() => setIsPlaying(false)}
        />

        {/* Play/Pause overlay */}
        <button
          onClick={togglePlayback}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? (
            <Pause className="w-12 h-12 text-white/80" />
          ) : (
            <Play className="w-12 h-12 text-white/80" />
          )}
        </button>

        {/* Duration badge */}
        {clip.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs">
            {clip.duration}s
          </div>
        )}

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-2 right-2 bg-studio-surface border border-studio-border rounded-lg shadow-xl z-20 py-1 min-w-[160px]"
          >
            <button
              onClick={async (e) => {
                e.stopPropagation()
                setShowDropdown(false)
                // Download the video
                try {
                  const response = await fetch(clip.videoUrl)
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${clip.name.replace(/[^a-z0-9]/gi, '_')}.mp4`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                } catch (error) {
                  console.error('Download failed:', error)
                  // Fallback: open in new tab
                  window.open(clip.videoUrl, '_blank')
                }
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Video
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
              <Trash2 className="w-4 h-4" />
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
            className="font-medium text-sm cursor-text hover:text-accent-success"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingName(true)
            }}
          >
            {clip.name}
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
            {clip.notes || 'Click to add notes...'}
          </p>
        )}
      </div>
    </div>
  )
}

// Magnified View Modal for video
function MagnifiedView({ clip, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef(null)

  if (!clip) return null

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

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
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <video
          ref={videoRef}
          src={clip.videoUrl}
          className="w-full rounded-lg"
          autoPlay
          loop
          muted
          playsInline
        />
        <button
          onClick={togglePlayback}
          className="absolute bottom-4 left-4 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-studio-surface/90 rounded-lg px-4 py-2">
        <p className="text-sm font-medium">{clip.name}</p>
        {clip.notes && <p className="text-xs text-white/60">{clip.notes}</p>}
        {clip.duration && <p className="text-xs text-white/40">{clip.duration}s</p>}
      </div>
    </div>
  )
}
