/**
 * 导航工具函数
 * 根据地图服务类型生成导航 URL 或复制地址
 */

/**
 * 生成导航 URL
 * @param {Object} restaurant - 餐厅信息
 * @param {string} mapService - 地图服务类型 ('amap' | 'greenstreet')
 * @returns {string|null} 导航 URL，如果无法生成则返回 null
 */
export function getNavigationUrl(restaurant, mapService = 'amap') {
  if (!restaurant || !restaurant.location) {
    return null
  }

  // 获取坐标
  let lat, lng
  if (typeof restaurant.location === 'string') {
    // 高德地图格式："经度,纬度"
    const [lngStr, latStr] = restaurant.location.split(',')
    lng = parseFloat(lngStr)
    lat = parseFloat(latStr)
  } else if (typeof restaurant.location === 'object') {
    // GreenStreet/高德地图格式：{ latitude, longitude } 或 { lng, lat }
    if (restaurant.location.latitude && restaurant.location.longitude) {
      lat = parseFloat(restaurant.location.latitude)
      lng = parseFloat(restaurant.location.longitude)
    } else if (restaurant.location.lat && restaurant.location.lng) {
      lat = parseFloat(restaurant.location.lat)
      lng = parseFloat(restaurant.location.lng)
    }
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null
  }

  // 根据地图服务类型生成导航 URL
  if (mapService === 'greenstreet') {
    // GreenStreet - 使用 Google Maps（支持全球导航）
    // 使用坐标导航（即使没有 API Key，也可以打开地图并显示位置）
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  } else {
    // 高德地图
    const location = `${lng},${lat}`
    return `https://uri.amap.com/navigation?to=${location}&toName=${encodeURIComponent(restaurant.name || '目的地')}&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=1`
  }
}

/**
 * 复制地址到剪贴板
 * @param {Object} restaurant - 餐厅信息
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyAddressToClipboard(restaurant) {
  if (!restaurant) {
    return false
  }

  // 构建要复制的文本
  let textToCopy = restaurant.name || ''
  
  if (restaurant.address) {
    textToCopy += textToCopy ? `\n${restaurant.address}` : restaurant.address
  }

  // 如果有坐标，也包含坐标
  if (restaurant.location) {
    let locationStr = ''
    if (typeof restaurant.location === 'string') {
      locationStr = restaurant.location
    } else if (typeof restaurant.location === 'object') {
      if (restaurant.location.latitude && restaurant.location.longitude) {
        locationStr = `${restaurant.location.latitude},${restaurant.location.longitude}`
      } else if (restaurant.location.lat && restaurant.location.lng) {
        locationStr = `${restaurant.location.lat},${restaurant.location.lng}`
      }
    }
    if (locationStr) {
      textToCopy += `\n坐标: ${locationStr}`
    }
  }

  try {
    // 使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy)
      return true
    } else {
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}
