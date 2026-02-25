/**
 * Project Store - Zustand store for project state
 */

import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { dataService } from '../supabase'

/**
 * Create initial project structure
 */
function createProject(name) {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name,
    createdAt: now,
    updatedAt: now,
    script: '',
    characters: [],
    locations: [],
    scenes: [],
    frames: [],
    clips: [],
    assembly: {
      timeline: [],
    },
  }
}

/**
 * Create initial scene structure
 */
function createScene(sceneNumber) {
  return {
    id: uuid(),
    sceneNumber,
    location: '',
    timeOfDay: 'day',
    mood: '',
    description: '',
    dialogueLines: [],
    shots: [],
  }
}

/**
 * Create initial shot structure
 */
function createShot(shotNumber) {
  return {
    id: uuid(),
    shotNumber,
    shotType: 'wide',
    description: '',
    characters: [],
    cameraAngle: 'eye-level',
    lens: '35mm',
    movement: 'static',
    keyframes: [],
    videoTakes: [],
    audioTakes: [],
    selectedKeyframe: null,
    selectedVideo: null,
    selectedAudio: null,
  }
}

export const useProjectStore = create((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  currentScene: null,
  currentShot: null,
  loading: false,
  error: null,

  // Load all projects from DB
  loadProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await dataService.getAllProjects()
      set({ projects, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  // Create new project
  createProject: async (name) => {
    set({ loading: true, error: null })
    try {
      const project = createProject(name)
      await dataService.createProject(project)
      set((state) => ({
        projects: [project, ...state.projects],
        currentProject: project,
        loading: false,
      }))
      return project
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // Load project by ID
  loadProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const project = await dataService.getProject(id)
      if (!project) {
        throw new Error('Project not found')
      }
      set({ currentProject: project, loading: false })
      return project
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // Update current project
  updateProject: async (updates) => {
    const { currentProject } = get()
    if (!currentProject) return

    const updated = { ...currentProject, ...updates }
    await dataService.updateProject(updated)
    set((state) => ({
      currentProject: updated,
      projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
    }))
  },

  // Delete project
  deleteProject: async (id) => {
    await dataService.deleteProject(id)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }))
  },

  // Set current scene
  setCurrentScene: (sceneId) => {
    const { currentProject } = get()
    if (!currentProject) return
    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    set({ currentScene: scene, currentShot: null })
  },

  // Set current shot
  setCurrentShot: (shotId) => {
    const { currentProject, currentScene } = get()
    if (!currentProject) return

    // Search in current scene first
    if (currentScene) {
      const shot = currentScene.shots.find((s) => s.id === shotId)
      if (shot) {
        set({ currentShot: shot })
        return
      }
    }

    // Search in all scenes
    for (const scene of currentProject.scenes) {
      const shot = scene.shots.find((s) => s.id === shotId)
      if (shot) {
        set({ currentScene: scene, currentShot: shot })
        return
      }
    }
  },

  // Add scene
  addScene: async () => {
    const { currentProject } = get()
    if (!currentProject) return

    const sceneNumber = currentProject.scenes.length + 1
    const scene = createScene(sceneNumber)
    const scenes = [...currentProject.scenes, scene]

    await get().updateProject({ scenes })
    set({ currentScene: scene })
    return scene
  },

  // Update scene
  updateScene: async (sceneId, updates) => {
    const { currentProject, currentScene } = get()
    if (!currentProject) return

    const scenes = currentProject.scenes.map((s) =>
      s.id === sceneId ? { ...s, ...updates } : s
    )

    await get().updateProject({ scenes })
    if (currentScene?.id === sceneId) {
      set({ currentScene: { ...currentScene, ...updates } })
    }
  },

  // Delete scene
  deleteScene: async (sceneId) => {
    const { currentProject, currentScene } = get()
    if (!currentProject) return

    const scenes = currentProject.scenes.filter((s) => s.id !== sceneId)
    await get().updateProject({ scenes })
    if (currentScene?.id === sceneId) {
      set({ currentScene: null, currentShot: null })
    }
  },

  // Add shot to scene
  addShot: async (sceneId) => {
    const { currentProject } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shotNumber = scene.shots.length + 1
    const shot = createShot(shotNumber)
    const updatedScene = { ...scene, shots: [...scene.shots, shot] }

    await get().updateScene(sceneId, { shots: updatedScene.shots })
    set({ currentShot: shot })
    return shot
  },

  // Update shot
  updateShot: async (sceneId, shotId, updates) => {
    const { currentProject, currentShot } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shots = scene.shots.map((s) => (s.id === shotId ? { ...s, ...updates } : s))
    await get().updateScene(sceneId, { shots })

    if (currentShot?.id === shotId) {
      set({ currentShot: { ...currentShot, ...updates } })
    }
  },

  // Delete shot
  deleteShot: async (sceneId, shotId) => {
    const { currentProject, currentShot } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shots = scene.shots.filter((s) => s.id !== shotId)
    await get().updateScene(sceneId, { shots })

    if (currentShot?.id === shotId) {
      set({ currentShot: null })
    }
  },

  // Add keyframe to shot
  addKeyframe: async (sceneId, shotId, keyframe) => {
    const { currentProject } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shot = scene.shots.find((s) => s.id === shotId)
    if (!shot) return

    const newKeyframe = {
      id: uuid(),
      ...keyframe,
      createdAt: new Date().toISOString(),
    }

    await get().updateShot(sceneId, shotId, {
      keyframes: [...shot.keyframes, newKeyframe],
    })

    return newKeyframe
  },

  // Add video take to shot
  addVideoTake: async (sceneId, shotId, videoTake) => {
    const { currentProject } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shot = scene.shots.find((s) => s.id === shotId)
    if (!shot) return

    const newTake = {
      id: uuid(),
      ...videoTake,
      createdAt: new Date().toISOString(),
    }

    await get().updateShot(sceneId, shotId, {
      videoTakes: [...shot.videoTakes, newTake],
    })

    return newTake
  },

  // Add audio take to shot
  addAudioTake: async (sceneId, shotId, audioTake) => {
    const { currentProject } = get()
    if (!currentProject) return

    const scene = currentProject.scenes.find((s) => s.id === sceneId)
    if (!scene) return

    const shot = scene.shots.find((s) => s.id === shotId)
    if (!shot) return

    const newTake = {
      id: uuid(),
      ...audioTake,
      createdAt: new Date().toISOString(),
    }

    await get().updateShot(sceneId, shotId, {
      audioTakes: [...shot.audioTakes, newTake],
    })

    return newTake
  },

  // Add character
  addCharacter: async (character) => {
    const { currentProject } = get()
    if (!currentProject) return

    const newCharacter = {
      id: uuid(),
      ...character,
      referenceImages: [],
    }

    await get().updateProject({
      characters: [...currentProject.characters, newCharacter],
    })

    return newCharacter
  },

  // Add location
  addLocation: async (location) => {
    const { currentProject } = get()
    if (!currentProject) return

    const newLocation = {
      id: uuid(),
      ...location,
      referenceImages: [],
    }

    await get().updateProject({
      locations: [...currentProject.locations, newLocation],
    })

    return newLocation
  },

  // ==================== Frames ====================

  // Add frame to project
  addFrame: async (frame) => {
    const { currentProject } = get()
    if (!currentProject) return

    const newFrame = {
      id: uuid(),
      ...frame,
      createdAt: new Date().toISOString(),
    }

    const frames = [...(currentProject.frames || []), newFrame]
    await get().updateProject({ frames })

    return newFrame
  },

  // Update frame
  updateFrame: async (frameId, updates) => {
    const { currentProject } = get()
    if (!currentProject) return

    const frames = (currentProject.frames || []).map(f =>
      f.id === frameId ? { ...f, ...updates } : f
    )

    await get().updateProject({ frames })
  },

  // Update multiple frames at once (for batch position updates)
  updateFrames: async (updatedFrames) => {
    const { currentProject } = get()
    if (!currentProject) return

    await get().updateProject({ frames: updatedFrames })
  },

  // Delete frame
  deleteFrame: async (frameId) => {
    const { currentProject } = get()
    if (!currentProject) return

    const frames = (currentProject.frames || []).filter(f => f.id !== frameId)
    await get().updateProject({ frames })
  },

  // ==================== Clips (Video) ====================

  // Add clip to project
  addClip: async (clip) => {
    const { currentProject } = get()
    if (!currentProject) return

    const newClip = {
      id: uuid(),
      ...clip,
      createdAt: new Date().toISOString(),
    }

    const clips = [...(currentProject.clips || []), newClip]
    await get().updateProject({ clips })

    return newClip
  },

  // Update clip
  updateClip: async (clipId, updates) => {
    const { currentProject } = get()
    if (!currentProject) return

    const clips = (currentProject.clips || []).map(c =>
      c.id === clipId ? { ...c, ...updates } : c
    )

    await get().updateProject({ clips })
  },

  // Delete clip
  deleteClip: async (clipId) => {
    const { currentProject } = get()
    if (!currentProject) return

    const clips = (currentProject.clips || []).filter(c => c.id !== clipId)
    await get().updateProject({ clips })
  },

  // Clear current project
  clearCurrentProject: () => {
    set({ currentProject: null, currentScene: null, currentShot: null })
  },
}))
