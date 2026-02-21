import { useState, useMemo } from 'react'
import { Mic2, Wand2, Play, Pause, Users } from 'lucide-react'
import { useProjectStore, useUIStore, useGenerationStore } from '@/lib/store'
import { getModelSchema, getDefaultModel } from '@/lib/models'
import { Button, Textarea, Select, ModelSelector, EmptyState, ProgressBar, Input } from '../common'
import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { CharacterVoices } from './CharacterVoices'
import { AudioTakesGrid } from './AudioTakesGrid'

export function VoicePage() {
  const { currentProject, currentScene, currentShot, addAudioTake, addCharacter } = useProjectStore()
  const { addNotification } = useUIStore()
  const { generateVoice, activeTasks } = useGenerationStore()

  const [text, setText] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [selectedModelId, setSelectedModelId] = useState(() => getDefaultModel('voice')?.id)
  const [selectedVoice, setSelectedVoice] = useState('zephyr')
  const [emotion, setEmotion] = useState('neutral')
  const [pace, setPace] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)

  const modelSchema = useMemo(
    () => getModelSchema(selectedModelId) || {},
    [selectedModelId]
  )

  const currentTask = activeTasks.find(
    (t) => t.type === 'voice' && t.shotId === currentShot?.id
  )

  const handleGenerate = async () => {
    if (!text.trim()) {
      addNotification({
        type: 'warning',
        message: 'Please enter text to generate',
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateVoice({
        projectId: currentProject.id,
        sceneId: currentScene?.id,
        shotId: currentShot?.id,
        modelId: selectedModelId,
        text,
        voice: selectedVoice,
        emotion,
        pace,
      })

      // Add audio take
      if (result.outputs?.length > 0) {
        if (currentShot && currentScene) {
          await addAudioTake(currentScene.id, currentShot.id, {
            url: result.outputs[0],
            text,
            characterId: selectedCharacter?.id,
            modelId: selectedModelId,
            settings: { voice: selectedVoice, emotion, pace },
          })
        }
      }

      addNotification({
        type: 'success',
        message: 'Voice generated successfully',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Generation failed: ${error.message}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddCharacter = async () => {
    const name = prompt('Enter character name:')
    if (name) {
      await addCharacter({ name, role: '' })
      addNotification({
        type: 'success',
        message: `Character "${name}" added`,
      })
    }
  }

  const voiceOptions = (modelSchema.voices || []).map((v) => ({
    value: v.id,
    label: v.name,
    description: `${v.gender} • ${v.style}`,
  }))

  const emotionOptions = (modelSchema.emotions || ['neutral', 'happy', 'sad', 'angry']).map(
    (e) => ({
      value: e,
      label: e.charAt(0).toUpperCase() + e.slice(1),
    })
  )

  const paceOptions = [
    { value: 0.5, label: 'Very Slow (0.5x)' },
    { value: 0.75, label: 'Slow (0.75x)' },
    { value: 1.0, label: 'Normal (1x)' },
    { value: 1.25, label: 'Fast (1.25x)' },
    { value: 1.5, label: 'Very Fast (1.5x)' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SplitView
        left={
          <div className="h-full flex flex-col">
            {/* Character voices */}
            <CharacterVoices
              characters={currentProject?.characters || []}
              selectedCharacter={selectedCharacter}
              onSelectCharacter={setSelectedCharacter}
              onAddCharacter={handleAddCharacter}
            />

            {/* Generation controls */}
            <Panel className="flex-1 flex flex-col border-0 rounded-none border-t border-studio-border">
              <PanelHeader title="Generate Voice" />
              <PanelContent className="flex-1 overflow-auto space-y-4">
                {/* Model selector */}
                <ModelSelector
                  category="voice"
                  value={selectedModelId}
                  onChange={setSelectedModelId}
                  label="Model"
                />

                {/* Voice selector */}
                <Select
                  label="Voice"
                  options={voiceOptions}
                  value={selectedVoice}
                  onChange={setSelectedVoice}
                />

                {/* Emotion and pace */}
                <div className="grid grid-cols-2 gap-3">
                  {modelSchema.supportsEmotion && (
                    <Select
                      label="Emotion"
                      options={emotionOptions}
                      value={emotion}
                      onChange={setEmotion}
                    />
                  )}
                  {modelSchema.supportsPace && (
                    <Select
                      label="Pace"
                      options={paceOptions}
                      value={pace}
                      onChange={setPace}
                    />
                  )}
                </div>

                {/* Text input */}
                <Textarea
                  label="Dialogue / Text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to convert to speech..."
                  rows={5}
                />

                {/* Progress */}
                {currentTask && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Generating voice...</span>
                      <span className="text-white/60">{currentTask.progress || 0}%</span>
                    </div>
                    <ProgressBar value={currentTask.progress || 0} />
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  loading={isGenerating}
                  disabled={!text.trim()}
                  className="w-full"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Voice
                </Button>
              </PanelContent>
            </Panel>
          </div>
        }
        right={
          <div className="h-full flex flex-col">
            <Panel className="flex-1 flex flex-col border-0 rounded-none">
              <PanelHeader
                title={currentShot ? `Audio Takes (${currentShot.audioTakes?.length || 0})` : 'Audio Takes'}
              />
              <PanelContent className="flex-1 overflow-auto">
                {currentShot?.audioTakes?.length > 0 ? (
                  <AudioTakesGrid
                    takes={currentShot.audioTakes}
                    selectedTake={currentShot.selectedAudio}
                    characters={currentProject?.characters || []}
                    onSelect={(take) => {
                      // TODO: Update selected audio
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={Mic2}
                    title="No audio takes yet"
                    description="Generate voice clips using the controls on the left"
                    className="h-full"
                  />
                )}
              </PanelContent>
            </Panel>
          </div>
        }
        defaultLeftWidth={380}
        minLeftWidth={300}
        maxLeftWidth={500}
      />
    </div>
  )
}
