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

    // 调试：记录接收到的请求
    console.log('Overpass API 请求:', {
      method: req.method,
      bodyType: typeof req.body,
      bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : null,
      bodyPreview: typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200)
    })

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
      // 只使用 req.body.query，如果不存在则返回错误
      if (req.body.query && typeof req.body.query === 'string') {
        queryString = req.body.query
      } else {
        console.error('Request body object does not contain valid query string:', {
          bodyKeys: Object.keys(req.body),
          queryType: typeof req.body.query,
          queryValue: req.body.query
        })
        return res.status(400).json({ 
          error: 'Request body must contain a "query" property with a string value',
          received: Object.keys(req.body)
        })
      }
    }

    console.log('解析后的 queryString:', {
      type: typeof queryString,
      length: queryString ? queryString.length : 0,
      preview: queryString ? queryString.substring(0, 200) : null
    })

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
      const contentType = response.headers.get('content-type') || ''
      
      // 检查是否是 HTML 错误页面
      const isHtmlError = contentType.includes('text/html') || errorText.trim().startsWith('<?xml') || errorText.trim().startsWith('<!DOCTYPE')
      
      console.error('Overpass API error:', {
        status: response.status,
        statusText: response.statusText,
        contentType: contentType,
        isHtmlError: isHtmlError,
        errorText: errorText.substring(0, 500), // 限制长度
        queryPreview: queryString.substring(0, 200) // 查询预览
      })
      
      // 如果是 HTML 错误，尝试提取错误信息
      let errorMessage = response.statusText
      if (isHtmlError) {
        // 尝试从 HTML 中提取错误信息
        const errorMatch = errorText.match(/<p[^>]*>(.*?)<\/p>/i) || errorText.match(/<h1[^>]*>(.*?)<\/h1>/i)
        if (errorMatch) {
          errorMessage = errorMatch[1].replace(/<[^>]*>/g, '').trim()
        }
        // 如果没有找到，使用通用的错误消息
        if (!errorMessage || errorMessage === response.statusText) {
          errorMessage = 'Overpass API returned an error page. The query may be invalid or the server is experiencing issues.'
        }
      }
      
      return res.status(response.status).json({ 
        error: `Overpass API error: ${errorMessage}`,
        detail: isHtmlError ? 'HTML error page returned' : errorText.substring(0, 200),
        status: response.status
      })
    }

    // 检查响应内容类型
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const responseText = await response.text()
      console.error('Overpass API returned non-JSON response:', {
        contentType: contentType,
        responsePreview: responseText.substring(0, 500)
      })
      return res.status(502).json({
        error: 'Overpass API returned non-JSON response',
        contentType: contentType
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
