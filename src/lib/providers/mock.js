/**
 * Mock Provider Implementation
 * For testing and offline development
 */

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <text x="960" y="540" text-anchor="middle" fill="#6366f1" font-size="48" font-family="sans-serif">Generated Image Placeholder</text>
</svg>
`)

// Simulated task store
const tasks = new Map()

export class MockProvider {
  constructor() {
    this.name = 'mock'
  }

  /**
   * Create a mock task that resolves after delay
   */
  createMockTask(type, delay = 3000) {
    const taskId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    tasks.set(taskId, {
      taskId,
      type,
      status: 'processing',
      startTime: Date.now(),
      resolveTime: Date.now() + delay,
    })

    return {
      taskId,
      status: 'processing',
      provider: this.name,
    }
  }

  /**
   * Generate image (mock)
   */
  async generateImage(params) {
    console.log('[MockProvider] generateImage:', params)
    return this.createMockTask('image', 2000)
  }

  /**
   * Generate video (mock)
   */
  async generateVideo(params) {
    console.log('[MockProvider] generateVideo:', params)
    return this.createMockTask('video', 5000)
  }

  /**
   * Generate voice (mock)
   */
  async generateVoice(params) {
    console.log('[MockProvider] generateVoice:', params)
    return this.createMockTask('voice', 1500)
  }

  /**
   * Generate lipsync (mock)
   */
  async generateLipsync(params) {
    console.log('[MockProvider] generateLipsync:', params)
    return this.createMockTask('lipsync', 4000)
  }

  /**
   * Get task status (mock)
   */
  async getTaskStatus(taskId) {
    const task = tasks.get(taskId)

    if (!task) {
      return {
        taskId,
        status: 'failed',
        error: 'Task not found',
        provider: this.name,
      }
    }

    const now = Date.now()
    const progress = Math.min(
      100,
      Math.round(((now - task.startTime) / (task.resolveTime - task.startTime)) * 100)
    )

    if (now >= task.resolveTime) {
      task.status = 'completed'
      task.outputs = this.getMockOutputs(task.type)
    }

    return {
      taskId,
      status: task.status,
      outputs: task.outputs || [],
      progress: task.status === 'completed' ? 100 : progress,
      provider: this.name,
    }
  }

  /**
   * Get mock outputs based on type
   */
  getMockOutputs(type) {
    switch (type) {
      case 'image':
        return [PLACEHOLDER_IMAGE]
      case 'video':
        return ['https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
      case 'voice':
        return ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==']
      case 'lipsync':
        return ['https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
      default:
        return []
    }
  }
}
