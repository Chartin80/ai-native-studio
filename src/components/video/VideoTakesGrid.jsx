import { useState, useRef } from 'react'
import { Play, Pause, Star, Download, Trash2, Check, Volume2, VolumeX } from 'lucide-react'
import { Card, Modal, Button } from '../common'

export function VideoTakesGrid({ takes, selectedTake, onSelect, onDelete }) {
  const [previewVideo, setPreviewVideo] = useState(null)

  const handleDownload = (take) => {
    const url = take.url || take.outputs?.[0]
    if (!url) return

    const link = document.createElement('a')
    link.href = url
    link.download = `video-${take.id}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {takes.map((take) => {
          const videoUrl = take.url || take.outputs?.[0]
          const isSelected = selectedTake === take.id

          return (
            <VideoTakeCard
              key={take.id}
              take={take}
              videoUrl={videoUrl}
              isSelected={isSelected}
              onPreview={() => setPreviewVideo(take)}
              onSelect={() => onSelect?.(take)}
              onDownload={() => handleDownload(take)}
              onDelete={() => onDelete?.(take)}
            />
          )
        })}
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        size="xl"
      >
        <div className="space-y-4">
          <video
            src={previewVideo?.url || previewVideo?.outputs?.[0]}
            controls
            autoPlay
            className="w-full rounded-lg"
          />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-white/50 mb-1">Settings</p>
              <p className="text-sm">
                {previewVideo?.settings?.duration}s • {previewVideo?.settings?.resolution} •{' '}
                {previewVideo?.settings?.motionType}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(previewVideo)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onSelect?.(previewVideo)
                  setPreviewVideo(null)
                }}
              >
                <Star className="w-4 h-4" />
                Select
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function VideoTakeCard({
  take,
  videoUrl,
  isSelected,
  onPreview,
  onSelect,
  onDownload,
  onDelete,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)

  const togglePlay = (e) => {
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

  const toggleMute = (e) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <Card
      hover
      className={`group overflow-hidden ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}
    >
      {/* Video */}
      <div
        className="aspect-video bg-gradient-to-br from-white/5 to-white/10 cursor-pointer relative"
        onClick={onPreview}
      >
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              muted={isMuted}
              loop
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="p-3 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            No video
          </div>
        )}

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 left-2 p-1 bg-accent-primary rounded">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Info and actions */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-white/50 mb-2">
          <span>{take.settings?.duration || 5}s</span>
          <span>{take.settings?.resolution || '1080p'}</span>
          <span>{take.settings?.motionType || 'static'}</span>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelect?.()}
            className={`p-1.5 rounded transition-colors ${
              isSelected
                ? 'text-accent-warning'
                : 'text-white/40 hover:text-accent-warning'
            }`}
            title="Use as selected video"
          >
            <Star className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
          </button>
          <div className="flex gap-1">
            <button
              onClick={onDownload}
              className="p-1.5 rounded text-white/40 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded text-white/40 hover:text-accent-error transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
