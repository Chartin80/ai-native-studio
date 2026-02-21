/**
 * Generation Store - Zustand store for AI generation tasks
 */

import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { aiService } from '../providers'
import * as db from '../db'

export const useGenerationStore = create((set, get) => ({
  // Active tasks (currently generating)
  activeTasks: [],

  // Task history (completed/failed)
  taskHistory: [],

  // Loading state
  loading: false,

  // Load task history for project
  loadHistory: async (projectId) => {
    try {
      const history = await db.getGenerationsByProject(projectId)
      set({ taskHistory: history })
    } catch (error) {
      console.error('Failed to load generation history:', error)
    }
  },

  // Start image generation
  generateImage: async (params) => {
    const {
      projectId,
      sceneId,
      shotId,
      modelId,
      prompt,
      negativePrompt,
      aspectRatio,
      resolution,
      guidanceScale,
    } = params

    const taskId = uuid()

    // Create task record
    const task = {
      id: taskId,
      projectId,
      sceneId,
      shotId,
      type: 'image',
      modelId,
      prompt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // Add to active tasks
    set((state) => ({
      activeTasks: [...state.activeTasks, task],
    }))

    try {
      // Start generation
      const result = await aiService.generateImage({
        modelId,
        prompt,
        negativePrompt,
        aspectRatio,
        resolution,
        guidanceScale,
      })

      // Update task with provider task ID
      const updatedTask = {
        ...task,
        providerTaskId: result.taskId,
        provider: result.provider,
        status: 'processing',
      }

      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.id === taskId ? updatedTask : t
        ),
      }))

      // Poll for completion
      const finalResult = await aiService.pollTask(
        result.taskId,
        result.provider,
        {
          onProgress: (status) => {
            set((state) => ({
              activeTasks: state.activeTasks.map((t) =>
                t.id === taskId
                  ? { ...t, progress: status.progress }
                  : t
              ),
            }))
          },
        }
      )

      // Mark as completed
      const completedTask = {
        ...updatedTask,
        status: 'completed',
        outputs: finalResult.outputs,
        completedAt: new Date().toISOString(),
      }

      // Save to history
      await db.saveGeneration(completedTask)

      // Remove from active, add to history
      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [completedTask, ...state.taskHistory],
      }))

      return completedTask
    } catch (error) {
      // Mark as failed
      const failedTask = {
        ...task,
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      }

      // Save to history
      await db.saveGeneration(failedTask)

      // Remove from active, add to history
      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [failedTask, ...state.taskHistory],
      }))

      throw error
    }
  },

  // Start video generation
  generateVideo: async (params) => {
    const {
      projectId,
      sceneId,
      shotId,
      modelId,
      imageUrl,
      imageBase64,
      prompt,
      negativePrompt,
      motionType,
      duration,
      aspectRatio,
      resolution,
    } = params

    const taskId = uuid()

    const task = {
      id: taskId,
      projectId,
      sceneId,
      shotId,
      type: 'video',
      modelId,
      prompt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      activeTasks: [...state.activeTasks, task],
    }))

    try {
      const result = await aiService.generateVideo({
        modelId,
        imageUrl,
        imageBase64,
        prompt,
        negativePrompt,
        motionType,
        duration,
        aspectRatio,
        resolution,
      })

      const updatedTask = {
        ...task,
        providerTaskId: result.taskId,
        provider: result.provider,
        status: 'processing',
      }

      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.id === taskId ? updatedTask : t
        ),
      }))

      const finalResult = await aiService.pollTask(
        result.taskId,
        result.provider,
        {
          interval: 3000,
          maxAttempts: 120,
          onProgress: (status) => {
            set((state) => ({
              activeTasks: state.activeTasks.map((t) =>
                t.id === taskId
                  ? { ...t, progress: status.progress }
                  : t
              ),
            }))
          },
        }
      )

      const completedTask = {
        ...updatedTask,
        status: 'completed',
        outputs: finalResult.outputs,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(completedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [completedTask, ...state.taskHistory],
      }))

      return completedTask
    } catch (error) {
      const failedTask = {
        ...task,
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(failedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [failedTask, ...state.taskHistory],
      }))

      throw error
    }
  },

  // Start voice generation
  generateVoice: async (params) => {
    const {
      projectId,
      sceneId,
      shotId,
      modelId,
      text,
      voice,
      language,
      emotion,
      pace,
    } = params

    const taskId = uuid()

    const task = {
      id: taskId,
      projectId,
      sceneId,
      shotId,
      type: 'voice',
      modelId,
      text,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      activeTasks: [...state.activeTasks, task],
    }))

    try {
      const result = await aiService.generateVoice({
        modelId,
        text,
        voice,
        language,
        emotion,
        pace,
      })

      const updatedTask = {
        ...task,
        providerTaskId: result.taskId,
        provider: result.provider,
        status: 'processing',
      }

      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.id === taskId ? updatedTask : t
        ),
      }))

      const finalResult = await aiService.pollTask(
        result.taskId,
        result.provider,
        {
          onProgress: (status) => {
            set((state) => ({
              activeTasks: state.activeTasks.map((t) =>
                t.id === taskId
                  ? { ...t, progress: status.progress }
                  : t
              ),
            }))
          },
        }
      )

      const completedTask = {
        ...updatedTask,
        status: 'completed',
        outputs: finalResult.outputs,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(completedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [completedTask, ...state.taskHistory],
      }))

      return completedTask
    } catch (error) {
      const failedTask = {
        ...task,
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(failedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [failedTask, ...state.taskHistory],
      }))

      throw error
    }
  },

  // Start lipsync generation
  generateLipsync: async (params) => {
    const { projectId, sceneId, shotId, modelId, videoUrl, audioUrl } = params

    const taskId = uuid()

    const task = {
      id: taskId,
      projectId,
      sceneId,
      shotId,
      type: 'lipsync',
      modelId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      activeTasks: [...state.activeTasks, task],
    }))

    try {
      const result = await aiService.generateLipsync({
        modelId,
        videoUrl,
        audioUrl,
      })

      const updatedTask = {
        ...task,
        providerTaskId: result.taskId,
        provider: result.provider,
        status: 'processing',
      }

      set((state) => ({
        activeTasks: state.activeTasks.map((t) =>
          t.id === taskId ? updatedTask : t
        ),
      }))

      const finalResult = await aiService.pollTask(
        result.taskId,
        result.provider,
        {
          interval: 3000,
          maxAttempts: 120,
          onProgress: (status) => {
            set((state) => ({
              activeTasks: state.activeTasks.map((t) =>
                t.id === taskId
                  ? { ...t, progress: status.progress }
                  : t
              ),
            }))
          },
        }
      )

      const completedTask = {
        ...updatedTask,
        status: 'completed',
        outputs: finalResult.outputs,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(completedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [completedTask, ...state.taskHistory],
      }))

      return completedTask
    } catch (error) {
      const failedTask = {
        ...task,
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      }

      await db.saveGeneration(failedTask)

      set((state) => ({
        activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
        taskHistory: [failedTask, ...state.taskHistory],
      }))

      throw error
    }
  },

  // Cancel active task
  cancelTask: async (taskId) => {
    // Note: Most providers don't support cancellation
    // We just remove from active tasks
    set((state) => ({
      activeTasks: state.activeTasks.filter((t) => t.id !== taskId),
    }))
  },

  // Clear history
  clearHistory: async (projectId) => {
    if (projectId) {
      set((state) => ({
        taskHistory: state.taskHistory.filter((t) => t.projectId !== projectId),
      }))
    } else {
      set({ taskHistory: [] })
    }
  },
}))
