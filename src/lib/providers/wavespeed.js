/**
 * Wavespeed.ai Provider Implementation
 * Handles all media generation via Wavespeed API
 */

const BASE_URL = 'https://api.wavespeed.ai/api/v3'

export class WavespeedProvider {
  constructor() {
    this.name = 'wavespeed'
  }

  /**
   * Get API key from localStorage
   */
  getApiKey() {
    return localStorage.getItem('wavespeed_api_key')
  }

  /**
   * Make authenticated request to Wavespeed API
   */
  async request(endpoint, options = {}) {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Wavespeed API key not configured. Please add it in Settings.')
    }

    const url = `${BASE_URL}/${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API request failed: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(params) {
    const { model, prompt, negativePrompt, aspectRatio, resolution, guidanceScale, seed } = params

    const payload = {
      prompt,
      ...(negativePrompt && { negative_prompt: negativePrompt }),
      ...(aspectRatio && { aspect_ratio: aspectRatio }),
      ...(resolution && { resolution }),
      ...(guidanceScale && { guidance_scale: guidanceScale }),
      ...(seed && { seed }),
    }

    const result = await this.request(model.endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      taskId: result.id || result.task_id,
      status: 'processing',
      provider: this.name,
    }
  }

  /**
   * Generate video from image
   */
  async generateVideo(params) {
    const {
      model,
      imageUrl,
      imageBase64,
      prompt,
      negativePrompt,
      motionType,
      duration,
      aspectRatio,
      resolution,
    } = params

    const payload = {
      prompt,
      ...(imageUrl && { image_url: imageUrl }),
      ...(imageBase64 && { image: imageBase64 }),
      ...(negativePrompt && { negative_prompt: negativePrompt }),
      ...(motionType && { motion_type: motionType }),
      ...(duration && { duration }),
      ...(aspectRatio && { aspect_ratio: aspectRatio }),
      ...(resolution && { resolution }),
    }

    const result = await this.request(model.endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      taskId: result.id || result.task_id,
      status: 'processing',
      provider: this.name,
    }
  }

  /**
   * Generate voice from text
   */
  async generateVoice(params) {
    const { model, text, voice, language, emotion, pace } = params

    const payload = {
      text,
      ...(voice && { voice }),
      ...(language && { language }),
      ...(emotion && { emotion }),
      ...(pace && { pace }),
    }

    const result = await this.request(model.endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      taskId: result.id || result.task_id,
      status: 'processing',
      provider: this.name,
    }
  }

  /**
   * Generate lipsync video
   */
  async generateLipsync(params) {
    const { model, videoUrl, videoBase64, audioUrl, audioBase64 } = params

    const payload = {
      ...(videoUrl && { video_url: videoUrl }),
      ...(videoBase64 && { video: videoBase64 }),
      ...(audioUrl && { audio_url: audioUrl }),
      ...(audioBase64 && { audio: audioBase64 }),
    }

    const result = await this.request(model.endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    return {
      taskId: result.id || result.task_id,
      status: 'processing',
      provider: this.name,
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId) {
    const result = await this.request(`predictions/${taskId}`, {
      method: 'GET',
    })

    // Normalize status response
    const status = result.status?.toLowerCase() || 'processing'
    const normalizedStatus =
      status === 'succeeded' || status === 'completed'
        ? 'completed'
        : status === 'failed' || status === 'error'
          ? 'failed'
          : 'processing'

    return {
      taskId,
      status: normalizedStatus,
      outputs: result.output || result.outputs || [],
      error: result.error,
      progress: result.progress,
      provider: this.name,
    }
  }
}
