/**
 * 统一位置服务接口
 * 根据地图服务类型调用不同的API
 */

import { searchPOI, searchPOIJsonp } from './poiSearchApi'
import { fetchRestaurants } from './amapApi'
import { fetchRestaurantsJsonp } from './amapApiJsonp'
import { searchGooglePlaces, fetchGoogleRestaurants } from './googleMapsApi'
import { searchGreenStreetLocation, fetchGreenStreetRestaurants } from './greenstreetApi'

/**
 * 搜索地点（统一接口）
 */
export async function searchLocation(keyword, serviceType = 'amap') {
  if (serviceType === 'google') {
    return await searchGooglePlaces(keyword)
  } else if (serviceType === 'greenstreet') {
    // GreenStreet - 使用高德地图 API
    return await searchGreenStreetLocation(keyword)
  } else {
    // 高德地图
    try {
      return await searchPOI(keyword)
    } catch (error) {
      console.warn('Fetch 请求失败，尝试 JSONP:', error)
      return await searchPOIJsonp(keyword)
    }
  }
}

/**
 * 搜索附近餐厅（统一接口）
 */
export async function searchRestaurants({ location, radius, keywords = [] }, serviceType = 'amap') {
  if (serviceType === 'google') {
    return await fetchGoogleRestaurants({ location, radius, keywords })
  } else if (serviceType === 'greenstreet') {
    // GreenStreet - 使用高德地图 API
    return await fetchGreenStreetRestaurants({ location, radius, keywords })
  } else {
    // 高德地图
    // 优先使用 fetch API（通过代理，更可靠）
    try {
      return await fetchRestaurants({ location, radius, keywords })
    } catch (error) {
      console.warn('Fetch 请求失败，尝试 JSONP 备用方案:', error)
      // JSONP 作为最后备用方案（注意：通过内网穿透时可能失败）
      try {
        return await fetchRestaurantsJsonp({ location, radius, keywords })
      } catch (jsonpError) {
        // 如果 JSONP 也失败，抛出更友好的错误信息
        console.error('所有 API 请求方式都失败了:', jsonpError)
        throw new Error('无法连接到地图服务，请检查网络连接。如果使用内网穿透工具，请确保代理配置正确。')
      }
    }
  }
}
