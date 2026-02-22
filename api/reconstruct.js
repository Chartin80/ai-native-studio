/**
 * Vercel Serverless Function - Proxy for Modal 3D Reconstruction
 *
 * Proxies requests to Modal endpoint to avoid CORS issues
 * Handles both image URLs and base64 images
 */

const MODAL_ENDPOINT = 'https://chartin80--apple-sharp-sharpmodel-generate.modal.run'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image_url, image_base64 } = req.body

    if (!image_url && !image_base64) {
      return res.status(400).json({ error: 'image_url or image_base64 is required' })
    }

    // Build request body for Modal
    // Modal expects 'image' for base64 or 'image_url' for URLs
    const modalBody = {}
    if (image_url) {
      modalBody.image_url = image_url
    } else if (image_base64) {
      // Modal expects the field to be named 'image' for base64 data
      modalBody.image = image_base64
    }

    console.log('Calling Modal endpoint with:', Object.keys(modalBody))

    const response = await fetch(MODAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modalBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Modal error:', response.status, errorText)
      return res.status(response.status).json({
        error: `Modal API error: ${response.status}`,
        details: errorText
      })
    }

    const result = await response.json()
    console.log('Modal response keys:', Object.keys(result))

    // Modal returns { success: true, ply_base64: "..." }
    if (result.success && result.ply_base64) {
      return res.status(200).json({
        status: 'success',
        ply_base64: result.ply_base64,
      })
    }

    // Handle other response formats
    if (result.ply_url) {
      return res.status(200).json({
        status: 'success',
        ply_url: result.ply_url,
      })
    }

    return res.status(200).json(result)

  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    })
  }
}
