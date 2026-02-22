/**
 * Modal Provider - 3D Gaussian Splat Reconstruction via Apple ml-sharp
 *
 * Uses Vercel proxy at /api/reconstruct to avoid CORS issues
 * Modal endpoint returns base64-encoded PLY which we convert to blob URL
 */

// Use relative path for Vercel serverless function
const PROXY_ENDPOINT = '/api/reconstruct'

export class ModalProvider {
  constructor() {
    this.name = 'modal'
  }

  /**
   * Convert base64 PLY data to a blob URL that can be loaded by GaussianSplats3D
   */
  base64ToBlob(base64Data, mimeType = 'application/octet-stream') {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  /**
   * Extract base64 data from data URL if present
   */
  extractBase64(dataUrl) {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',')
      return parts[1]
    }
    return dataUrl
  }

  /**
   * Generate 3D reconstruction from an image
   *
   * @param {Object} params
   * @param {string} params.imageUrl - URL of the image to reconstruct
   * @param {string} params.imageBase64 - Base64 data URL (alternative to imageUrl)
   * @returns {Promise<{plyUrl: string, status: string}>}
   */
  async generate3DReconstruction(params) {
    const { imageUrl, imageBase64 } = params

    // Build request body
    const body = {}
    if (imageUrl && !imageUrl.startsWith('data:')) {
      body.image_url = imageUrl
    } else if (imageBase64 || (imageUrl && imageUrl.startsWith('data:'))) {
      // Extract pure base64 from data URL
      const dataUrl = imageBase64 || imageUrl
      body.image_base64 = this.extractBase64(dataUrl)
    } else {
      throw new Error('Either imageUrl or imageBase64 is required')
    }

    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || errorData.message || `Reconstruction failed: ${response.status}`
      )
    }

    const result = await response.json()

    if (result.status !== 'success') {
      throw new Error(result.error || result.message || 'Reconstruction failed')
    }

    // Handle base64 PLY response - convert to blob URL with .ply extension
    if (result.ply_base64) {
      const blob = this.base64ToBlob(result.ply_base64)
      // Create a File object with .ply extension so GaussianSplats3D recognizes the format
      const file = new File([blob], 'scene.ply', { type: 'application/octet-stream' })
      const blobUrl = URL.createObjectURL(file)

      return {
        plyUrl: blobUrl,
        plyBlob: blob, // Also return the blob in case we need it
        status: 'completed',
        provider: this.name,
      }
    }

    // Handle direct URL response
    if (result.ply_url) {
      return {
        plyUrl: result.ply_url,
        status: 'completed',
        provider: this.name,
      }
    }

    throw new Error('No PLY data in response')
  }
}

export const modalProvider = new ModalProvider()
