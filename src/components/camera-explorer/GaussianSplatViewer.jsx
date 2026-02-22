/**
 * GaussianSplatViewer - 3D Gaussian Splat renderer using Three.js
 *
 * Loads and displays .ply files from ml-sharp reconstruction
 * Provides orbit controls and camera position tracking
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { getThreeFOV, getLensFromShortcut } from '../../lib/camera/lensPresets'
import { CameraHUD } from './CameraHUD'

export function GaussianSplatViewer({ plyUrl, onCaptureRef }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')

  const {
    selectedLens,
    setSelectedLens,
    updateCameraPosition,
    updateCameraRotation,
    showGrid,
    showHUD,
    toggleGrid,
    toggleHUD,
    resetCamera,
    captureSnapshot,
  } = useCameraExplorerStore()

  // Capture current view as image
  const captureView = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current) return null

    const renderer = rendererRef.current
    const camera = cameraRef.current

    // Force render
    if (viewerRef.current) {
      viewerRef.current.update()
    }

    const dataUrl = renderer.domElement.toDataURL('image/png')

    const snapshot = captureSnapshot(dataUrl, {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z,
      },
    })

    return snapshot
  }, [captureSnapshot])

  // Expose capture function to parent
  useEffect(() => {
    if (onCaptureRef) {
      onCaptureRef.current = captureView
    }
  }, [captureView, onCaptureRef])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Lens shortcuts (1-5)
      const lens = getLensFromShortcut(e.key)
      if (lens) {
        setSelectedLens(lens)
        return
      }

      // Other shortcuts
      switch (e.key.toLowerCase()) {
        case 'g':
          toggleGrid()
          break
        case 'h':
          toggleHUD()
          break
        case 'r':
          resetCamera()
          if (cameraRef.current) {
            cameraRef.current.position.set(0, 0, 5)
            cameraRef.current.rotation.set(0, 0, 0)
          }
          break
        case ' ':
          e.preventDefault()
          captureView()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSelectedLens, toggleGrid, toggleHUD, resetCamera, captureView])

  // Update FOV when lens changes
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = getThreeFOV(selectedLens)
      cameraRef.current.updateProjectionMatrix()
    }
  }, [selectedLens])

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || !plyUrl) return

    setIsLoading(true)
    setLoadError(null)

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Debug: log PLY URL type
    console.log('Loading PLY from:', plyUrl.substring(0, 50) + '...')
    setDebugInfo(`Loading scene...`)

    // Create GaussianSplats3D viewer
    // Note: The viewer creates its own renderer and camera internally
    try {
      const viewer = new GaussianSplats3D.Viewer({
        // Start camera further back to see the full scene
        cameraUp: [0, 1, 0],
        initialCameraPosition: [0, 0, 5],   // Further back
        initialCameraLookAt: [0, 0, 0],     // Look at origin

        // Rendering quality
        antialiased: true,
        sphericalHarmonicsDegree: 2,

        // Compatibility settings
        sharedMemoryForWorkers: false,

        // Controls
        selfDrivenMode: true,
        useBuiltInControls: true,

        // Render settings
        gpuAcceleratedSort: true,

        // Enable preserveDrawingBuffer for screenshot capture
        renderMode: GaussianSplats3D.RenderMode.Always,
      })
      viewerRef.current = viewer

      // Get the renderer and camera from the viewer
      rendererRef.current = viewer.renderer
      cameraRef.current = viewer.camera

      // Mount viewer's renderer to container (only one canvas!)
      container.appendChild(viewer.renderer.domElement)
      viewer.renderer.setSize(width, height)
      viewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      // Configure orbit controls
      if (viewer.controls) {
        viewer.controls.enableDamping = true
        viewer.controls.dampingFactor = 0.1
        viewer.controls.rotateSpeed = 0.5
        viewer.controls.zoomSpeed = 1.2
        viewer.controls.panSpeed = 0.8
        viewer.controls.enablePan = true
      }

      setDebugInfo('Loading 3D scene...')

      // Load PLY file - specify format explicitly for blob URLs
      const loadOptions = {
        splatAlphaRemovalThreshold: 5,  // Lower = more splats visible
        showLoadingUI: false,
        format: GaussianSplats3D.SceneFormat.Ply,
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
      }

      // If blob URL, we need to add .ply hint for the library
      let loadUrl = plyUrl
      if (plyUrl.startsWith('blob:')) {
        loadUrl = plyUrl + '#scene.ply'
      }

      console.log('Loading with URL:', loadUrl)

      viewer
        .addSplatScene(loadUrl, loadOptions)
        .then(() => {
          console.log('PLY loaded successfully')
          console.log('Splat count:', viewer.splatMesh?.getSplatCount?.() || 'unknown')
          setDebugInfo('Use mouse to orbit, scroll to zoom, right-click to pan')
          setIsLoading(false)

          // Start rendering
          viewer.start()

          // Log camera position for debugging
          if (viewer.camera) {
            console.log('Camera position:', viewer.camera.position)
          }
        })
        .catch((error) => {
          console.error('Failed to load PLY:', error)
          setLoadError(error.message || 'Failed to load 3D scene')
          setDebugInfo(`Error: ${error.message}`)
          setIsLoading(false)
        })
    } catch (error) {
      console.error('Failed to create viewer:', error)
      setLoadError(error.message || 'Failed to create 3D viewer')
      setDebugInfo(`Viewer error: ${error.message}`)
      setIsLoading(false)
    }

    // Animation loop to track camera position
    const updateCameraState = () => {
      if (cameraRef.current) {
        const pos = cameraRef.current.position
        const rot = cameraRef.current.rotation
        updateCameraPosition({
          x: parseFloat(pos.x.toFixed(2)),
          y: parseFloat(pos.y.toFixed(2)),
          z: parseFloat(pos.z.toFixed(2)),
        })
        updateCameraRotation({
          x: parseFloat(THREE.MathUtils.radToDeg(rot.x).toFixed(1)),
          y: parseFloat(THREE.MathUtils.radToDeg(rot.y).toFixed(1)),
          z: parseFloat(THREE.MathUtils.radToDeg(rot.z).toFixed(1)),
        })
      }
      animationFrameRef.current = requestAnimationFrame(updateCameraState)
    }
    updateCameraState()

    // Handle resize - use viewer's renderer and camera
    const handleResize = () => {
      if (!containerRef.current || !viewerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (viewerRef.current.renderer) {
        viewerRef.current.renderer.setSize(w, h)
      }
      if (viewerRef.current.camera) {
        viewerRef.current.camera.aspect = w / h
        viewerRef.current.camera.updateProjectionMatrix()
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose()
        } catch (e) {
          console.warn('Viewer dispose error:', e)
        }
      }
      // Clear container
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    }
  }, [plyUrl]) // Only re-init when PLY URL changes

  return (
    <div className="relative w-full h-full bg-studio-bg">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading 3D scene...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/80">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="text-accent-error text-lg">Failed to load 3D scene</div>
            <p className="text-sm text-white/60 max-w-md">{loadError}</p>
          </div>
        </div>
      )}

      {/* Grid Overlay */}
      {showGrid && !isLoading && !loadError && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Rule of thirds */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          {/* Center crosshair */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-px bg-white/40" />
            <div className="w-px h-8 bg-white/40 -mt-4 ml-4" />
          </div>
        </div>
      )}

      {/* HUD Overlay */}
      {showHUD && !isLoading && !loadError && <CameraHUD />}

      {/* Debug Info */}
      {debugInfo && (
        <div className="absolute top-2 left-2 bg-black/80 text-white/60 text-xs px-2 py-1 rounded font-mono">
          {debugInfo}
        </div>
      )}
    </div>
  )
}
