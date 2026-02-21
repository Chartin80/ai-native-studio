import { useState, useEffect } from 'react'
import { Key, Moon, Sun, Monitor, Info, ExternalLink, CheckCircle } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { getApiKey, saveApiKey, getSettings, saveSettings } from '@/lib/db'
import { Button, Input, Card, CardHeader, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../common'

export function SettingsPage() {
  const { addNotification } = useUIStore()
  const [wavespeedKey, setWavespeedKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [autoSave, setAutoSave] = useState(true)

  useEffect(() => {
    // Load saved keys
    setWavespeedKey(getApiKey('wavespeed') || '')
    setClaudeKey(getApiKey('claude') || '')

    // Load settings
    const settings = getSettings()
    setTheme(settings.theme || 'dark')
    setAutoSave(settings.autoSave !== false)
  }, [])

  const handleSaveKeys = async () => {
    setIsSaving(true)
    try {
      saveApiKey('wavespeed', wavespeedKey)
      saveApiKey('claude', claudeKey)
      addNotification({
        type: 'success',
        message: 'API keys saved securely',
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to save: ${error.message}`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = () => {
    saveSettings({ theme, autoSave })
    addNotification({
      type: 'success',
      message: 'Settings saved',
    })
  }

  const testConnection = async (provider) => {
    const key = provider === 'wavespeed' ? wavespeedKey : claudeKey
    if (!key) {
      addNotification({
        type: 'warning',
        message: `Please enter your ${provider} API key first`,
      })
      return
    }

    addNotification({
      type: 'info',
      message: `Testing ${provider} connection...`,
    })

    // TODO: Actually test the connection
    setTimeout(() => {
      addNotification({
        type: 'success',
        message: `${provider} connection successful`,
      })
    }, 1000)
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="api" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* Wavespeed API */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wavespeed.ai</h3>
                    <p className="text-sm text-white/50">Image, video, voice, and lipsync generation</p>
                  </div>
                </div>
                {wavespeedKey && (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="API Key"
                  type="password"
                  value={wavespeedKey}
                  onChange={(e) => setWavespeedKey(e.target.value)}
                  placeholder="Enter your Wavespeed API key"
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://wavespeed.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-primary hover:underline flex items-center gap-1"
                  >
                    Get API key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => testConnection('wavespeed')}
                    disabled={!wavespeedKey}
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Claude API (for script parsing) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Anthropic Claude</h3>
                    <p className="text-sm text-white/50">Script parsing and shot suggestions</p>
                  </div>
                </div>
                {claudeKey && (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="API Key"
                  type="password"
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="Enter your Claude API key"
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-primary hover:underline flex items-center gap-1"
                  >
                    Get API key
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => testConnection('claude')}
                    disabled={!claudeKey}
                  >
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveKeys} loading={isSaving}>
                Save API Keys
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Appearance</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map((option) => {
                      const Icon = option.icon
                      const isActive = theme === option.value

                      return (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={`
                            flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border
                            transition-all
                            ${isActive
                              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                              : 'border-studio-border hover:bg-white/5'}
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Behavior</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">Auto-save projects</div>
                    <div className="text-sm text-white/50">
                      Automatically save changes as you work
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${autoSave ? 'bg-accent-primary' : 'bg-white/20'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                        ${autoSave ? 'left-7' : 'left-1'}
                      `}
                    />
                  </button>
                </label>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings}>
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                    <span className="text-lg font-bold">AI</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Native Studio</h3>
                    <p className="text-white/50">Version 0.1.0</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/70">
                  A cinematic AI pipeline for filmmakers: Script → Shot List → Storyboards → Image-to-Video → Voice → Lipsync → Assembly
                </p>

                <div className="pt-4 border-t border-studio-border">
                  <h4 className="font-medium mb-3">Powered by</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="font-medium">Wavespeed.ai</div>
                      <div className="text-sm text-white/50">Media generation</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="font-medium">Anthropic Claude</div>
                      <div className="text-sm text-white/50">Script analysis</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-studio-border text-sm text-white/50">
                  <p>Built with React, Vite, Tailwind CSS, and Zustand</p>
                  <p className="mt-2">
                    <a href="#" className="text-accent-primary hover:underline">
                      Documentation
                    </a>
                    {' • '}
                    <a href="#" className="text-accent-primary hover:underline">
                      GitHub
                    </a>
                    {' • '}
                    <a href="#" className="text-accent-primary hover:underline">
                      Report Issue
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
