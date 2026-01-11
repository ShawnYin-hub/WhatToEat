/**
 * OpenStreetMap Overpass API - 完全免费，无需API Key
 * 适用于全球范围，包括海外地区
 */

// 开发环境使用代理，生产环境直接调用（生产环境需要后端代理或使用其他方案）
const NOMINATIM_BASE_URL = import.meta.env.DEV
  ? '/api/nominatim'
  : 'https://nominatim.openstreetmap.org'

const OVERPASS_API_URL = import.meta.env.DEV
  ? '/api/overpass/api/interpreter'
  : 'https://overpass-api.de/api/interpreter'

/**
 * 搜索地点（使用 Nominatim 地理编码API）
 */
export async function searchOSMLocation(query) {
  if (!query || !query.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '20',
      'accept-language': 'zh,en',
    })

    const url = `${NOMINATIM_BASE_URL}?${params.toString()}`

    console.log('OSM 地点搜索请求:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('OSM 地点搜索结果:', data)

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
    console.error('OSM 地点搜索失败:', error)
    throw error
  }
}

/**
 * 搜索附近餐厅（使用 Overpass API）
 */
export async function fetchOSMRestaurants({ location, radius, keywords = [] }) {
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  try {
    // 构建 Overpass QL 查询语句
    // 使用更简单可靠的查询方式
    
    // Overpass QL 查询 - 简化版本，更稳定
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
        way["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
      );
      out center;
    `.trim()

    console.log('OSM Overpass 查询:', query.substring(0, 200) + '...')

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Overpass API 错误响应:', errorText)
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('OSM Overpass 响应:', { 
      elementsCount: data.elements?.length,
      elements: data.elements?.slice(0, 3) // 只打印前3个作为示例
    })

    if (!data.elements || data.elements.length === 0) {
      console.warn('OSM 查询返回空结果')
      return {
        pois: [],
        count: 0,
      }
    }

    // 格式化返回结果
    const pois = data.elements
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
    
    console.log('OSM 格式化后的结果:', { 
      totalElements: data.elements.length,
      filteredPois: pois.length,
      sample: pois[0] 
    })

    return {
      pois,
      count: pois.length,
    }
  } catch (error) {
    console.error('获取 OSM 餐厅列表失败:', error)
    throw error
  }
}

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
