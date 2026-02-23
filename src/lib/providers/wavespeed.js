/**
 * Wavespeed.ai Provider Implementation
 * Handles all media generation via Wavespeed API
 * Includes Nano Banana Pro Edit for image editing
 */

const BASE_URL = 'https://api.wavespeed.ai/api/v2'
const BASE_URL_V3 = 'https://api.wavespeed.ai/api/v3'
const WAVESPEED_API_KEY = 'df60bb6a3229d10abe24f8947d49c43aa93102628557fc33a31980c9c662dc3e'

export class WavespeedProvider {
  constructor() {
    this.name = 'wavespeed'
  }

  /**
   * Get API key - use hardcoded key or fallback to localStorage
   */
  getApiKey() {
    return WAVESPEED_API_KEY || localStorage.getItem('wavespeed_api_key')
  }

  /**
   * Convert file to base64 data URL
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Prepare image URL from various sources
   */
  async prepareImageUrl(imageSource) {
    if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
      return imageSource
    }
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
      return imageSource
    }
    if (imageSource instanceof File || imageSource instanceof Blob) {
      return await this.fileToBase64(imageSource)
    }
    throw new Error('Invalid image source')
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

  /**
   * Nano Banana Pro Edit - Edit images with AI
   * @param {Object} params
   * @param {string} params.prompt - The editing prompt
   * @param {Array<string|File>} params.images - Array of image URLs or files
   * @param {string} params.aspectRatio - '16:9' or '9:16'
   * @returns {Promise<{imageUrl: string, status: string}>}
   */
  async editImageWithNanoBanana(params) {
    const { prompt, images, aspectRatio = '16:9' } = params

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    if (!images || images.length === 0) {
      throw new Error('At least one image is required')
    }

    // Prepare image URLs
    const imageUrls = await Promise.all(
      images.map(img => this.prepareImageUrl(img))
    )

    const requestBody = {
      prompt,
      images: imageUrls,
      aspect_ratio: aspectRatio,
      resolution: '2k',
      output_format: 'png',
      enable_sync_mode: true,
    }

    console.log('Nano Banana Edit Request:', {
      prompt: prompt.substring(0, 50) + '...',
      imageCount: imageUrls.length,
      aspectRatio,
    })

    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error('Wavespeed API key not configured')
    }

    const response = await fetch(`${BASE_URL_V3}/google/nano-banana-pro/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Nano Banana API Error:', response.status, errorText)
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Nano Banana Response:', result)

    // Handle sync mode response
    if (result.data?.output?.url) {
      return {
        imageUrl: result.data.output.url,
        status: 'completed',
        provider: this.name,
      }
    }

    if (result.data?.outputs?.[0]) {
      return {
        imageUrl: result.data.outputs[0],
        status: 'completed',
        provider: this.name,
      }
    }

    // Handle async mode - need to poll
    if (result.data?.id) {
      return await this.pollForResult(result.data.id)
    }

    throw new Error('Unexpected response format from Wavespeed API')
  }

  /**
   * Poll for async result
   */
  async pollForResult(requestId, maxAttempts = 120, intervalMs = 2000) {
    const apiKey = this.getApiKey()

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs))

      const response = await fetch(`${BASE_URL}/predictions/${requestId}/result`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        continue
      }

      const result = await response.json()
      const status = result.data?.status || result.status

      if (status === 'completed' || status === 'succeeded') {
        const imageUrl = result.data?.output?.url || result.output?.url || result.data?.outputs?.[0]
        if (imageUrl) {
          return {
            imageUrl,
            status: 'completed',
            provider: this.name,
          }
        }
      }

      if (status === 'failed') {
        throw new Error(result.data?.error || result.error || 'Generation failed')
      }

      console.log(`Polling attempt ${i + 1}/${maxAttempts}, status: ${status}`)
    }

    throw new Error('Timeout waiting for result')
  }
}

export const wavespeedProvider = new WavespeedProvider()
