/**
 * SnapshotGrid - Grid of captured camera positions/snapshots
 */

import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { getLensPreset } from '../../lib/camera/lensPresets'
import { Trash2, Check } from 'lucide-react'

export function SnapshotGrid() {
  const { snapshots, selectedSnapshotId, selectSnapshot, deleteSnapshot } =
    useCameraExplorerStore()

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm">
        <p>No snapshots captured yet.</p>
        <p className="text-xs mt-1">Press Space or click Capture to save a camera position.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {snapshots.map((snapshot, index) => {
        const lens = getLensPreset(snapshot.lens)
        const isSelected = snapshot.id === selectedSnapshotId

        return (
          <div
            key={snapshot.id}
            onClick={() => selectSnapshot(snapshot.id)}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden
              border-2 transition-all
              ${
                isSelected
                  ? 'border-accent-primary ring-2 ring-accent-primary/30'
                  : 'border-transparent hover:border-white/20'
              }
            `}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-studio-surface">
              <img
                src={snapshot.thumbnailDataUrl}
                alt={`Snapshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/80">
                  {lens.focalLength}mm
                </span>
                <span className="text-xs text-white/40">#{index + 1}</span>
              </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 bg-accent-primary rounded-full p-1">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Delete Button (on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteSnapshot(snapshot.id)
              }}
              className="absolute top-2 left-2 bg-black/60 hover:bg-accent-error rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
