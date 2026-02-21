/**
 * Model Registry - Config-driven model definitions
 * Adding a new model = just add an entry here
 * UI dropdowns automatically populate from this registry
 */

export const modelRegistry = {
  imageGeneration: [
    {
      id: 'seedream-v4.5',
      name: 'Seedream 4.5',
      provider: 'wavespeed',
      endpoint: 'bytedance/seedream-v4.5',
      default: true,
      description: 'High-quality 4K cinematic stills',
    },
    {
      id: 'flux-dev',
      name: 'Flux Dev',
      provider: 'wavespeed',
      endpoint: 'black-forest-labs/flux-dev',
      description: 'Fast, high-quality image generation',
    },
    {
      id: 'wan-t2i',
      name: 'WAN 2.6',
      provider: 'wavespeed',
      endpoint: 'alibaba/wan-2.6/text-to-image',
      description: 'Different aesthetic style',
    },
    {
      id: 'kling-image',
      name: 'Kling Image',
      provider: 'wavespeed',
      endpoint: 'kwaivgi/kling-image-o3/text-to-image',
      description: 'Optimized for cinematic frames',
    },
  ],

  imageToVideo: [
    {
      id: 'kling-i2v',
      name: 'Kling Pro I2V',
      provider: 'wavespeed',
      endpoint: 'kwaivgi/kling-video-o3-pro/image-to-video',
      default: true,
      description: 'Best quality image-to-video',
    },
    {
      id: 'wan-i2v',
      name: 'WAN 2.6 I2V',
      provider: 'wavespeed',
      endpoint: 'alibaba/wan-2.6/image-to-video-pro',
      description: 'Alternative style I2V',
    },
    {
      id: 'sora-i2v',
      name: 'Sora 2 I2V',
      provider: 'wavespeed',
      endpoint: 'openai/sora-2/image-to-video-pro',
      description: 'Includes audio generation',
    },
    {
      id: 'vidu-i2v',
      name: 'Vidu Q3 I2V',
      provider: 'wavespeed',
      endpoint: 'vidu/q3/image-to-video-pro',
      description: 'Fast video generation',
    },
  ],

  voice: [
    {
      id: 'gemini-tts',
      name: 'Gemini TTS',
      provider: 'wavespeed',
      endpoint: 'google/gemini-2.5-flash/text-to-speech',
      default: true,
      description: '30+ voices, 24 languages',
    },
  ],

  lipsync: [
    {
      id: 'longcat',
      name: 'Longcat Avatar',
      provider: 'wavespeed',
      endpoint: 'wavespeed-ai/longcat-avatar',
      default: true,
      description: 'Realistic lipsync',
    },
    {
      id: 'infinitetalk',
      name: 'InfiniteTalk',
      provider: 'wavespeed',
      endpoint: 'wavespeed-ai/infinitetalk',
      description: 'Different lipsync style',
    },
  ],
}

/**
 * Get models for a specific category
 */
export function getModels(category) {
  return modelRegistry[category] || []
}

/**
 * Get the default model for a category
 */
export function getDefaultModel(category) {
  const models = getModels(category)
  return models.find((m) => m.default) || models[0]
}

/**
 * Get a specific model by ID
 */
export function getModelById(category, modelId) {
  const models = getModels(category)
  return models.find((m) => m.id === modelId)
}

/**
 * Get all available categories
 */
export function getCategories() {
  return Object.keys(modelRegistry)
}
