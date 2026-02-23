/**
 * Storage Service - Handle file uploads to Supabase Storage
 */

import { supabase, isSupabaseConfigured } from './client'
import { v4 as uuid } from 'uuid'

const BUCKETS = {
  images: 'images',
  videos: 'videos',
  audio: 'audio',
  ply: 'ply-files',
}

class StorageService {
  /**
   * Upload a file to Supabase Storage
   * @param {File|Blob} file - The file to upload
   * @param {string} bucket - The bucket name (images, videos, audio, ply)
   * @param {string} projectId - The project ID for organization
   * @returns {Promise<{url: string, path: string}>}
   */
  async uploadFile(file, bucket, projectId) {
    if (!isSupabaseConfigured()) {
      // Return data URL for local mode
      return this.fileToDataUrl(file)
    }

    const bucketName = BUCKETS[bucket] || bucket
    const ext = file.name?.split('.').pop() || 'bin'
    const fileName = `${projectId}/${uuid()}.${ext}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
      bucket: bucketName,
    }
  }

  /**
   * Upload image from data URL
   */
  async uploadDataUrl(dataUrl, bucket, projectId, fileName) {
    if (!isSupabaseConfigured()) {
      return { url: dataUrl, path: null, bucket: null }
    }

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    const bucketName = BUCKETS[bucket] || bucket
    const ext = fileName?.split('.').pop() || 'png'
    const path = `${projectId}/${uuid()}.${ext}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
      bucket: bucketName,
    }
  }

  /**
   * Upload from external URL (download and re-upload)
   */
  async uploadFromUrl(url, bucket, projectId) {
    if (!isSupabaseConfigured()) {
      return { url, path: null, bucket: null }
    }

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const ext = url.split('.').pop()?.split('?')[0] || 'bin'

      return this.uploadFile(
        new File([blob], `download.${ext}`, { type: blob.type }),
        bucket,
        projectId
      )
    } catch (error) {
      console.warn('Failed to re-upload from URL, using original:', error)
      return { url, path: null, bucket: null }
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket, path) {
    if (!isSupabaseConfigured()) return

    const bucketName = BUCKETS[bucket] || bucket
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])

    if (error) throw error
  }

  /**
   * List files in a project folder
   */
  async listFiles(bucket, projectId) {
    if (!isSupabaseConfigured()) return []

    const bucketName = BUCKETS[bucket] || bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(projectId)

    if (error) throw error
    return data
  }

  /**
   * Convert file to data URL (for local fallback)
   */
  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({
        url: reader.result,
        path: null,
        bucket: null,
      })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Check if cloud storage is available
   */
  isCloudEnabled() {
    return isSupabaseConfigured()
  }
}

export const storageService = new StorageService()
