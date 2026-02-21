/**
 * Provider abstraction layer
 * Routes requests to appropriate provider implementation
 */

import { WavespeedProvider } from './wavespeed'
import { MockProvider } from './mock'
import { getModelById } from '../models'

// Provider instances
const providers = {
  wavespeed: new WavespeedProvider(),
  mock: new MockProvider(),
}

/**
 * Get provider instance by name
 */
export function getProvider(providerName) {
  return providers[providerName] || providers.mock
}

/**
 * Get provider for a specific model
 */
export function getProviderForModel(category, modelId) {
  const model = getModelById(category, modelId)
  if (!model) {
    console.warn(`Model ${modelId} not found, using mock provider`)
    return providers.mock
  }
  return getProvider(model.provider)
}

/**
 * Unified API for generating media
 * Routes to appropriate provider based on model
 */
export const aiService = {
  /**
   * Generate image from text prompt
   */
  async generateImage(params) {
    const { modelId = 'seedream-v4.5', ...rest } = params
    const provider = getProviderForModel('imageGeneration', modelId)
    const model = getModelById('imageGeneration', modelId)
    return provider.generateImage({ ...rest, model })
  },

  /**
   * Generate video from image
   */
  async generateVideo(params) {
    const { modelId = 'kling-i2v', ...rest } = params
    const provider = getProviderForModel('imageToVideo', modelId)
    const model = getModelById('imageToVideo', modelId)
    return provider.generateVideo({ ...rest, model })
  },

  /**
   * Generate voice from text
   */
  async generateVoice(params) {
    const { modelId = 'gemini-tts', ...rest } = params
    const provider = getProviderForModel('voice', modelId)
    const model = getModelById('voice', modelId)
    return provider.generateVoice({ ...rest, model })
  },

  /**
   * Generate lipsync video
   */
  async generateLipsync(params) {
    const { modelId = 'longcat', ...rest } = params
    const provider = getProviderForModel('lipsync', modelId)
    const model = getModelById('lipsync', modelId)
    return provider.generateLipsync({ ...rest, model })
  },

  /**
   * Get task status
   */
  async getTaskStatus(taskId, providerName = 'wavespeed') {
    const provider = getProvider(providerName)
    return provider.getTaskStatus(taskId)
  },

  /**
   * Poll for task completion
   */
  async pollTask(taskId, providerName = 'wavespeed', options = {}) {
    const { interval = 2000, maxAttempts = 60, onProgress } = options
    const provider = getProvider(providerName)

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await provider.getTaskStatus(taskId)

      if (onProgress) {
        onProgress(status)
      }

      if (status.status === 'completed') {
        return status
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Task failed')
      }

      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    throw new Error('Task timed out')
  },
}

export { WavespeedProvider } from './wavespeed'
export { MockProvider } from './mock'
