import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

export function PreviewPlayer({ clips, currentIndex, isPlaying, onPlayPause, onSelectClip }) {
  const videoRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentClip = currentIndex !== null ? clips[currentIndex] : clips[0]
  const videoUrl = currentClip?.video?.url || currentClip?.video?.outputs?.[0]
  const imageUrl = currentClip?.keyframe?.url || currentClip?.keyframe?.outputs?.[0]

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [videoUrl])

  const handleVideoEnd = () => {
    // Auto-advance to next clip
    if (currentIndex !== null && currentIndex < clips.length - 1) {
      onSelectClip?.(currentIndex + 1)
    } else {
      onPlayPause?.() // Stop playing at the end
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 bg-black flex flex-col">
      {/* Video area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full aspect-video bg-studio-bg rounded-lg overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              muted={isMuted}
              className="w-full h-full object-contain"
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onEnded={handleVideoEnd}
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              No preview available
            </div>
          )}

          {/* Click to play/pause overlay */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={onPlayPause}
          />
        </div>
      </div>

      {/* Controls */}
      {videoUrl && (
        <div className="px-4 py-3 border-t border-studio-border flex items-center gap-4">
          {/* Play/pause */}
          <button
            onClick={onPlayPause}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          {/* Time */}
          <span className="text-sm text-white/50 min-w-20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Progress bar */}
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-accent-primary"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
