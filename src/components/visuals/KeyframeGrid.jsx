import { useState } from 'react'
import { Star, Download, Trash2, ZoomIn, Check } from 'lucide-react'
import { Card, Modal, Button } from '../common'

export function KeyframeGrid({ keyframes, selectedKeyframe, onSelect, onDelete }) {
  const [previewImage, setPreviewImage] = useState(null)

  const handleDownload = (keyframe) => {
    const url = keyframe.url || keyframe.outputs?.[0]
    if (!url) return

    const link = document.createElement('a')
    link.href = url
    link.download = `keyframe-${keyframe.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {keyframes.map((keyframe) => {
          const imageUrl = keyframe.url || keyframe.outputs?.[0]
          const isSelected = selectedKeyframe === keyframe.id

          return (
            <Card
              key={keyframe.id}
              hover
              className={`group overflow-hidden ${isSelected ? 'ring-2 ring-accent-primary' : ''}`}
            >
              {/* Image */}
              <div
                className="aspect-video bg-gradient-to-br from-white/5 to-white/10 cursor-pointer relative"
                onClick={() => setPreviewImage(keyframe)}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Keyframe"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    No image
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-2 left-2 p-1 bg-accent-primary rounded">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Info and actions */}
              <div className="p-3">
                <p className="text-xs text-white/50 truncate mb-2">
                  {keyframe.modelId || 'Generated'}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onSelect?.(keyframe)}
                    className={`p-1.5 rounded transition-colors ${
                      isSelected
                        ? 'text-accent-warning'
                        : 'text-white/40 hover:text-accent-warning'
                    }`}
                    title="Use as selected keyframe"
                  >
                    <Star className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(keyframe)}
                      className="p-1.5 rounded text-white/40 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(keyframe)}
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
        })}
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        size="xl"
      >
        <div className="space-y-4">
          <img
            src={previewImage?.url || previewImage?.outputs?.[0]}
            alt="Preview"
            className="w-full rounded-lg"
          />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-white/50 mb-1">Prompt</p>
              <p className="text-sm">{previewImage?.prompt || 'No prompt'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(previewImage)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onSelect?.(previewImage)
                  setPreviewImage(null)
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
