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
    let queryString = null

    // 处理不同的请求体格式
    // Vercel Serverless Functions 会自动解析 JSON body
    if (typeof req.body === 'string') {
      // 如果请求体是字符串，尝试解析 JSON
      try {
        const parsed = JSON.parse(req.body)
        queryString = parsed.query || parsed
      } catch (e) {
        // 如果不是 JSON，直接使用字符串
        queryString = req.body
      }
    } else if (req.body && typeof req.body === 'object') {
      // 如果请求体是对象（Vercel 会自动解析 JSON）
      queryString = req.body.query || req.body
      
      // 如果 queryString 仍然是对象，尝试转换为字符串
      if (typeof queryString !== 'string') {
        queryString = JSON.stringify(queryString)
      }
    }

    if (!queryString || typeof queryString !== 'string') {
      console.error('Invalid query format:', { 
        bodyType: typeof req.body, 
        body: req.body,
        queryStringType: typeof queryString,
        queryString 
      })
      return res.status(400).json({ 
        error: 'Query is required and must be a string',
        received: typeof req.body,
        body: req.body
      })
    }

    // 调用 Overpass API（增加超时时间）
    // 使用 AbortController 设置 70 秒超时（比查询的 60 秒稍长）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 70000) // 70 秒超时
    
    let response
    try {
      response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'Mozilla/5.0 (compatible; WhatToEatToday/1.0; +https://what-to-eat-today.vercel.app)',
        },
        body: queryString,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        return res.status(504).json({ 
          error: 'Overpass API timeout: Query took too long',
          suggestion: 'Try reducing the search radius'
        })
      }
      throw error
    }

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
