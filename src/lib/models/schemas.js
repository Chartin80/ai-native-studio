/**
 * Model Schemas - Per-model parameter definitions
 * Each model can have different supported options
 * The schema defines what the UI shows for each model
 */

export const modelSchemas = {
  // Image Generation Models
  'seedream-v4.5': {
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
    resolutions: ['1K', '2K', '4K'],
    defaultAspectRatio: '16:9',
    defaultResolution: '2K',
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    guidanceScaleRange: [1, 20],
    defaultGuidanceScale: 7.5,
  },

  'flux-dev': {
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    resolutions: ['1K', '2K'],
    defaultAspectRatio: '16:9',
    defaultResolution: '1K',
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    guidanceScaleRange: [1, 10],
    defaultGuidanceScale: 3.5,
  },

  'wan-t2i': {
    aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    resolutions: ['1K', '2K'],
    defaultAspectRatio: '16:9',
    defaultResolution: '1K',
    supportsNegativePrompt: true,
    supportsGuidanceScale: true,
    guidanceScaleRange: [1, 15],
    defaultGuidanceScale: 5,
  },

  'kling-image': {
    aspectRatios: ['1:1', '16:9', '9:16'],
    resolutions: ['1K', '2K'],
    defaultAspectRatio: '16:9',
    defaultResolution: '1K',
    supportsNegativePrompt: true,
    supportsGuidanceScale: false,
  },

  // Image-to-Video Models
  'kling-i2v': {
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [5, 10],
    resolutions: ['720p', '1080p'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '1080p',
    supportsMotionPrompt: true,
    supportsNegativePrompt: true,
    motionTypes: [
      { id: 'static', name: 'Static', description: 'Minimal camera movement' },
      { id: 'dolly_in', name: 'Dolly In', description: 'Camera moves toward subject' },
      { id: 'dolly_out', name: 'Dolly Out', description: 'Camera moves away from subject' },
      { id: 'pan_left', name: 'Pan Left', description: 'Camera pans left' },
      { id: 'pan_right', name: 'Pan Right', description: 'Camera pans right' },
      { id: 'tilt_up', name: 'Tilt Up', description: 'Camera tilts upward' },
      { id: 'tilt_down', name: 'Tilt Down', description: 'Camera tilts downward' },
      { id: 'tracking', name: 'Tracking', description: 'Camera follows subject' },
      { id: 'zoom_in', name: 'Zoom In', description: 'Lens zooms in' },
      { id: 'zoom_out', name: 'Zoom Out', description: 'Lens zooms out' },
    ],
  },

  'wan-i2v': {
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [5, 10],
    resolutions: ['720p', '1080p'],
    defaultAspectRatio: '16:9',
    defaultDuration: 5,
    defaultResolution: '720p',
    supportsMotionPrompt: true,
    supportsNegativePrompt: true,
    motionTypes: [
      { id: 'static', name: 'Static', description: 'Minimal camera movement' },
      { id: 'dolly_in', name: 'Dolly In', description: 'Camera moves toward subject' },
      { id: 'dolly_out', name: 'Dolly Out', description: 'Camera moves away from subject' },
      { id: 'pan_left', name: 'Pan Left', description: 'Camera pans left' },
      { id: 'pan_right', name: 'Pan Right', description: 'Camera pans right' },
    ],
  },

  'sora-i2v': {
    aspectRatios: ['16:9', '9:16'],
    durations: [5, 10, 15, 20],
    resolutions: ['1080p'],
    defaultAspectRatio: '16:9',
    defaultDuration: 10,
    defaultResolution: '1080p',
    supportsMotionPrompt: true,
    supportsAudio: true,
    motionTypes: [
      { id: 'auto', name: 'Auto', description: 'AI determines best motion' },
      { id: 'static', name: 'Static', description: 'Minimal camera movement' },
      { id: 'dynamic', name: 'Dynamic', description: 'Active camera movement' },
    ],
  },

  'vidu-i2v': {
    aspectRatios: ['16:9', '9:16', '1:1'],
    durations: [4, 8],
    resolutions: ['720p', '1080p'],
    defaultAspectRatio: '16:9',
    defaultDuration: 4,
    defaultResolution: '720p',
    supportsMotionPrompt: true,
    supportsNegativePrompt: false,
    motionTypes: [
      { id: 'auto', name: 'Auto', description: 'AI determines best motion' },
      { id: 'static', name: 'Static', description: 'Minimal camera movement' },
    ],
  },

  // Voice Models
  'gemini-tts': {
    voices: [
      { id: 'zephyr', name: 'Zephyr', gender: 'neutral', style: 'bright' },
      { id: 'puck', name: 'Puck', gender: 'male', style: 'upbeat' },
      { id: 'charon', name: 'Charon', gender: 'male', style: 'informative' },
      { id: 'kore', name: 'Kore', gender: 'female', style: 'firm' },
      { id: 'fenrir', name: 'Fenrir', gender: 'male', style: 'excitable' },
      { id: 'aoede', name: 'Aoede', gender: 'female', style: 'breezy' },
      { id: 'leda', name: 'Leda', gender: 'female', style: 'youthful' },
      { id: 'orus', name: 'Orus', gender: 'male', style: 'firm' },
      { id: 'proteus', name: 'Proteus', gender: 'male', style: 'medium-pitched' },
      { id: 'river', name: 'River', gender: 'neutral', style: 'cool' },
    ],
    defaultVoice: 'zephyr',
    languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
    defaultLanguage: 'en',
    supportsEmotion: true,
    emotions: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful'],
    supportsPace: true,
    paceRange: [0.5, 2.0],
    defaultPace: 1.0,
  },

  // Lipsync Models
  'longcat': {
    maxDuration: 120,
    supportedVideoFormats: ['mp4', 'webm'],
    supportedAudioFormats: ['mp3', 'wav', 'ogg'],
    outputResolution: '1080p',
    enhanceQuality: true,
  },

  'infinitetalk': {
    maxDuration: 60,
    supportedVideoFormats: ['mp4'],
    supportedAudioFormats: ['mp3', 'wav'],
    outputResolution: '720p',
    enhanceQuality: false,
  },
}

/**
 * Get schema for a specific model
 */
export function getModelSchema(modelId) {
  return modelSchemas[modelId] || {}
}

/**
 * Get available options for a parameter
 */
export function getModelOptions(modelId, parameter) {
  const schema = getModelSchema(modelId)
  return schema[parameter] || []
}

/**
 * Get default value for a parameter
 */
export function getModelDefault(modelId, parameter) {
  const schema = getModelSchema(modelId)
  const defaultKey = `default${parameter.charAt(0).toUpperCase() + parameter.slice(1)}`
  return schema[defaultKey]
}

/**
 * Check if a model supports a feature
 */
export function modelSupports(modelId, feature) {
  const schema = getModelSchema(modelId)
  return schema[`supports${feature.charAt(0).toUpperCase() + feature.slice(1)}`] === true
}
