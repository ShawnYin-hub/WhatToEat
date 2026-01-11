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
    // 获取查询参数
    const queryParam = req.query.q || req.query.query
    
    if (!queryParam) {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }

    // 构建 Nominatim API URL
    const params = new URLSearchParams({
      q: queryParam,
      format: 'json',
      addressdetails: '1',
      limit: '20',
      'accept-language': 'zh,en',
    })

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

    // 调用 Nominatim API
    // 注意：Nominatim API 严格要求设置 User-Agent，且不能是默认的浏览器 User-Agent
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatToEatToday/1.0; +https://what-to-eat-today.vercel.app)',
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      // 尝试获取错误详情
      let errorDetail = response.statusText
      try {
        const errorText = await response.text()
        if (errorText) {
          errorDetail = errorText.substring(0, 200) // 限制长度
        }
      } catch (e) {
        // 忽略错误
      }
      
      console.error('Nominatim API error:', {
        status: response.status,
        statusText: response.statusText,
        detail: errorDetail
      })
      
      return res.status(response.status).json({ 
        error: `Nominatim API error: ${response.statusText}`,
        detail: errorDetail
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
