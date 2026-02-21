import { useState } from 'react'
import { Download, X, FileVideo, FileText, Package } from 'lucide-react'
import { Button, Select, Modal, ProgressBar } from '../common'
import { useUIStore } from '@/lib/store'

export function ExportPanel({ clips, onClose }) {
  const { addNotification } = useUIStore()
  const [exportType, setExportType] = useState('clips')
  const [format, setFormat] = useState('mp4')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const exportTypeOptions = [
    { value: 'clips', label: 'Individual Clips', description: 'Download each shot separately' },
    { value: 'sequence', label: 'Full Sequence', description: 'Combine all clips into one video' },
    { value: 'edl', label: 'EDL/XML', description: 'For Premiere Pro / DaVinci Resolve' },
  ]

  const formatOptions = [
    { value: 'mp4', label: 'MP4 (H.264)' },
    { value: 'webm', label: 'WebM (VP9)' },
    { value: 'mov', label: 'MOV (ProRes)' },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      if (exportType === 'edl') {
        // Generate EDL
        const edl = generateEDL(clips)
        downloadText(edl, 'sequence.edl')
        addNotification({
          type: 'success',
          message: 'EDL exported successfully',
        })
      } else if (exportType === 'clips') {
        // Download each clip
        for (let i = 0; i < clips.length; i++) {
          const clip = clips[i]
          const url = clip.video?.url || clip.video?.outputs?.[0]
          if (url) {
            await downloadFile(url, `scene${clip.sceneNumber}_shot${clip.shotNumber}.${format}`)
          }
          setProgress(((i + 1) / clips.length) * 100)
        }
        addNotification({
          type: 'success',
          message: `Exported ${clips.length} clips`,
        })
      } else {
        // Sequence export would require server-side processing
        addNotification({
          type: 'info',
          message: 'Full sequence export requires server-side processing (coming soon)',
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Export failed: ${error.message}`,
      })
    } finally {
      setIsExporting(false)
      setProgress(0)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Export Project" size="md">
      <div className="space-y-6">
        {/* Export type */}
        <Select
          label="Export Type"
          options={exportTypeOptions}
          value={exportType}
          onChange={setExportType}
        />

        {/* Format (for video exports) */}
        {exportType !== 'edl' && (
          <Select
            label="Format"
            options={formatOptions}
            value={format}
            onChange={setFormat}
          />
        )}

        {/* Summary */}
        <div className="p-4 bg-white/5 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-white/50" />
            <span className="text-white/70">Export Summary</span>
          </div>
          <div className="text-sm text-white/50">
            <p>{clips.length} clips</p>
            <p>
              {clips.reduce((sum, c) => sum + (c.duration || 5), 0)}s total duration
            </p>
            {exportType === 'clips' && (
              <p>{clips.filter((c) => c.video).length} videos, {clips.filter((c) => c.audio).length} audio files</p>
            )}
          </div>
        </div>

        {/* Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Exporting...</span>
              <span className="text-white/60">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} loading={isExporting}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function generateEDL(clips) {
  let edl = 'TITLE: AI Native Studio Export\nFCM: NON-DROP FRAME\n\n'
  let timecodeCurrent = 0

  clips.forEach((clip, index) => {
    const duration = clip.duration || 5
    const timecodeStart = formatTimecode(timecodeCurrent)
    const timecodeEnd = formatTimecode(timecodeCurrent + duration)

    edl += `${String(index + 1).padStart(3, '0')}  `
    edl += `SCENE${clip.sceneNumber}_SHOT${clip.shotNumber} `
    edl += `V     C        `
    edl += `${timecodeStart} ${timecodeEnd} ${timecodeStart} ${timecodeEnd}\n`

    if (clip.video) {
      edl += `* FROM CLIP NAME: ${clip.video.url || clip.video.outputs?.[0]}\n`
    }
    edl += '\n'

    timecodeCurrent += duration
  })

  return edl
}

function formatTimecode(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 24)

  return [hours, minutes, secs, frames]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
