/**
 * VideoGenerationModal - Modal for configuring video generation from an image
 */

import { useState } from 'react'
import { X, Video, Loader2 } from 'lucide-react'
import { Button } from '../common'

export function VideoGenerationModal({ frame, onClose, onGenerate, isGenerating, progress }) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [generateAudio, setGenerateAudio] = useState(false)
  const [cameraFixed, setCameraFixed] = useState(false)

  const handleGenerate = () => {
    onGenerate({
      prompt,
      duration,
      generateAudio,
      cameraFixed,
      aspectRatio: frame.aspectRatio || '16:9',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-studio-surface border border-studio-border rounded-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold">Create Video</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Source Image Preview */}
          <div className="flex gap-4">
            <img
              src={frame.imageUrl}
              alt={frame.name}
              className="w-32 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{frame.name}</p>
              <p className="text-xs text-white/50 mt-1">
                Aspect Ratio: {frame.aspectRatio || '16:9'}
              </p>
              <p className="text-xs text-white/50">
                Using Seedance 1.5 Pro
              </p>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Motion Prompt <span className="text-white/40">(optional)</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the motion or camera movement..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-primary resize-none h-20"
              disabled={isGenerating}
            />
          </div>

          {/* Duration Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">Duration</label>
              <span className="text-sm text-accent-primary font-medium">{duration} seconds</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>4s</span>
              <span>12s</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generateAudio}
                onChange={(e) => setGenerateAudio(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                disabled={isGenerating}
              />
              <span className="text-sm text-white/80">Generate Audio</span>
              <span className="text-xs text-white/40">(+$0.13)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cameraFixed}
                onChange={(e) => setCameraFixed(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                disabled={isGenerating}
              />
              <span className="text-sm text-white/80">Fixed Camera</span>
              <span className="text-xs text-white/40">(no camera movement)</span>
            </label>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Generating video...</span>
                <span className="text-accent-primary">{progress || 0}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-300"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">
                Video generation typically takes 1-3 minutes
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-studio-border bg-white/5">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
