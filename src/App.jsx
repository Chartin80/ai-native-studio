import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { initDB } from './lib/db'

// Layout components
import { AppLayout } from './components/layout/AppLayout'
import { ProjectLayout } from './components/layout/ProjectLayout'

// Page components
import { Dashboard } from './components/dashboard'
import { ScriptPage } from './components/script'
import { StoryboardPage } from './components/storyboard'
import { FramesPage } from './components/frames'
import { ShotsPage } from './components/shots'
import { VideoPage } from './components/video'
import { VoicePage } from './components/voice'
import { AssemblyPage } from './components/assembly'
import { SettingsPage } from './components/settings'
import { CameraExplorerPage } from './components/camera-explorer'

export default function App() {
  // Initialize IndexedDB on app start
  useEffect(() => {
    initDB().catch(console.error)
  }, [])

  return (
    <Routes>
      {/* Main app layout */}
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Project routes */}
        <Route path="/project/:id" element={<ProjectLayout />}>
          {/* Redirect to script by default */}
          <Route index element={<Navigate to="script" replace />} />

          {/* Project pages */}
          <Route path="script" element={<ScriptPage />} />
          <Route path="storyboard" element={<StoryboardPage />} />
          <Route path="frames" element={<FramesPage />} />
          <Route path="shots" element={<ShotsPage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="voice" element={<VoicePage />} />
          <Route path="assembly" element={<AssemblyPage />} />
          <Route path="camera" element={<CameraExplorerPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
