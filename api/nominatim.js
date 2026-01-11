/**
 * Vercel Serverless Function - Nominatim API 代理
 * 用于解决 CORS 问题
 */

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query } = req.query
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' })
    }

    // 构建 Nominatim API URL
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '20',
      'accept-language': 'zh,en',
    })

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

    // 调用 Nominatim API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhatToEatToday/1.0 (Contact: contact@example.com)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Nominatim API error: ${response.statusText}` 
      })
    }

    const data = await response.json()

    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Content-Type', 'application/json')

    return res.status(200).json(data)
  } catch (error) {
    console.error('Nominatim proxy error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
