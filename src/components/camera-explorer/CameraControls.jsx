/**
 * CameraControls - Lens presets and camera position controls
 */

import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { LENS_OPTIONS, getLensPreset } from '../../lib/camera/lensPresets'
import { Button, Select } from '../common'
import { RotateCcw, Grid3X3, Eye, EyeOff } from 'lucide-react'

export function CameraControls() {
  const {
    selectedLens,
    setSelectedLens,
    cameraPosition,
    cameraRotation,
    showGrid,
    showHUD,
    toggleGrid,
    toggleHUD,
    resetCamera,
  } = useCameraExplorerStore()

  const currentLens = getLensPreset(selectedLens)

  return (
    <div className="space-y-4">
      {/* Lens Selection */}
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Lens Preset
        </label>
        <div className="grid grid-cols-5 gap-1">
          {LENS_OPTIONS.map((lens) => (
            <button
              key={lens.id}
              onClick={() => setSelectedLens(lens.id)}
              className={`
                px-2 py-2 rounded text-center text-sm font-mono transition-all
                ${
                  selectedLens === lens.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-studio-surface text-white/60 hover:bg-studio-elevated hover:text-white'
                }
              `}
              title={`${lens.focalLength}mm - ${lens.name}\n${lens.description}`}
            >
              {lens.focalLength}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">
          {currentLens.name} — {currentLens.description}
        </p>
      </div>

      {/* Camera Info */}
      <div className="bg-studio-surface rounded-lg p-3">
        <div className="text-xs text-white/40 mb-2">Camera Position</div>
        <div className="grid grid-cols-3 gap-2 font-mono text-sm">
          <div className="text-center">
            <div className="text-white/40 text-xs">X</div>
            <div className="text-white">{cameraPosition.x.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Y</div>
            <div className="text-white">{cameraPosition.y.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Z</div>
            <div className="text-white">{cameraPosition.z.toFixed(2)}</div>
          </div>
        </div>

        <div className="text-xs text-white/40 mt-3 mb-2">Camera Rotation</div>
        <div className="grid grid-cols-3 gap-2 font-mono text-sm">
          <div className="text-center">
            <div className="text-white/40 text-xs">Pitch</div>
            <div className="text-white">{cameraRotation.x.toFixed(1)}°</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Yaw</div>
            <div className="text-white">{cameraRotation.y.toFixed(1)}°</div>
          </div>
          <div className="text-center">
            <div className="text-white/40 text-xs">Roll</div>
            <div className="text-white">{cameraRotation.z.toFixed(1)}°</div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleGrid}
          className="flex-1"
        >
          <Grid3X3 className="w-4 h-4 mr-1" />
          Grid {showGrid ? 'On' : 'Off'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleHUD}
          className="flex-1"
        >
          {showHUD ? (
            <Eye className="w-4 h-4 mr-1" />
          ) : (
            <EyeOff className="w-4 h-4 mr-1" />
          )}
          HUD
        </Button>
        <Button variant="secondary" size="sm" onClick={resetCamera}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
