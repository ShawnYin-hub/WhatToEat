/**
 * 高德地图地理编码 API - 地址转经纬度
 */

// 使用代理或直接调用
const AMAP_API_KEY = import.meta.env.VITE_AMAP_KEY || ''
// 开发环境使用代理，生产环境直接调用
const GEOCODE_API_BASE_URL = import.meta.env.DEV
  ? '/api/amap/v3/geocode/geo'  // 开发环境使用代理
  : 'https://restapi.amap.com/v3/geocode/geo'  // 生产环境直接调用

/**
 * 将地址转换为经纬度
 * @param {string} address - 地址字符串
 * @returns {Promise<Object>} 返回 { latitude, longitude, formatted_address }
 */
export async function geocodeAddress(address) {
  if (!address || !address.trim()) {
    throw new Error('地址不能为空')
  }

  if (!AMAP_API_KEY) {
    throw new Error('高德地图 API Key 未配置')
  }

  const params = new URLSearchParams({
    key: AMAP_API_KEY,
    address: address.trim(),
    output: 'json',
  })

  try {
    const url = `${GEOCODE_API_BASE_URL}?${params.toString()}`
    console.log('地理编码请求 URL:', url.replace(AMAP_API_KEY, 'API_KEY_HIDDEN'))

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
    
    console.log('地理编码 API 响应:', data)

    if (data.status !== '1') {
      throw new Error(`API 返回错误: ${data.info || data.infocode || '未知错误'}`)
    }

    if (!data.geocodes || data.geocodes.length === 0) {
      throw new Error('未找到该地址，请检查地址是否正确')
    }

    const geocode = data.geocodes[0]
    const [longitude, latitude] = geocode.location.split(',').map(Number)

    return {
      latitude,
      longitude,
      formatted_address: geocode.formatted_address || geocode.address,
      province: geocode.province,
      city: geocode.city,
      district: geocode.district,
    }
  } catch (error) {
    console.error('地理编码失败:', error)

    if (error.message.includes('fetch')) {
      throw new Error('网络请求失败，请检查网络连接或稍后重试')
    }

    throw error
  }
}

/**
 * JSONP 版本的地理编码（备用方案）
 */
export function geocodeAddressJsonp(address) {
  return new Promise((resolve, reject) => {
    if (!address || !address.trim()) {
      reject(new Error('地址不能为空'))
      return
    }

    // API Key 已硬编码，无需检查

    const callbackName = `geocode_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const script = document.createElement('script')

    window[callbackName] = (data) => {
      delete window[callbackName]
      document.body.removeChild(script)

      if (data.status !== '1') {
        reject(new Error(`API 返回错误: ${data.info || '未知错误'}`))
        return
      }

      if (!data.geocodes || data.geocodes.length === 0) {
        reject(new Error('未找到该地址，请检查地址是否正确'))
        return
      }

      const geocode = data.geocodes[0]
      const [longitude, latitude] = geocode.location.split(',').map(Number)

      resolve({
        latitude,
        longitude,
        formatted_address: geocode.formatted_address || geocode.address,
        province: geocode.province,
        city: geocode.city,
        district: geocode.district,
      })
    }

    script.onerror = () => {
      delete window[callbackName]
      document.body.removeChild(script)
      reject(new Error('JSONP 请求失败'))
    }

    const params = new URLSearchParams({
      key: AMAP_API_KEY,
      address: address.trim(),
      output: 'json',
    })

    script.src = `https://restapi.amap.com/v3/geocode/geo?${params.toString()}&callback=${callbackName}`
    document.body.appendChild(script)
  })
}
