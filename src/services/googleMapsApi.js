/**
 * Google Maps API 服务
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

/**
 * 使用 Google Maps Places API 搜索地点
 * @param {string} query - 搜索关键词
 * @returns {Promise<Array>} 返回地点列表
 */
export async function searchGooglePlaces(query) {
  if (!query || !query.trim()) {
    throw new Error('搜索关键词不能为空')
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API Key 未配置')
  }

  try {
    // 使用 Places API (New) Text Search
    const url = `https://places.googleapis.com/v1/places:searchText`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
      },
      body: JSON.stringify({
        textQuery: query.trim(),
        maxResultCount: 10,
        languageCode: 'zh',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`请求失败: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.places || data.places.length === 0) {
      return []
    }

    // 格式化返回结果
    return data.places.map((place) => ({
      id: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      location: {
        longitude: place.location?.longitude || 0,
        latitude: place.location?.latitude || 0,
      },
      types: place.types || [],
      formatted_address: place.formattedAddress || '',
    }))
  } catch (error) {
    console.error('Google Places 搜索失败:', error)
    throw error
  }
}

/**
 * 使用 Google Maps Geocoding API 搜索附近餐厅
 * @param {Object} params - 搜索参数
 * @param {Object} params.location - 位置信息 { latitude, longitude }
 * @param {number} params.radius - 搜索半径（米）
 * @param {string[]} params.keywords - 关键词数组（菜系）
 * @returns {Promise<Object>} 返回餐厅列表
 */
export async function fetchGoogleRestaurants({ location, radius, keywords = [] }) {
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API Key 未配置')
  }

  try {
    // 构建搜索关键词
    const keywordStr = keywords.length > 0 ? keywords.join(' ') : 'restaurant'
    
    // 使用 Places API (New) Nearby Search
    const url = `https://places.googleapis.com/v1/places:searchNearby`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.phoneNumber,places.websiteUri',
      },
      body: JSON.stringify({
        includedTypes: ['restaurant', 'food', 'meal_takeaway', 'cafe'],
        maxResultCount: 50,
        locationRestriction: {
          circle: {
            center: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radius: radius,
          },
        },
        languageCode: 'zh',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`请求失败: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    let places = data.places || []
    
    // 如果有关键词，进行过滤
    if (keywords.length > 0) {
      const keywordLower = keywords.map(k => k.toLowerCase())
      places = places.filter(place => {
        const name = (place.displayName?.text || '').toLowerCase()
        const address = (place.formattedAddress || '').toLowerCase()
        return keywordLower.some(keyword => name.includes(keyword) || address.includes(keyword))
      })
    }

    // 格式化返回结果
    const pois = places.map((place) => ({
      id: place.id,
      name: place.displayName?.text || '未知餐厅',
      type: place.types?.[0] || 'restaurant',
      address: place.formattedAddress || '',
      distance: 0, // Google API 不直接返回距离，需要计算
      tel: place.phoneNumber || '',
      rating: place.rating || null,
      location: `${place.location?.longitude || 0},${place.location?.latitude || 0}`,
      biz_ext: {
        rating: place.rating?.toString() || null,
      },
    }))

    return {
      pois,
      count: pois.length,
    }
  } catch (error) {
    console.error('获取 Google 餐厅列表失败:', error)
    throw error
  }
}

/**
 * 计算两点之间的距离（米）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
