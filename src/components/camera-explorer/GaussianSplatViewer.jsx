/**
 * GaussianSplatViewer - 3D Gaussian Splat renderer with cinematographer controls
 *
 * Controls (like a camera on a tripod in a locked room):
 * - Mouse drag: Pan/tilt camera (look around)
 * - Scroll wheel: Raise/lower camera height (floor to ceiling)
 * - Arrow keys: Move forward/back/strafe (within room bounds)
 * - Number keys 1-6: Change lens (12mm to 135mm)
 * - Space: Capture snapshot
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d'
import { useCameraExplorerStore } from '../../lib/store/cameraExplorerStore'
import { getThreeFOV, getLensFromShortcut } from '../../lib/camera/lensPresets'
import { CameraHUD } from './CameraHUD'

// Movement settings
const MOVE_SPEED = 0.15
const LOOK_SPEED = 0.003
const HEIGHT_SPEED = 0.1

export function GaussianSplatViewer({ plyUrl, onCaptureRef }) {
  const containerRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const viewerRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const animationFrameRef = useRef(null)
  const sceneBoundsRef = useRef(null) // Store scene bounds for constraints
  const keysPressed = useRef({})

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [debugInfo, setDebugInfo] = useState('Initializing...')
  const [splatCount, setSplatCount] = useState(0)
  const [isActive, setIsActive] = useState(false) // Track if viewer is focused/active

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

  // Clamp camera position to scene bounds
  const clampToSceneBounds = useCallback((position) => {
    const bounds = sceneBoundsRef.current
    if (!bounds) return position

    return {
      x: Math.max(bounds.min.x, Math.min(bounds.max.x, position.x)),
      y: Math.max(bounds.min.y, Math.min(bounds.max.y, position.y)),
      z: Math.max(bounds.min.z, Math.min(bounds.max.z, position.z)),
    }
  }, [])

  // Capture current view using a render target
  const captureView = useCallback(() => {
    if (!viewerRef.current || !cameraRef.current) return null

    const viewer = viewerRef.current
    const camera = cameraRef.current
    const renderer = viewer.renderer

    if (!renderer || !viewer.splatMesh) {
      console.error('No renderer or splatMesh found')
      return null
    }

    console.log('Capturing snapshot using render target...')

    // Create a render target at a reasonable resolution
    const width = 1920
    const height = 1080
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    })

    // Create a scene with just the splat mesh
    const captureScene = new THREE.Scene()
    captureScene.add(viewer.splatMesh)

    // Store the current render target
    const currentTarget = renderer.getRenderTarget()

    // Render to our target
    renderer.setRenderTarget(renderTarget)
    renderer.clear()
    renderer.render(captureScene, camera)

    // Read pixels from the render target
    const pixels = new Uint8Array(width * height * 4)
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)

    // Restore original render target
    renderer.setRenderTarget(currentTarget)

    // Put the mesh back in the original scene
    // (Note: this might cause issues, but let's try)

    // Create image from pixels (flip Y)
    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = width
    captureCanvas.height = height
    const ctx = captureCanvas.getContext('2d')
    const imageData = ctx.createImageData(width, height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = ((height - 1 - y) * width + x) * 4
        const dstIdx = (y * width + x) * 4
        imageData.data[dstIdx] = pixels[srcIdx]
        imageData.data[dstIdx + 1] = pixels[srcIdx + 1]
        imageData.data[dstIdx + 2] = pixels[srcIdx + 2]
        imageData.data[dstIdx + 3] = pixels[srcIdx + 3]
      }
    }

    ctx.putImageData(imageData, 0, 0)
    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.9)

    // Clean up
    renderTarget.dispose()

    // Check if we got content
    let hasContent = false
    for (let i = 0; i < pixels.length; i += 1000) {
      if (pixels[i] > 5 || pixels[i + 1] > 5 || pixels[i + 2] > 5) {
        hasContent = true
        break
      }
    }

    console.log('Captured, has content:', hasContent, 'data length:', dataUrl.length)

    const snapshot = captureSnapshot(dataUrl, {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
    })

    return snapshot
  }, [captureSnapshot])

  // Expose capture function to parent
  useEffect(() => {
    if (onCaptureRef) {
      onCaptureRef.current = captureView
    }
  }, [captureView, onCaptureRef])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      keysPressed.current[e.key.toLowerCase()] = true
      keysPressed.current[e.code] = true

      // Lens shortcuts (1-6)
      const lens = getLensFromShortcut(e.key)
      if (lens) {
        setSelectedLens(lens)
        return
      }

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
            // Reset to original photo orientation
            const pitch = -8.9 * (Math.PI / 180)
            const yaw = 183.7 * (Math.PI / 180)
            const roll = -180 * (Math.PI / 180)
            cameraRef.current.position.set(0, 0.06, 0)
            cameraRef.current.rotation.set(pitch, yaw, roll, 'YXZ')
          }
          break
        case ' ':
          e.preventDefault()
          captureView()
          break
      }
    }

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false
      keysPressed.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setSelectedLens, toggleGrid, toggleHUD, resetCamera, captureView])

  // Arrow key movement (with bounds)
  useEffect(() => {
    const moveCamera = () => {
      if (!cameraRef.current) return

      const camera = cameraRef.current
      const keys = keysPressed.current

      // Get camera direction (horizontal only)
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()

      const right = new THREE.Vector3()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      let moved = false
      const newPos = camera.position.clone()

      // Arrow keys for movement
      if (keys['arrowup'] || keys['w']) {
        newPos.addScaledVector(forward, MOVE_SPEED)
        moved = true
      }
      if (keys['arrowdown'] || keys['s']) {
        newPos.addScaledVector(forward, -MOVE_SPEED)
        moved = true
      }
      if (keys['arrowleft'] || keys['a']) {
        newPos.addScaledVector(right, -MOVE_SPEED)
        moved = true
      }
      if (keys['arrowright'] || keys['d']) {
        newPos.addScaledVector(right, MOVE_SPEED)
        moved = true
      }

      if (moved) {
        // Apply bounds
        const clamped = clampToSceneBounds({ x: newPos.x, y: newPos.y, z: newPos.z })
        camera.position.set(clamped.x, camera.position.y, clamped.z) // Keep Y (height) separate
      }
    }

    const interval = setInterval(moveCamera, 16)
    return () => clearInterval(interval)
  }, [clampToSceneBounds])

  // Handle click outside to deactivate
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mouse controls for pan/tilt and scroll for height
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isDragging = false
    let lastX = 0
    let lastY = 0

    const handleMouseDown = (e) => {
      // Activate on any click inside
      setIsActive(true)

      if (e.button === 0) { // Left click
        isDragging = true
        lastX = e.clientX
        lastY = e.clientY
        container.style.cursor = 'grabbing'
      }
    }

    const handleMouseUp = () => {
      isDragging = false
      container.style.cursor = 'grab'
    }

    const handleMouseMove = (e) => {
      if (!isDragging || !cameraRef.current) return

      const deltaX = e.clientX - lastX
      const deltaY = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY

      const camera = cameraRef.current

      // Pan (yaw) and tilt (pitch)
      camera.rotation.y -= deltaX * LOOK_SPEED
      camera.rotation.x -= deltaY * LOOK_SPEED

      // Clamp pitch to prevent flipping
      camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camera.rotation.x))
    }

    const handleWheel = (e) => {
      // Only handle scroll when active
      if (!isActive) return

      e.preventDefault()
      e.stopPropagation()

      if (!cameraRef.current) return

      const camera = cameraRef.current
      const bounds = sceneBoundsRef.current

      // Scroll to raise/lower camera
      let newY = camera.position.y - e.deltaY * 0.005

      // Clamp to floor/ceiling
      if (bounds) {
        newY = Math.max(bounds.min.y, Math.min(bounds.max.y, newY))
      }

      camera.position.y = newY
    }

    const handleMouseLeave = () => {
      isDragging = false
      container.style.cursor = 'grab'
    }

    container.style.cursor = 'grab'
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isActive])

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

    console.log('========== GaussianSplatViewer Loading ==========')
    console.log('PLY URL:', plyUrl)

    setIsLoading(true)
    setLoadError(null)
    setSplatCount(0)
    setDebugInfo('Loading...')

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 450

    const loadScene = async () => {
      try {
        // Fetch and inspect PLY
        setDebugInfo('Fetching PLY...')
        const response = await fetch(plyUrl)
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

        const blob = await response.blob()
        console.log('PLY size:', blob.size, 'bytes')

        // Parse header
        const headerText = await blob.slice(0, 3000).text()
        const vertexMatch = headerText.match(/element vertex (\d+)/)
        const vertexCount = vertexMatch ? parseInt(vertexMatch[1]) : 0

        if (vertexCount === 0) throw new Error('PLY has 0 vertices')

        setDebugInfo(`${vertexCount.toLocaleString()} splats...`)

        const viewerBlobUrl = URL.createObjectURL(blob)

        // Create viewer
        // Initial camera orientation to match the original photo:
        // The reconstruction places the original viewpoint at origin looking "backwards"
        // So we need to look in the +Z direction (yaw ~180°)
        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, 0],
          initialCameraPosition: [0, 0.06, 0],  // Slight Y offset
          initialCameraLookAt: [0, 0, 1],       // Look in +Z direction (opposite of default)
          selfDrivenMode: true,
          useBuiltInControls: false, // We handle controls ourselves
          sharedMemoryForWorkers: false,
          sphericalHarmonicsDegree: 2,
          antialiased: true,
          webGLRendererParameters: {
            preserveDrawingBuffer: true,
            antialias: true,
          },
        })

        viewerRef.current = viewer
        rendererRef.current = viewer.renderer
        cameraRef.current = viewer.camera

        // Add to DOM
        const wrapper = canvasWrapperRef.current || container
        wrapper.appendChild(viewer.renderer.domElement)
        viewer.renderer.setSize(width, height)
        viewer.renderer.domElement.style.width = '100%'
        viewer.renderer.domElement.style.height = '100%'

        // Load scene
        await viewer.addSplatScene(viewerBlobUrl, {
          format: GaussianSplats3D.SceneFormat.Ply,
          splatAlphaRemovalThreshold: 1,
          showLoadingUI: false,
        })

        const loadedCount = viewer.splatMesh?.getSplatCount?.() || vertexCount
        setSplatCount(loadedCount)

        // Start viewer
        viewer.start()

        // Set initial camera rotation to match original photo orientation
        // Based on user testing: Pitch=-8.9°, Yaw=183.7°, Roll=-180°
        if (viewer.camera) {
          const pitch = -8.9 * (Math.PI / 180)  // Convert to radians
          const yaw = 183.7 * (Math.PI / 180)
          const roll = -180 * (Math.PI / 180)
          viewer.camera.rotation.set(pitch, yaw, roll, 'YXZ')
          viewer.camera.position.set(0, 0.06, 0)
        }

        // Force renders
        for (let i = 0; i < 10; i++) {
          setTimeout(() => viewer.update?.(), i * 50)
        }

        // Calculate and store scene bounds
        setTimeout(() => {
          if (viewer.splatMesh?.geometry) {
            try {
              viewer.splatMesh.geometry.computeBoundingBox()
              const box = viewer.splatMesh.geometry.boundingBox
              if (box) {
                // Add some padding and store bounds
                const padding = 0.5
                sceneBoundsRef.current = {
                  min: {
                    x: box.min.x + padding,
                    y: box.min.y + padding,
                    z: box.min.z + padding,
                  },
                  max: {
                    x: box.max.x - padding,
                    y: box.max.y - padding,
                    z: box.max.z - padding,
                  },
                }
                console.log('Scene bounds:', sceneBoundsRef.current)
                setDebugInfo(`${loadedCount.toLocaleString()} splats - bounded`)
              }
            } catch (e) {
              console.warn('Could not compute bounds:', e)
            }
          }
        }, 300)

        setDebugInfo(`${loadedCount.toLocaleString()} splats loaded`)
        setIsLoading(false)

      } catch (error) {
        console.error('Load error:', error)
        setLoadError(error.message)
        setDebugInfo(`Error: ${error.message}`)
        setIsLoading(false)
      }
    }

    loadScene()

    // Camera state tracking
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

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !viewerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      if (w && h && viewerRef.current.renderer) {
        viewerRef.current.renderer.setSize(w, h)
        if (viewerRef.current.camera) {
          viewerRef.current.camera.aspect = w / h
          viewerRef.current.camera.updateProjectionMatrix()
        }
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (viewerRef.current) {
        try { viewerRef.current.dispose() } catch (e) { }
      }
      while (container.firstChild) container.removeChild(container.firstChild)
    }
  }, [plyUrl])

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center p-2">
      {/* 16:9 Container with focus border */}
      <div
        ref={containerRef}
        className={`
          relative bg-studio-bg overflow-hidden rounded-lg
          border-2 transition-all duration-200
          ${isActive
            ? 'border-accent-primary shadow-lg shadow-accent-primary/30'
            : 'border-white/20 hover:border-white/40'
          }
        `}
        style={{ aspectRatio: '16/9', width: '100%', maxHeight: '100%' }}
        onClick={() => setIsActive(true)}
      >
        <div ref={canvasWrapperRef} className="absolute inset-0" />

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/90 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/60">Loading 3D scene...</span>
              <span className="text-xs text-white/40">{debugInfo}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-studio-bg/90 z-10">
            <div className="text-center px-4">
              <div className="text-accent-error text-lg mb-2">Failed to load</div>
              <p className="text-sm text-white/60">{loadError}</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {showGrid && !isLoading && !loadError && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          </div>
        )}

        {/* HUD */}
        {showHUD && !isLoading && !loadError && <CameraHUD />}

        {/* Controls Help */}
        {!isLoading && !loadError && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white/60 text-xs p-2 rounded z-20">
            <div className="font-semibold text-white/80 mb-1">Controls</div>
            <div>Drag: Look around</div>
            <div>Scroll: Up/Down</div>
            <div>Arrows: Move</div>
            <div>1-6: Change lens</div>
            <div>Space: Capture</div>
          </div>
        )}

        {/* Status indicator */}
        {!isLoading && (
          <div className="absolute bottom-2 left-2 bg-black/80 text-white/60 text-xs px-2 py-1 rounded z-20 flex items-center gap-2">
            {splatCount > 0 && <span className="text-green-400">{splatCount.toLocaleString()} splats</span>}
            {isActive ? (
              <span className="text-accent-primary font-medium">● Active</span>
            ) : (
              <span className="text-white/40">Click to activate</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
