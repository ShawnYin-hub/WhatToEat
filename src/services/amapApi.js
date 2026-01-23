/**
 * 高德地图 Web 服务 API 调用
 */

// 使用 Vite proxy 避免跨域问题
// 开发环境使用相对路径 /amap，生产环境可以配置反向代理或使用 CORS
const AMAP_API_BASE_URL = import.meta.env.DEV 
  ? '/amap/v3/place/around'  // 开发环境使用 proxy
  : 'https://restapi.amap.com/v3/place/around'  // 生产环境直接调用（需要配置 CORS 或反向代理）
const AMAP_API_KEY = import.meta.env.VITE_AMAP_KEY || ''

/**
 * 获取附近的餐厅
 * @param {Object} params - 搜索参数
 * @param {Object} params.location - 位置信息 { latitude, longitude }
 * @param {number} params.radius - 搜索半径（米）
 * @param {string[]} params.keywords - 关键词数组（菜系）
 * @returns {Promise<Object>} 返回餐厅列表
 */
export async function fetchRestaurants({ location, radius, keywords = [] }) {
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  if (!AMAP_API_KEY) {
    throw new Error('高德地图 API Key 未配置')
  }

  // 构建关键词，如果有多个则用 | 分隔
  const keywordStr = keywords.length > 0 ? keywords.join('|') : ''

  // 构建请求 URL
  const params = new URLSearchParams({
    key: AMAP_API_KEY,
    location: `${location.longitude},${location.latitude}`, // 注意：高德API要求经度在前
    types: '050000', // 餐饮服务分类码
    radius: radius.toString(),
    offset: '50', // 每页记录数，最多50
    page: '1',
    output: 'json',
  })

  // 如果有关键词，添加到参数中
  if (keywordStr) {
    params.append('keywords', keywordStr)
  }

  try {
    const url = `${AMAP_API_BASE_URL}?${params.toString()}`
    console.log('请求 URL:', url.replace(AMAP_API_KEY, 'API_KEY_HIDDEN'))
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // 移动端 WebView 友好：显式声明为 XHR
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
      credentials: 'omit',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP 错误响应:', response.status, errorText)
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    // 检查响应内容类型，确保是 JSON 而不是 HTML
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const responseText = await response.text()
      // 检查是否是 HTML 响应
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.trim().startsWith('<?xml')) {
        throw new Error('服务器返回了 HTML 页面，请检查 API 配置')
      }
      throw new Error(`服务器返回了非 JSON 格式: ${contentType}`)
    }

    const responseText = await response.text()
    // 再次检查响应文本，确保不是 HTML
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html') || responseText.trim().startsWith('<?xml')) {
      throw new Error('服务器返回了 HTML 页面，请检查 API 配置')
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError, '响应内容:', responseText.substring(0, 200))
      throw new Error('服务器返回了无效的 JSON 数据')
    }
    
    console.log('API 响应:', data)

    if (data.status !== '1') {
      throw new Error(`API 返回错误: ${data.info || data.infocode || '未知错误'}`)
    }

    return {
      pois: data.pois || [],
      count: parseInt(data.count || '0', 10),
    }
  } catch (error) {
    console.error('获取餐厅列表失败:', error)
    
    // 提供更友好的错误信息
    if (error.message.includes('fetch')) {
      throw new Error('网络请求失败，请检查网络连接或稍后重试')
    }
    
    throw error
  }
}

/**
 * 从餐厅列表中随机选择一个
 * @param {Array} restaurants - 餐厅列表
 * @returns {Object|null} 随机选择的餐厅，如果没有餐厅则返回 null
 */
export function getRandomRestaurant(restaurants) {
  if (!restaurants || restaurants.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * restaurants.length)
  return restaurants[randomIndex]
}
