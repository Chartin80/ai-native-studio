import { Plus, MapPin, Sun, Moon, Sunset } from 'lucide-react'
import { Button } from '../common'

const timeIcons = {
  day: Sun,
  night: Moon,
  dusk: Sunset,
  dawn: Sunset,
}

export function SceneList({ scenes, selectedScene, onSelectScene, onAddScene }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border">
        <h3 className="font-medium">Scenes</h3>
        <Button variant="ghost" size="sm" onClick={onAddScene}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {scenes.map((scene) => {
          const TimeIcon = timeIcons[scene.timeOfDay] || Sun
          const isSelected = selectedScene?.id === scene.id

          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene)}
              className={`
                w-full text-left px-4 py-3 border-b border-studio-border/50
                transition-colors
                ${isSelected
                  ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary'
                  : 'hover:bg-white/5'}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/50">
                  Scene {scene.sceneNumber}
                </span>
                <TimeIcon className="w-3 h-3 text-white/40" />
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="w-3 h-3 text-white/40 flex-shrink-0" />
                <span className="truncate">{scene.location || 'Untitled'}</span>
              </div>
              {scene.shots?.length > 0 && (
                <div className="text-xs text-white/40 mt-1">
                  {scene.shots.length} shots
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
