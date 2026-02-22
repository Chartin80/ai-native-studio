/**
 * Cinematic lens presets with FOV calculations
 * Based on full-frame 35mm sensor (36mm x 24mm)
 */

export const LENS_PRESETS = {
  '24mm': {
    focalLength: 24,
    fovHorizontal: 84.1,
    fovVertical: 53.1,
    name: 'Ultra Wide',
    description: 'Dramatic perspective, environmental context',
    shortcut: '1',
  },
  '35mm': {
    focalLength: 35,
    fovHorizontal: 63.4,
    fovVertical: 37.8,
    name: 'Wide',
    description: 'Natural perspective, street photography',
    shortcut: '2',
  },
  '50mm': {
    focalLength: 50,
    fovHorizontal: 46.8,
    fovVertical: 27.0,
    name: 'Normal',
    description: 'Human eye equivalent, neutral distortion',
    shortcut: '3',
  },
  '85mm': {
    focalLength: 85,
    fovHorizontal: 28.6,
    fovVertical: 16.1,
    name: 'Portrait',
    description: 'Flattering compression, subject isolation',
    shortcut: '4',
  },
  '135mm': {
    focalLength: 135,
    fovHorizontal: 18.2,
    fovVertical: 10.2,
    name: 'Telephoto',
    description: 'Strong compression, cinematic isolation',
    shortcut: '5',
  },
}

export const LENS_OPTIONS = Object.entries(LENS_PRESETS).map(([id, preset]) => ({
  id,
  label: `${preset.focalLength}mm - ${preset.name}`,
  ...preset,
}))

/**
 * Get vertical FOV for Three.js camera (Three.js uses vertical FOV)
 */
export function getThreeFOV(lensId) {
  return LENS_PRESETS[lensId]?.fovVertical || 27.0
}

/**
 * Get horizontal FOV for display
 */
export function getHorizontalFOV(lensId) {
  return LENS_PRESETS[lensId]?.fovHorizontal || 46.8
}

/**
 * Get lens preset by ID
 */
export function getLensPreset(lensId) {
  return LENS_PRESETS[lensId] || LENS_PRESETS['50mm']
}

/**
 * Get lens ID from keyboard shortcut
 */
export function getLensFromShortcut(key) {
  const entry = Object.entries(LENS_PRESETS).find(
    ([, preset]) => preset.shortcut === key
  )
  return entry ? entry[0] : null
}

/**
 * Default lens for cinematic work
 */
export const DEFAULT_LENS = '35mm'
