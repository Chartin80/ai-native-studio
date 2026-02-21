import { useState, useRef } from 'react'
import { GripVertical, Video, Image, Mic2 } from 'lucide-react'

export function Timeline({ clips, selectedIndex, onSelectClip, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const containerRef = useRef(null)

  const handleDragStart = (e, index) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newClips = [...clips]
      const [removed] = newClips.splice(dragIndex, 1)
      newClips.splice(dragOverIndex, 0, removed)
      onReorder?.(newClips)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const totalDuration = clips.reduce((sum, clip) => sum + (clip.duration || 5), 0)

  return (
    <div
      ref={containerRef}
      className="flex gap-1 p-4 overflow-x-auto bg-studio-bg"
    >
      {clips.map((clip, index) => {
        const isSelected = index === selectedIndex
        const isDragging = index === dragIndex
        const isDragOver = index === dragOverIndex
        const widthPercent = Math.max(10, ((clip.duration || 5) / Math.max(totalDuration, 1)) * 100)

        return (
          <div
            key={clip.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectClip?.(index)}
            className={`
              flex-shrink-0 h-20 rounded-lg overflow-hidden cursor-pointer
              transition-all duration-200 relative group
              ${isSelected ? 'ring-2 ring-accent-primary' : 'hover:ring-1 hover:ring-white/30'}
              ${isDragging ? 'opacity-50' : ''}
              ${isDragOver ? 'ml-4' : ''}
            `}
            style={{ width: `${Math.max(100, widthPercent * 3)}px` }}
          >
            {/* Thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5">
              {clip.video ? (
                <video
                  src={clip.video.url || clip.video.outputs?.[0]}
                  className="w-full h-full object-cover"
                />
              ) : clip.keyframe ? (
                <img
                  src={clip.keyframe.url || clip.keyframe.outputs?.[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Drag handle */}
            <div className="absolute top-1 left-1 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-3 h-3" />
            </div>

            {/* Status icons */}
            <div className="absolute top-1 right-1 flex gap-1">
              {clip.video && (
                <span className="p-1 bg-black/50 rounded">
                  <Video className="w-2.5 h-2.5 text-accent-success" />
                </span>
              )}
              {!clip.video && clip.keyframe && (
                <span className="p-1 bg-black/50 rounded">
                  <Image className="w-2.5 h-2.5 text-accent-primary" />
                </span>
              )}
              {clip.audio && (
                <span className="p-1 bg-black/50 rounded">
                  <Mic2 className="w-2.5 h-2.5 text-accent-warning" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
              <div className="text-xs font-medium truncate">
                S{clip.sceneNumber}/{clip.shotNumber}
              </div>
              <div className="text-xs text-white/50">{clip.duration || 5}s</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
