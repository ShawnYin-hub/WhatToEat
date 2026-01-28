/**
 * 高德地图 POI 搜索 API - 更精确的地点搜索
 */

// 使用代理或直接调用
const AMAP_API_KEY = import.meta.env.VITE_AMAP_KEY || ''
// 开发环境使用代理，生产环境直接调用
const POI_SEARCH_API_BASE_URL = import.meta.env.DEV
  ? '/api/amap/v3/place/text'  // 开发环境使用代理
  : 'https://restapi.amap.com/v3/place/text'  // 生产环境直接调用

/**
 * 搜索地点（POI搜索，比地理编码更准确）
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 返回地点列表
 */
export async function searchPOI(keyword) {
  if (!keyword || !keyword.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  if (!AMAP_API_KEY) {
    throw new Error('高德地图 API Key 未配置')
  }

  const params = new URLSearchParams({
    key: AMAP_API_KEY,
    keywords: keyword.trim(),
    types: '', // 不限制类型，搜索所有POI
    city: '', // 不限制城市，全国搜索
    offset: '20', // 返回20个结果
    page: '1',
    extensions: 'base', // 返回基本信息
    output: 'json',
  })

  try {
    const url = `${POI_SEARCH_API_BASE_URL}?${params.toString()}`
    console.log('POI 搜索请求 URL:', url.replace(AMAP_API_KEY, 'API_KEY_HIDDEN'))

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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
    
    console.log('POI 搜索 API 响应:', data)

    if (data.status !== '1') {
      throw new Error(`API 返回错误: ${data.info || data.infocode || '未知错误'}`)
    }

    const pois = data.pois || []
    
    // 格式化返回结果
    return pois.map((poi) => ({
      id: poi.id,
      name: poi.name,
      address: poi.address || poi.pname + poi.cityname + poi.adname,
      location: {
        longitude: parseFloat(poi.location.split(',')[0]),
        latitude: parseFloat(poi.location.split(',')[1]),
      },
      type: poi.type,
      typecode: poi.typecode,
      pname: poi.pname, // 省份
      cityname: poi.cityname, // 城市
      adname: poi.adname, // 区县
      formatted_address: `${poi.pname}${poi.cityname}${poi.adname}${poi.address || ''}`,
    }))
  } catch (error) {
    console.warn('POI 搜索失败（已降级）:', error.message || error)
    
    // 降级：返回空数组，不阻塞页面
    if (error.message.includes('fetch') || error.message.includes('CONNECTION')) {
      return [] // 网络错误时返回空数组，让 UI 正常显示
    }
    
    // 其他错误也返回空数组，不抛出异常
    return []
  }
}

/**
 * JSONP 版本的 POI 搜索（备用方案）
 */
export function searchPOIJsonp(keyword) {
  return new Promise((resolve, reject) => {
    if (!keyword || !keyword.trim()) {
      reject(new Error('搜索关键词不能为空'))
      return
    }

    // API Key 已硬编码，无需检查

    const callbackName = `poi_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const script = document.createElement('script')

    window[callbackName] = (data) => {
      delete window[callbackName]
      document.body.removeChild(script)

      if (data.status !== '1') {
        reject(new Error(`API 返回错误: ${data.info || '未知错误'}`))
        return
      }

      const pois = data.pois || []
      const formattedPois = pois.map((poi) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname,
        location: {
          longitude: parseFloat(poi.location.split(',')[0]),
          latitude: parseFloat(poi.location.split(',')[1]),
        },
        type: poi.type,
        typecode: poi.typecode,
        pname: poi.pname,
        cityname: poi.cityname,
        adname: poi.adname,
        formatted_address: `${poi.pname}${poi.cityname}${poi.adname}${poi.address || ''}`,
      }))

      resolve(formattedPois)
    }

    script.onerror = () => {
      delete window[callbackName]
      document.body.removeChild(script)
      reject(new Error('JSONP 请求失败'))
    }

    const params = new URLSearchParams({
      key: AMAP_API_KEY,
      keywords: keyword.trim(),
      types: '',
      city: '',
      offset: '20',
      page: '1',
      extensions: 'base',
      output: 'json',
    })

    script.src = `https://restapi.amap.com/v3/place/text?${params.toString()}&callback=${callbackName}`
    document.body.appendChild(script)
  })
}
