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
  const [splatCount, setSplatCount] = useState(0)

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

  // Inspect PLY file format
  const inspectPlyFile = async (url) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const text = await blob.slice(0, 2000).text() // Read first 2KB as text

      console.log('=== PLY File Header ===')
      console.log(text)

      // Check for Gaussian Splat properties
      const hasGaussianProps = text.includes('f_dc_0') || text.includes('scale_0') || text.includes('rot_0')
      const hasOpacity = text.includes('opacity')
      const vertexMatch = text.match(/element vertex (\d+)/)
      const vertexCount = vertexMatch ? parseInt(vertexMatch[1]) : 0

      console.log('Has Gaussian properties:', hasGaussianProps)
      console.log('Has opacity:', hasOpacity)
      console.log('Vertex count:', vertexCount)

      return { hasGaussianProps, hasOpacity, vertexCount, header: text }
    } catch (e) {
      console.error('Failed to inspect PLY:', e)
      return null
    }
  }

  // Initialize viewer using DropInViewer for simplicity
  useEffect(() => {
    if (!containerRef.current || !plyUrl) return

    setIsLoading(true)
    setLoadError(null)
    setSplatCount(0)

    const container = containerRef.current

    // Debug: log PLY URL type
    console.log('=== GaussianSplatViewer Debug ===')
    console.log('PLY URL:', plyUrl.substring(0, 100) + '...')
    console.log('Container size:', container.clientWidth, 'x', container.clientHeight)
    setDebugInfo('Inspecting PLY format...')

    // First inspect the PLY file to understand its format
    inspectPlyFile(plyUrl).then((info) => {
      if (info) {
        if (!info.hasGaussianProps) {
          setDebugInfo(`PLY has ${info.vertexCount} vertices but NO Gaussian Splat properties. Format incompatible.`)
          setLoadError('PLY file is not in Gaussian Splat format. ml-sharp may output a different format.')
          setIsLoading(false)
          return
        }
        setDebugInfo(`PLY has ${info.vertexCount} Gaussian splats. Loading...`)
      }
    })

    // Build the load URL - append .ply hint for blob URLs
    let loadUrl = plyUrl
    if (plyUrl.startsWith('blob:')) {
      // Use hash fragment, not query string
      loadUrl = plyUrl + '#.ply'
    }

    console.log('Final load URL:', loadUrl)

    try {
      // Use DropInViewer - simpler and more reliable
      const viewer = new GaussianSplats3D.DropInViewer({
        // Use progressive loading for better UX
        progressiveLoad: true,
        // Quality settings
        sphericalHarmonicsDegree: 0,  // Start with 0 for compatibility
        // Compatibility
        sharedMemoryForWorkers: false,
        // Initial camera - start further back
        initialCameraPosition: [0, 0, 10],
        initialCameraLookAt: [0, 0, 0],
      })

      viewerRef.current = viewer

      // Add the splat scene
      console.log('Adding splat scene from:', loadUrl)
      setDebugInfo('Loading splat data...')

      viewer.addSplatScenes([{
        path: loadUrl,
        format: GaussianSplats3D.SceneFormat.Ply,
        splatAlphaRemovalThreshold: 1, // Lower = keep more splats
      }])
        .then(() => {
          console.log('Splat scene added successfully!')

          // Get references after loading
          if (viewer.viewer) {
            rendererRef.current = viewer.viewer.renderer
            cameraRef.current = viewer.viewer.camera

            const count = viewer.viewer.splatMesh?.getSplatCount?.() || 0
            console.log('Splat count:', count)
            setSplatCount(count)

            // Also log the scene bounds
            const mesh = viewer.viewer.splatMesh
            if (mesh && mesh.geometry) {
              mesh.geometry.computeBoundingSphere()
              const sphere = mesh.geometry.boundingSphere
              console.log('Scene center:', sphere?.center)
              console.log('Scene radius:', sphere?.radius)
            }

            if (count === 0) {
              setDebugInfo('Warning: 0 splats loaded - PLY may be empty or incompatible')
            } else {
              setDebugInfo(`Loaded ${count.toLocaleString()} splats. Use mouse to navigate.`)
            }
          }

          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Failed to add splat scene:', error)
          setLoadError(error.message || 'Failed to load splat scene')
          setDebugInfo(`Load error: ${error.message}`)
          setIsLoading(false)
        })

      // Mount to container
      container.appendChild(viewer.renderer.domElement)

      // Store refs immediately (before scene loads)
      rendererRef.current = viewer.renderer
      cameraRef.current = viewer.camera

      console.log('Viewer mounted to container')

    } catch (error) {
      console.error('Failed to create viewer:', error)
      setLoadError(error.message || 'Failed to create viewer')
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

    // Cleanup
    return () => {
      console.log('Cleaning up viewer...')
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
      {(debugInfo || splatCount > 0) && (
        <div className="absolute top-2 left-2 bg-black/80 text-white/60 text-xs px-2 py-1 rounded font-mono space-y-1">
          {debugInfo && <div>{debugInfo}</div>}
          {splatCount > 0 && (
            <div className="text-accent-primary">
              Splats: {splatCount.toLocaleString()}
            </div>
          )}
          {plyUrl && (
            <button
              onClick={() => {
                const a = document.createElement('a')
                a.href = plyUrl
                a.download = 'scene.ply'
                a.click()
              }}
              className="text-blue-400 hover:text-blue-300 underline pointer-events-auto"
            >
              Download PLY
            </button>
          )}
        </div>
      )}
    </div>
  )
}
