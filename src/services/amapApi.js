/**
 * 高德地图 Web 服务 API 调用
 */

// 开发环境使用代理，生产环境直接调用（需要后端支持或使用其他方案）
const AMAP_API_BASE_URL = import.meta.env.DEV
  ? '/api/amap/v3/place/around'
  : 'https://restapi.amap.com/v3/place/around'
const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY

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
    throw new Error('API Key 未配置，请检查 .env.local 文件')
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
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP 错误响应:', response.status, errorText)
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
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
