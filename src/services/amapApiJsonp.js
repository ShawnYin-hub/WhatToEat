/**
 * 高德地图 Web 服务 API 调用 - JSONP 备用方案
 * 注意：通过内网穿透工具（如 Cloudflare Tunnel）时，JSONP 可能失败
 * 建议优先使用 fetch API + 代理方案
 */

// 使用代理避免跨域问题（开发环境）
const AMAP_API_BASE_URL = import.meta.env.DEV 
  ? '/amap/v3/place/around'  // 开发环境使用 proxy
  : 'https://restapi.amap.com/v3/place/around'  // 生产环境直接调用
const AMAP_API_KEY = import.meta.env.VITE_AMAP_KEY || ''

/**
 * JSONP 请求封装
 */
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `amap_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const script = document.createElement('script')
    let timeoutId = null
    
    // 设置超时
    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('JSONP 请求超时'))
    }, 30000) // 30秒超时
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (window[callbackName]) {
        delete window[callbackName]
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
    
    window[callbackName] = (data) => {
      cleanup()
      resolve(data)
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('JSONP 请求失败'))
    }

    try {
      script.src = `${url}&callback=${callbackName}`
      document.body.appendChild(script)
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

/**
 * 获取附近的餐厅 - JSONP 版本
 */
export async function fetchRestaurantsJsonp({ location, radius, keywords = [] }) {
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  // API Key 已硬编码，无需检查

  const keywordStr = keywords.length > 0 ? keywords.join('|') : ''

  const params = new URLSearchParams({
    key: AMAP_API_KEY,
    location: `${location.longitude},${location.latitude}`,
    types: '050000',
    radius: radius.toString(),
    offset: '50',
    page: '1',
    output: 'json',
  })

  if (keywordStr) {
    params.append('keywords', keywordStr)
  }

  // 优先使用代理 URL（开发环境），避免跨域问题
  const url = `${AMAP_API_BASE_URL}?${params.toString()}`

  try {
    // 如果是开发环境使用代理，尝试先使用 fetch（更可靠）
    if (import.meta.env.DEV && url.startsWith('/amap')) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        })
        
        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.status !== '1') {
          throw new Error(`API 返回错误: ${data.info || '未知错误'}`)
        }

        return {
          pois: data.pois || [],
          count: parseInt(data.count || '0', 10),
        }
      } catch (fetchError) {
        console.warn('Fetch 请求失败，尝试 JSONP:', fetchError)
        // 如果 fetch 失败，继续尝试 JSONP（但 JSONP 在代理环境下也可能失败）
      }
    }
    
    // JSONP 请求（仅在生产环境或 fetch 失败时使用）
    // 注意：通过内网穿透时，JSONP 可能失败
    const jsonpUrl = url.startsWith('/') 
      ? `https://restapi.amap.com/v3/place/around?${params.toString()}`
      : url
    const data = await jsonp(jsonpUrl)

    if (data.status !== '1') {
      throw new Error(`API 返回错误: ${data.info || '未知错误'}`)
    }

    return {
      pois: data.pois || [],
      count: parseInt(data.count || '0', 10),
    }
  } catch (error) {
    console.error('获取餐厅列表失败 (JSONP):', error)
    throw error
  }
}
