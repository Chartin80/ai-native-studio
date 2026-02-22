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
  const [debugInfo, setDebugInfo] = useState('Initializing...')
  const [splatCount, setSplatCount] = useState(0)
  const [plyHeader, setPlyHeader] = useState('')

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

    console.log('========================================')
    console.log('GaussianSplatViewer MOUNTING')
    console.log('PLY URL:', plyUrl)
    console.log('========================================')

    setIsLoading(true)
    setLoadError(null)
    setSplatCount(0)
    setDebugInfo('Starting...')
    setPlyHeader('')

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    // Step 1: Fetch and inspect the PLY file
    const inspectAndLoad = async () => {
      try {
        // Fetch the PLY to inspect it
        setDebugInfo('Fetching PLY file...')
        console.log('Fetching PLY from:', plyUrl)

        const response = await fetch(plyUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch PLY: ${response.status}`)
        }

        const blob = await response.blob()
        console.log('PLY blob size:', blob.size, 'bytes')
        setDebugInfo(`PLY size: ${(blob.size / 1024).toFixed(1)} KB`)

        // Read header
        const headerText = await blob.slice(0, 3000).text()
        console.log('=== PLY HEADER ===')
        console.log(headerText)
        setPlyHeader(headerText.substring(0, 500))

        // Parse header info
        const vertexMatch = headerText.match(/element vertex (\d+)/)
        const vertexCount = vertexMatch ? parseInt(vertexMatch[1]) : 0
        const hasScale = headerText.includes('scale_0')
        const hasRot = headerText.includes('rot_0')
        const hasOpacity = headerText.includes('opacity')
        const hasSH = headerText.includes('f_dc_0')

        console.log('Vertex count:', vertexCount)
        console.log('Has scale:', hasScale)
        console.log('Has rotation:', hasRot)
        console.log('Has opacity:', hasOpacity)
        console.log('Has SH:', hasSH)

        if (vertexCount === 0) {
          throw new Error('PLY has 0 vertices')
        }

        const isGaussianFormat = hasScale && hasRot && hasOpacity
        if (!isGaussianFormat) {
          setDebugInfo(`PLY has ${vertexCount} vertices but missing Gaussian properties (scale/rot/opacity)`)
          console.warn('PLY may not be in Gaussian Splat format!')
        } else {
          setDebugInfo(`Valid Gaussian PLY: ${vertexCount.toLocaleString()} splats`)
        }

        // Create blob URL for the viewer
        const viewerBlobUrl = URL.createObjectURL(blob)

        // Now create the viewer
        console.log('Creating GaussianSplats3D.Viewer...')
        setDebugInfo('Creating 3D viewer...')

        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, 0],  // Try flipped Y
          initialCameraPosition: [0, 0, 3],
          initialCameraLookAt: [0, 0, 0],
          selfDrivenMode: true,
          useBuiltInControls: true,
          sharedMemoryForWorkers: false,
          dynamicScene: false,
          sphericalHarmonicsDegree: hasSH ? 0 : 0,
          antialiased: false,
          focalAdjustment: 1.0,
        })

        viewerRef.current = viewer
        rendererRef.current = viewer.renderer
        cameraRef.current = viewer.camera

        // Add to DOM
        container.appendChild(viewer.renderer.domElement)
        viewer.renderer.setSize(width, height)

        console.log('Loading splat scene...')
        setDebugInfo('Loading splat scene...')

        // Load the scene
        await viewer.addSplatScene(viewerBlobUrl, {
          format: GaussianSplats3D.SceneFormat.Ply,
          splatAlphaRemovalThreshold: 1,
          showLoadingUI: false,
        })

        console.log('Scene loaded! Starting viewer...')

        // Get actual splat count
        const loadedCount = viewer.splatMesh?.getSplatCount?.() || vertexCount
        setSplatCount(loadedCount)
        console.log('Loaded splat count:', loadedCount)

        // Start the viewer
        viewer.start()

        // Try to get scene bounds and reposition camera
        setTimeout(() => {
          if (viewer.splatMesh) {
            try {
              viewer.splatMesh.geometry.computeBoundingSphere()
              const sphere = viewer.splatMesh.geometry.boundingSphere
              if (sphere) {
                console.log('Scene bounds - center:', sphere.center, 'radius:', sphere.radius)

                // Position camera to see the whole scene
                const distance = sphere.radius * 2.5
                viewer.camera.position.set(
                  sphere.center.x,
                  sphere.center.y,
                  sphere.center.z + distance
                )
                viewer.camera.lookAt(sphere.center)

                if (viewer.controls) {
                  viewer.controls.target.copy(sphere.center)
                  viewer.controls.update()
                }

                console.log('Camera repositioned to:', viewer.camera.position)
                setDebugInfo(`${loadedCount.toLocaleString()} splats loaded. Camera auto-focused.`)
              }
            } catch (e) {
              console.warn('Could not compute bounds:', e)
            }
          }
        }, 500)

        setDebugInfo(`Loaded ${loadedCount.toLocaleString()} splats`)
        setIsLoading(false)

      } catch (error) {
        console.error('Error loading scene:', error)
        setLoadError(error.message)
        setDebugInfo(`Error: ${error.message}`)
        setIsLoading(false)
      }
    }

    inspectAndLoad()

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
  }, [plyUrl])

  // Download PLY handler
  const handleDownloadPly = () => {
    if (plyUrl) {
      const a = document.createElement('a')
      a.href = plyUrl
      a.download = 'scene.ply'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

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
        <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading 3D scene...</span>
            <span className="text-xs text-white/40">{debugInfo}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/80 z-10">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="text-accent-error text-lg">Failed to load 3D scene</div>
            <p className="text-sm text-white/60 max-w-md">{loadError}</p>
            <button
              onClick={handleDownloadPly}
              className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            >
              Download PLY to inspect
            </button>
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

      {/* Debug Panel - Always visible when not loading */}
      {!isLoading && (
        <div className="absolute bottom-2 left-2 bg-black/90 text-white/80 text-xs p-2 rounded font-mono max-w-sm z-20 pointer-events-auto">
          <div className="font-bold text-accent-primary mb-1">Debug Info</div>
          <div>{debugInfo}</div>
          {splatCount > 0 && <div className="text-green-400">Splats: {splatCount.toLocaleString()}</div>}
          {plyHeader && (
            <details className="mt-1">
              <summary className="cursor-pointer text-blue-400">PLY Header</summary>
              <pre className="text-[10px] whitespace-pre-wrap mt-1 max-h-32 overflow-auto">
                {plyHeader}
              </pre>
            </details>
          )}
          <button
            onClick={handleDownloadPly}
            className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs"
          >
            Download PLY
          </button>
        </div>
      )}
    </div>
  )
}
