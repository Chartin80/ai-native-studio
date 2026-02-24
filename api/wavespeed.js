/**
 * Vercel Serverless Function - Proxy for Wavespeed API
 * Handles Nano Banana Pro Edit and other Wavespeed endpoints
 */

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY || 'df60bb6a3229d10abe24f8947d49c43aa93102628557fc33a31980c9c662dc3e'
const BASE_URL = 'https://api.wavespeed.ai/api/v3'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { endpoint, _method, ...body } = req.body

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' })
    }

    const url = `${BASE_URL}/${endpoint}`
    const method = _method || req.method
    console.log('Proxying to Wavespeed:', method, url)

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WAVESPEED_API_KEY}`,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })

    const contentType = response.headers.get('content-type')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Wavespeed error:', response.status, errorText)
      return res.status(response.status).json({
        error: `Wavespeed API error: ${response.status}`,
        details: errorText
      })
    }

    if (contentType?.includes('application/json')) {
      const result = await response.json()
      return res.status(200).json(result)
    } else {
      const text = await response.text()
      return res.status(200).send(text)
    }

  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    })
  }
}
