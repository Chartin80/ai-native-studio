/**
 * CameraHUD - Heads-up display overlay for 3D viewer
 * Shows camera info, lens, position, and keyboard shortcuts
 */

import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { getLensPreset, getHorizontalFOV } from '../../lib/camera/lensPresets'

export function CameraHUD() {
  const { selectedLens, cameraPosition, cameraRotation } = useCameraExplorerStore()

  const lens = getLensPreset(selectedLens)
  const fov = getHorizontalFOV(selectedLens)

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Row */}
      <div className="flex justify-between items-start">
        {/* Lens Info */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-accent-primary font-mono text-lg font-bold">
              {lens.focalLength}mm
            </span>
            <span className="text-white/60 text-sm">{lens.name}</span>
          </div>
          <div className="text-white/40 text-xs mt-0.5">
            FOV: {fov.toFixed(1)}°
          </div>
        </div>

        {/* Recording indicator style */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-error animate-pulse" />
          <span className="text-white/60 text-xs font-mono">LIVE</span>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-end">
        {/* Position/Rotation */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 font-mono text-xs">
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            <span className="text-white/40">X</span>
            <span className="text-white/40">Y</span>
            <span className="text-white/40">Z</span>
            <span className="text-white">{cameraPosition.x.toFixed(2)}</span>
            <span className="text-white">{cameraPosition.y.toFixed(2)}</span>
            <span className="text-white">{cameraPosition.z.toFixed(2)}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1">
            <span className="text-white/40">P</span>
            <span className="text-white/40">Y</span>
            <span className="text-white/40">R</span>
            <span className="text-white">{cameraRotation.x.toFixed(1)}°</span>
            <span className="text-white">{cameraRotation.y.toFixed(1)}°</span>
            <span className="text-white">{cameraRotation.z.toFixed(1)}°</span>
          </div>
        </div>

        {/* Controls Help */}
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
          <div className="text-white/50 mb-1 font-medium">Camera Controls</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-2">
            <span className="text-white/40">Drag</span>
            <span className="text-white/60">Look around</span>
            <span className="text-white/40">Scroll</span>
            <span className="text-white/60">Height</span>
            <span className="text-white/40">Arrows</span>
            <span className="text-white/60">Move</span>
          </div>
          <div className="text-white/50 mb-1 font-medium">Keyboard</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-white/40">1-6</span>
            <span className="text-white/60">Lens</span>
            <span className="text-white/40">Space</span>
            <span className="text-white/60">Capture</span>
            <span className="text-white/40">R</span>
            <span className="text-white/60">Reset</span>
          </div>
        </div>
      </div>
    </div>
  )
}
