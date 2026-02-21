import { useMemo } from 'react'
import { Camera, Check } from 'lucide-react'
import { useProjectStore } from '@/lib/store'

export function ShotSelector() {
  const { currentProject, currentScene, currentShot, setCurrentShot } = useProjectStore()

  // Flatten all shots with scene info
  const allShots = useMemo(() => {
    if (!currentProject?.scenes) return []
    return currentProject.scenes.flatMap((scene) =>
      (scene.shots || []).map((shot) => ({
        ...shot,
        scene,
      }))
    )
  }, [currentProject?.scenes])

  return (
    <div className="border-b border-studio-border">
      <div className="px-4 py-3 border-b border-studio-border">
        <h3 className="font-medium text-sm text-white/70">Select Shot</h3>
      </div>
      <div className="max-h-48 overflow-auto">
        {allShots.length > 0 ? (
          allShots.map((shot) => {
            const isSelected = currentShot?.id === shot.id
            const hasKeyframes = shot.keyframes?.length > 0

            return (
              <button
                key={shot.id}
                onClick={() => setCurrentShot(shot.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left
                  border-b border-studio-border/50 transition-colors
                  ${isSelected
                    ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
                    : 'hover:bg-white/5'}
                `}
              >
                {/* Thumbnail */}
                <div className="w-12 h-8 bg-white/5 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {hasKeyframes ? (
                    <img
                      src={shot.keyframes[0].url || shot.keyframes[0].outputs?.[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-4 h-4 text-white/20" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    Scene {shot.scene.sceneNumber} / Shot {shot.shotNumber}
                  </div>
                  <div className="text-xs text-white/40 truncate">
                    {shot.shotType || 'wide'} • {shot.keyframes?.length || 0} keyframes
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && <Check className="w-4 h-4 text-accent-primary" />}
              </button>
            )
          })
        ) : (
          <div className="px-4 py-8 text-center text-white/40">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shots in project</p>
          </div>
        )}
      </div>
    </div>
  )
}
