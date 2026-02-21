import { useState } from 'react'
import { FileText, Wand2, Upload, Plus } from 'lucide-react'
import { useProjectStore, useUIStore } from '@/lib/store'
import { Button, Textarea, EmptyState, Card } from '../common'
import { Panel, PanelHeader, PanelContent, SplitView } from '../layout'
import { SceneList } from './SceneList'
import { SceneBreakdown } from './SceneBreakdown'

export function ScriptPage() {
  const { currentProject, updateProject, addScene } = useProjectStore()
  const { addNotification } = useUIStore()
  const [script, setScript] = useState(currentProject?.script || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedScene, setSelectedScene] = useState(null)

  const handleSaveScript = async () => {
    await updateProject({ script })
    addNotification({
      type: 'success',
      message: 'Script saved',
    })
  }

  const handleAnalyzeScript = async () => {
    if (!script.trim()) {
      addNotification({
        type: 'warning',
        message: 'Please enter a script to analyze',
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // Mock AI analysis - in real implementation, this would call Claude API
      const mockScenes = parseScriptMock(script)

      await updateProject({
        script,
        scenes: mockScenes,
      })

      addNotification({
        type: 'success',
        message: `Analyzed script: found ${mockScenes.length} scenes`,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Analysis failed: ${error.message}`,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddScene = async () => {
    const scene = await addScene()
    setSelectedScene(scene)
  }

  const hasScenes = currentProject?.scenes?.length > 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {hasScenes ? (
        <SplitView
          left={
            <div className="h-full flex flex-col">
              <Panel className="flex-1 flex flex-col border-0 rounded-none">
                <PanelHeader
                  title="Script"
                  actions={
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={handleSaveScript}>
                        Save
                      </Button>
                      <Button size="sm" onClick={handleAnalyzeScript} loading={isAnalyzing}>
                        <Wand2 className="w-4 h-4" />
                        Re-analyze
                      </Button>
                    </div>
                  }
                />
                <div className="flex-1 p-4 overflow-hidden">
                  <Textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Paste your script here..."
                    className="h-full font-mono text-sm"
                    variant="dark"
                  />
                </div>
              </Panel>
            </div>
          }
          right={
            <div className="h-full flex">
              {/* Scene list */}
              <div className="w-64 border-r border-studio-border">
                <SceneList
                  scenes={currentProject?.scenes || []}
                  selectedScene={selectedScene}
                  onSelectScene={setSelectedScene}
                  onAddScene={handleAddScene}
                />
              </div>

              {/* Scene breakdown */}
              <div className="flex-1">
                {selectedScene ? (
                  <SceneBreakdown scene={selectedScene} />
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Select a scene"
                    description="Choose a scene from the list to view and edit its breakdown"
                    className="h-full"
                  />
                )}
              </div>
            </div>
          }
          defaultLeftWidth={500}
          minLeftWidth={300}
          maxLeftWidth={800}
        />
      ) : (
        <div className="flex-1 flex flex-col p-6">
          <Panel className="flex-1 flex flex-col">
            <PanelHeader
              title="Import Script"
              actions={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </Button>
                </div>
              }
            />
            <PanelContent className="flex-1 flex flex-col">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your script here, or upload a file...

Example format:

INT. COFFEE SHOP - DAY

SARAH (30s, determined) sits alone at a corner table, laptop open but ignored. She stares out the window.

SARAH
(to herself)
This has to work.

A BARISTA approaches with coffee.

BARISTA
Refill?

SARAH
Please. Thank you.

The barista leaves. Sarah turns back to her laptop, takes a deep breath, and begins typing furiously."
                className="flex-1 font-mono text-sm resize-none"
                variant="dark"
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-studio-border">
                <p className="text-sm text-white/50">
                  Supports Final Draft format, plain text, and PDF
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleAddScene}
                  >
                    <Plus className="w-4 h-4" />
                    Manual Scene
                  </Button>
                  <Button
                    onClick={handleAnalyzeScript}
                    loading={isAnalyzing}
                    disabled={!script.trim()}
                  >
                    <Wand2 className="w-4 h-4" />
                    Analyze Script
                  </Button>
                </div>
              </div>
            </PanelContent>
          </Panel>
        </div>
      )}
    </div>
  )
}

// Mock script parser - would be replaced with actual LLM parsing
function parseScriptMock(script) {
  const scenes = []
  const lines = script.split('\n')
  let currentScene = null

  const sceneHeadingRegex = /^(INT\.|EXT\.|INT\/EXT\.)\s+(.+?)\s*[-–]\s*(\w+)/i

  for (const line of lines) {
    const match = line.match(sceneHeadingRegex)
    if (match) {
      if (currentScene) {
        scenes.push(currentScene)
      }
      currentScene = {
        id: crypto.randomUUID(),
        sceneNumber: scenes.length + 1,
        location: match[2].trim(),
        timeOfDay: match[3].toLowerCase(),
        mood: '',
        description: '',
        dialogueLines: [],
        shots: [],
      }
    } else if (currentScene && line.trim()) {
      currentScene.description += line.trim() + ' '
    }
  }

  if (currentScene) {
    scenes.push(currentScene)
  }

  // If no scenes found, create a default one
  if (scenes.length === 0) {
    scenes.push({
      id: crypto.randomUUID(),
      sceneNumber: 1,
      location: 'LOCATION',
      timeOfDay: 'day',
      mood: '',
      description: script.substring(0, 200),
      dialogueLines: [],
      shots: [],
    })
  }

  return scenes
}
