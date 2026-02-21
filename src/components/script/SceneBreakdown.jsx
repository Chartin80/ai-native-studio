import { useState } from 'react'
import { Plus, Wand2, Camera, Users } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { Button, Input, Textarea, Select, Badge } from '../common'
import { Panel, PanelHeader, PanelContent } from '../layout'

const timeOptions = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'dusk', label: 'Dusk' },
]

const shotTypes = [
  { value: 'wide', label: 'Wide Shot' },
  { value: 'medium', label: 'Medium Shot' },
  { value: 'close', label: 'Close Up' },
  { value: 'extreme-close', label: 'Extreme Close Up' },
  { value: 'over-shoulder', label: 'Over the Shoulder' },
  { value: 'pov', label: 'POV' },
  { value: 'two-shot', label: 'Two Shot' },
  { value: 'establishing', label: 'Establishing Shot' },
]

export function SceneBreakdown({ scene }) {
  const { updateScene, addShot, currentProject } = useProjectStore()
  const { addNotification } = useUIStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleUpdateScene = (updates) => {
    updateScene(scene.id, updates)
  }

  const handleAddShot = async () => {
    await addShot(scene.id)
    addNotification({
      type: 'success',
      message: 'Shot added',
    })
  }

  const handleGenerateShots = async () => {
    setIsGenerating(true)
    try {
      // Mock AI shot generation - would call Claude API
      const mockShots = generateMockShots(scene)
      handleUpdateScene({ shots: [...(scene.shots || []), ...mockShots] })
      addNotification({
        type: 'success',
        message: `Generated ${mockShots.length} shots`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to generate shots: ${error.message}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Panel className="flex-1 flex flex-col border-0 rounded-none">
        <PanelHeader
          title={`Scene ${scene.sceneNumber}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleAddShot}>
                <Plus className="w-4 h-4" />
                Add Shot
              </Button>
              <Button size="sm" onClick={handleGenerateShots} loading={isGenerating}>
                <Wand2 className="w-4 h-4" />
                Generate Shots
              </Button>
            </div>
          }
        />

        <PanelContent className="flex-1 overflow-auto">
          {/* Scene details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Input
              label="Location"
              value={scene.location || ''}
              onChange={(e) => handleUpdateScene({ location: e.target.value })}
              placeholder="INT. COFFEE SHOP"
            />
            <Select
              label="Time of Day"
              options={timeOptions}
              value={scene.timeOfDay || 'day'}
              onChange={(value) => handleUpdateScene({ timeOfDay: value })}
            />
            <Input
              label="Mood"
              value={scene.mood || ''}
              onChange={(e) => handleUpdateScene({ mood: e.target.value })}
              placeholder="Tense, mysterious..."
            />
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Characters
              </label>
              <div className="flex flex-wrap gap-1">
                {currentProject?.characters?.map((char) => (
                  <Badge key={char.id} variant="default">
                    {char.name}
                  </Badge>
                )) || <span className="text-white/40 text-sm">No characters</span>}
              </div>
            </div>
          </div>

          <Textarea
            label="Description"
            value={scene.description || ''}
            onChange={(e) => handleUpdateScene({ description: e.target.value })}
            placeholder="Describe what happens in this scene..."
            rows={3}
          />

          {/* Shot list */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-white/50" />
                Shots ({scene.shots?.length || 0})
              </h4>
            </div>

            {scene.shots?.length > 0 ? (
              <div className="space-y-3">
                {scene.shots.map((shot, index) => (
                  <ShotCard
                    key={shot.id}
                    shot={shot}
                    index={index}
                    sceneId={scene.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No shots yet</p>
                <p className="text-sm">Add shots manually or generate with AI</p>
              </div>
            )}
          </div>
        </PanelContent>
      </Panel>
    </div>
  )
}

function ShotCard({ shot, index, sceneId }) {
  const { updateShot } = useProjectStore()

  const handleUpdate = (updates) => {
    updateShot(sceneId, shot.id, updates)
  }

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-studio-border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/50">
            Shot {index + 1}
          </span>
          <Badge variant="primary">{shot.shotType || 'wide'}</Badge>
        </div>
        {shot.keyframes?.length > 0 && (
          <Badge variant="success">
            {shot.keyframes.length} keyframes
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <Select
          options={shotTypes}
          value={shot.shotType || 'wide'}
          onChange={(value) => handleUpdate({ shotType: value })}
        />
        <Input
          placeholder="Camera angle"
          value={shot.cameraAngle || ''}
          onChange={(e) => handleUpdate({ cameraAngle: e.target.value })}
        />
        <Input
          placeholder="Lens (e.g., 35mm)"
          value={shot.lens || ''}
          onChange={(e) => handleUpdate({ lens: e.target.value })}
        />
      </div>

      <Textarea
        placeholder="Shot description..."
        value={shot.description || ''}
        onChange={(e) => handleUpdate({ description: e.target.value })}
        rows={2}
      />
    </div>
  )
}

// Mock shot generation
function generateMockShots(scene) {
  const shotTemplates = [
    { shotType: 'establishing', description: `Wide establishing shot of ${scene.location}` },
    { shotType: 'medium', description: 'Medium shot of main character entering' },
    { shotType: 'close', description: 'Close up reaction shot' },
    { shotType: 'over-shoulder', description: 'Over the shoulder dialogue coverage' },
    { shotType: 'wide', description: 'Wide master shot of the scene' },
  ]

  return shotTemplates.slice(0, 3).map((template, i) => ({
    id: crypto.randomUUID(),
    shotNumber: (scene.shots?.length || 0) + i + 1,
    ...template,
    cameraAngle: 'eye-level',
    lens: '35mm',
    movement: 'static',
    characters: [],
    keyframes: [],
    videoTakes: [],
    audioTakes: [],
  }))
}
