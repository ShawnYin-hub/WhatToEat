/**
 * GreenStreet API - 使用 OpenStreetMap Overpass API
 * 支持全球范围搜索，包括海外地区
 */

// 直接使用 Overpass API HTTPS 端点（全球免费）
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * 计算两点之间的距离（米）- Haversine公式
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 搜索地点（使用 Nominatim 地理编码API）
 */
export async function searchGreenStreetLocation(keyword) {
  if (!keyword || !keyword.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  try {
    const params = new URLSearchParams({
      q: keyword.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '20',
      'accept-language': 'zh,en',
    })

    const url = `${NOMINATIM_API_URL}?${params.toString()}`

    console.log('GreenStreet 地点搜索请求:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WhatToEatToday/1.0 (https://what-to-eat-today.vercel.app)',
      },
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

    console.log('GreenStreet 地点搜索结果:', data)

    if (!Array.isArray(data) || data.length === 0) {
      return []
    }

    // 格式化返回结果
    return data.map((item) => ({
      id: item.place_id.toString(),
      name: item.display_name.split(',')[0] || item.display_name,
      address: item.display_name,
      location: {
        longitude: parseFloat(item.lon),
        latitude: parseFloat(item.lat),
      },
      formatted_address: item.display_name,
    }))
  } catch (error) {
    console.error('GreenStreet 地点搜索失败:', error)

    if (error.message.includes('fetch')) {
      throw new Error('网络请求失败，请检查网络连接或稍后重试')
    }

    throw error
  }
}

/**
 * 搜索附近餐厅（使用 Overpass API）
 */
export async function fetchGreenStreetRestaurants({ location, radius, keywords = [] }) {
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  try {
    // 构建 Overpass QL 查询语句
    // 使用更简单可靠的查询方式，增加超时时间到 60 秒
    // 注意：Overpass QL 的 out 语句不支持 limit 参数，需要在结果中限制数量
    const query = `
      [out:json][timeout:60];
      (
        node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
        way["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
      );
      out center;
    `.trim()

    console.log('GreenStreet Overpass 查询:', query.substring(0, 200) + '...')

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'WhatToEatToday/1.0 (https://what-to-eat-today.vercel.app)',
      },
      body: query,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Overpass API 错误响应:', errorText)
      
      // 尝试解析错误响应（可能是 JSON 格式的错误信息）
      let errorMessage = `请求失败: ${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch (e) {
        // 如果不是 JSON，检查是否是 HTML
        if (errorText && errorText.length > 0) {
          const preview = errorText.substring(0, 200)
          if (preview.includes('ODbL') || preview.includes('openstreetmap.org') || preview.trim().startsWith('<!DOCTYPE') || preview.trim().startsWith('<html')) {
            errorMessage = 'Overpass API 暂时无法访问，请稍后再试'
          }
        }
      }
      
      throw new Error(errorMessage)
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

    console.log('GreenStreet Overpass 响应:', { 
      elementsCount: data.elements?.length,
      elements: data.elements?.slice(0, 3) // 只打印前3个作为示例
    })

    if (!data.elements || data.elements.length === 0) {
      console.warn('GreenStreet 查询返回空结果')
      return {
        pois: [],
        count: 0,
      }
    }

    // 格式化返回结果，限制返回数量为 50 个
    const pois = data.elements
      .slice(0, 50) // 限制返回数量为 50 个
      .map((element) => {
        // 处理坐标：node 有 lat/lon，way 有 center
        let lat, lon
        if (element.type === 'node') {
          lat = element.lat
          lon = element.lon
        } else if (element.type === 'way') {
          lat = element.center?.lat
          lon = element.center?.lon
        } else {
          lat = element.center?.lat || element.lat
          lon = element.center?.lon || element.lon
        }

        if (!lat || !lon) {
          console.warn('缺少坐标信息:', element.type, element.id)
          return null
        }

        // 计算距离
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          lat,
          lon
        )

        // 如果有关键词，进行名称过滤
        if (keywords.length > 0) {
          const name = (element.tags?.name || '').toLowerCase()
          const nameEn = (element.tags?.['name:en'] || '').toLowerCase()
          const cuisine = (element.tags?.cuisine || '').toLowerCase()
          
          const keywordLower = keywords.map(k => k.toLowerCase())
          const matches = keywordLower.some(keyword => 
            name.includes(keyword) || 
            nameEn.includes(keyword) || 
            cuisine.includes(keyword)
          )
          
          if (!matches) {
            return null // 不匹配关键词，过滤掉
          }
        }

        // 构建地址
        const addressParts = []
        if (element.tags?.['addr:housenumber']) {
          addressParts.push(element.tags['addr:housenumber'])
        }
        if (element.tags?.['addr:street']) {
          addressParts.push(element.tags['addr:street'])
        }
        if (element.tags?.['addr:city']) {
          addressParts.push(element.tags['addr:city'])
        }
        if (element.tags?.['addr:country']) {
          addressParts.push(element.tags['addr:country'])
        }
        
        const address = addressParts.length > 0 
          ? addressParts.join(' ') 
          : (element.tags?.['addr:full'] || element.tags?.['addr:road'] || '地址未知')

        return {
          id: `${element.type}-${element.id}`,
          name: element.tags?.name || element.tags?.['name:en'] || element.tags?.alt_name || '未知餐厅',
          type: element.tags?.amenity || 'restaurant',
          address: address,
          distance: Math.round(distance),
          tel: element.tags?.phone || element.tags?.['contact:phone'] || element.tags?.['contact:mobile'] || '',
          rating: null, // OSM 不提供评分
          location: `${lon},${lat}`,
          biz_ext: {
            rating: null,
          },
        }
      })
      .filter(Boolean) // 过滤掉无效项和关键词不匹配的项
      .sort((a, b) => a.distance - b.distance) // 按距离排序
    
    console.log('GreenStreet 格式化后的结果:', { 
      totalElements: data.elements.length,
      filteredPois: pois.length,
      sample: pois[0] 
    })

    return {
      pois,
      count: pois.length,
    }
  } catch (error) {
    console.error('获取 GreenStreet 餐厅列表失败:', error)
    throw error
  }
}
