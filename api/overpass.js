/**
 * Vercel Serverless Function - Overpass API 代理
 * 用于解决 CORS 问题和搜索餐厅
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    // 确保 query 是字符串格式（Overpass QL 查询语句）
    const queryString = typeof query === 'string' ? query : query

    // 调用 Overpass API
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'WhatToEatToday/1.0',
      },
      body: queryString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Overpass API error:', errorText)
      return res.status(response.status).json({ 
        error: `Overpass API error: ${response.statusText}` 
      })
    }

    const data = await response.json()

    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Content-Type', 'application/json')

    return res.status(200).json(data)
  } catch (error) {
    console.error('Overpass proxy error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
