/**
 * 高德地图地理编码 API - 地址转经纬度
 */

const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY
const GEOCODE_API_BASE_URL = import.meta.env.DEV
  ? '/api/amap/v3/geocode/geo'
  : 'https://restapi.amap.com/v3/geocode/geo'

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
    throw new Error('API Key 未配置，请检查 .env.local 文件')
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
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HTTP 错误响应:', response.status, errorText)
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
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

    if (!AMAP_API_KEY) {
      reject(new Error('API Key 未配置'))
      return
    }

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
