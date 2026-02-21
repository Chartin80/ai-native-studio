/**
 * IndexedDB wrapper for persistent storage
 * Stores projects, assets, and generation history
 */

import { openDB } from 'idb'

const DB_NAME = 'ai-native-studio'
const DB_VERSION = 1

let dbPromise = null

/**
 * Initialize the database
 */
export async function initDB() {
  if (dbPromise) return dbPromise

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
        projectStore.createIndex('updatedAt', 'updatedAt')
        projectStore.createIndex('name', 'name')
      }

      // Assets store (reference images, generated media)
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' })
        assetStore.createIndex('projectId', 'projectId')
        assetStore.createIndex('type', 'type')
        assetStore.createIndex('createdAt', 'createdAt')
      }

      // Generation history
      if (!db.objectStoreNames.contains('generations')) {
        const genStore = db.createObjectStore('generations', { keyPath: 'id' })
        genStore.createIndex('projectId', 'projectId')
        genStore.createIndex('shotId', 'shotId')
        genStore.createIndex('type', 'type')
        genStore.createIndex('createdAt', 'createdAt')
      }
    },
  })

  return dbPromise
}

/**
 * Get database instance
 */
export async function getDB() {
  return initDB()
}

// ==================== Projects ====================

/**
 * Create a new project
 */
export async function createProject(project) {
  const db = await getDB()
  await db.put('projects', project)
  return project
}

/**
 * Get project by ID
 */
export async function getProject(id) {
  const db = await getDB()
  return db.get('projects', id)
}

/**
 * Get all projects, sorted by updatedAt desc
 */
export async function getAllProjects() {
  const db = await getDB()
  const projects = await db.getAll('projects')
  return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

/**
 * Update project
 */
export async function updateProject(project) {
  const db = await getDB()
  project.updatedAt = new Date().toISOString()
  await db.put('projects', project)
  return project
}

/**
 * Delete project and all associated data
 */
export async function deleteProject(id) {
  const db = await getDB()

  // Delete project
  await db.delete('projects', id)

  // Delete associated assets
  const assets = await db.getAllFromIndex('assets', 'projectId', id)
  for (const asset of assets) {
    await db.delete('assets', asset.id)
  }

  // Delete associated generations
  const generations = await db.getAllFromIndex('generations', 'projectId', id)
  for (const gen of generations) {
    await db.delete('generations', gen.id)
  }
}

// ==================== Assets ====================

/**
 * Save asset
 */
export async function saveAsset(asset) {
  const db = await getDB()
  await db.put('assets', asset)
  return asset
}

/**
 * Get asset by ID
 */
export async function getAsset(id) {
  const db = await getDB()
  return db.get('assets', id)
}

/**
 * Get assets by project ID
 */
export async function getAssetsByProject(projectId) {
  const db = await getDB()
  return db.getAllFromIndex('assets', 'projectId', projectId)
}

/**
 * Get assets by type
 */
export async function getAssetsByType(type) {
  const db = await getDB()
  return db.getAllFromIndex('assets', 'type', type)
}

/**
 * Delete asset
 */
export async function deleteAsset(id) {
  const db = await getDB()
  await db.delete('assets', id)
}

// ==================== Generations ====================

/**
 * Save generation record
 */
export async function saveGeneration(generation) {
  const db = await getDB()
  await db.put('generations', generation)
  return generation
}

/**
 * Get generation by ID
 */
export async function getGeneration(id) {
  const db = await getDB()
  return db.get('generations', id)
}

/**
 * Get generations by project
 */
export async function getGenerationsByProject(projectId) {
  const db = await getDB()
  const generations = await db.getAllFromIndex('generations', 'projectId', projectId)
  return generations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Get generations by shot
 */
export async function getGenerationsByShot(shotId) {
  const db = await getDB()
  const generations = await db.getAllFromIndex('generations', 'shotId', shotId)
  return generations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Delete generation
 */
export async function deleteGeneration(id) {
  const db = await getDB()
  await db.delete('generations', id)
}

// ==================== Settings (localStorage) ====================

const SETTINGS_KEY = 'ai-native-studio-settings'

/**
 * Get settings
 */
export function getSettings() {
  const stored = localStorage.getItem(SETTINGS_KEY)
  return stored ? JSON.parse(stored) : {}
}

/**
 * Save settings
 */
export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * Get API key for provider
 */
export function getApiKey(provider) {
  return localStorage.getItem(`${provider}_api_key`)
}

/**
 * Save API key for provider
 */
export function saveApiKey(provider, key) {
  localStorage.setItem(`${provider}_api_key`, key)
}
