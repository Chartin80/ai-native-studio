/**
 * ImageDropZone - Drag and drop zone for source images
 * Allows users to drop an image file to use as source for 3D reconstruction
 * Includes automatic image compression to stay under API limits
 */

import { useState, useCallback } from 'react'
import { Upload, Image, X, Loader2 } from 'lucide-react'
import { Button } from '../common'

// Max dimension for resizing (keeps aspect ratio)
const MAX_DIMENSION = 1024
// Target file size in bytes (under 3MB to stay safe with base64 overhead)
const TARGET_SIZE = 2 * 1024 * 1024

export function ImageDropZone({ onImageSelect, currentImage, onClear }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Compress and resize image to fit within API limits
   */
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          } else {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Start with high quality and reduce if needed
        let quality = 0.9
        let dataUrl = canvas.toDataURL('image/jpeg', quality)

        // Reduce quality until under target size
        while (dataUrl.length > TARGET_SIZE && quality > 0.3) {
          quality -= 0.1
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve({
          dataUrl,
          width,
          height,
          quality: Math.round(quality * 100),
        })
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith('image/')) {
          processFile(file)
        }
      }
    },
    [onImageSelect]
  )

  const handleFileInput = useCallback(
    (e) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
    },
    [onImageSelect]
  )

  const processFile = async (file) => {
    setIsProcessing(true)
    try {
      const compressed = await compressImage(file)
      onImageSelect({
        dataUrl: compressed.dataUrl,
        fileName: file.name,
        fileSize: compressed.dataUrl.length,
        dimensions: `${compressed.width}x${compressed.height}`,
        quality: compressed.quality,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="aspect-video rounded-lg bg-studio-surface border border-studio-border flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          <span className="text-sm text-white/60">Compressing image...</span>
        </div>
      </div>
    )
  }

  // If we have a current image, show preview with clear option
  if (currentImage) {
    return (
      <div className="relative">
        <div className="aspect-video rounded-lg overflow-hidden bg-studio-surface border border-studio-border">
          <img
            src={currentImage.dataUrl}
            alt="Dropped image"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={onClear}
            className="p-1.5 bg-black/60 hover:bg-accent-error rounded-lg transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white/80 truncate">
            {currentImage.fileName}
            {currentImage.dimensions && (
              <span className="text-white/40 ml-2">
                {currentImage.dimensions}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Drop zone UI
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative aspect-video rounded-lg border-2 border-dashed
        transition-all duration-200 cursor-pointer
        ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/10'
            : 'border-studio-border hover:border-white/30 bg-studio-surface/50'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div
          className={`
            p-3 rounded-full transition-colors
            ${isDragging ? 'bg-accent-primary/20' : 'bg-white/5'}
          `}
        >
          {isDragging ? (
            <Image className="w-6 h-6 text-accent-primary" />
          ) : (
            <Upload className="w-6 h-6 text-white/40" />
          )}
        </div>
        <div className="text-center">
          <p className={`text-sm font-medium ${isDragging ? 'text-accent-primary' : 'text-white/60'}`}>
            {isDragging ? 'Drop image here' : 'Drop image or click to upload'}
          </p>
          <p className="text-xs text-white/40 mt-1">
            PNG, JPG, WebP (auto-compressed)
          </p>
        </div>
      </div>
    </div>
  )
}
