/**
 * 高德地图 Web 服务 API 调用 - JSONP 备用方案
 */

const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY

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

  if (!AMAP_API_KEY) {
    throw new Error('API Key 未配置，请检查 .env.local 文件')
  }

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

  const url = `https://restapi.amap.com/v3/place/around?${params.toString()}`

  try {
    const data = await jsonp(url)

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
