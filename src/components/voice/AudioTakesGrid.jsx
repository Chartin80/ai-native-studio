import { useState, useRef } from 'react'
import { Play, Pause, Star, Download, Trash2, Check, User } from 'lucide-react'
import { Card, Badge } from '../common'

export function AudioTakesGrid({ takes, selectedTake, characters, onSelect, onDelete }) {
  return (
    <div className="space-y-3">
      {takes.map((take) => {
        const audioUrl = take.url || take.outputs?.[0]
        const isSelected = selectedTake === take.id
        const character = characters.find((c) => c.id === take.characterId)

        return (
          <AudioTakeCard
            key={take.id}
            take={take}
            audioUrl={audioUrl}
            isSelected={isSelected}
            character={character}
            onSelect={() => onSelect?.(take)}
            onDelete={() => onDelete?.(take)}
          />
        )
      })}
    </div>
  )
}

function AudioTakeCard({ take, audioUrl, isSelected, character, onSelect, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `audio-${take.id}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className={`overflow-hidden ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          {/* Character avatar */}
          {character ? (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {character.referenceImages?.length > 0 ? (
                <img
                  src={character.referenceImages[0]}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {character.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white/50" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {character?.name || 'Voice'}
              </span>
              {isSelected && (
                <Badge variant="primary" className="text-xs">Selected</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>{take.settings?.voice || 'default'}</span>
              <span>•</span>
              <span>{take.settings?.emotion || 'neutral'}</span>
              <span>•</span>
              <span>{take.settings?.pace || 1}x</span>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-accent-primary hover:bg-accent-primary/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Text preview */}
        <p className="text-sm text-white/70 mb-3 line-clamp-2">
          "{take.text}"
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSelect}
            className={`p-1.5 rounded transition-colors ${
              isSelected
                ? 'text-accent-warning'
                : 'text-white/40 hover:text-accent-warning'
            }`}
            title="Select this take"
          >
            <Star className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
          </button>
          <div className="flex gap-1">
            <button
              onClick={handleDownload}
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
