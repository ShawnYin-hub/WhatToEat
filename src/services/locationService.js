/**
 * 统一位置服务接口
 * 根据地图服务类型调用不同的API
 */

import { searchPOI, searchPOIJsonp } from './poiSearchApi'
import { fetchRestaurants } from './amapApi'
import { fetchRestaurantsJsonp } from './amapApiJsonp'
import { searchGooglePlaces, fetchGoogleRestaurants } from './googleMapsApi'
import { searchOSMLocation, fetchOSMRestaurants } from './osmApi'

/**
 * 搜索地点（统一接口）
 */
export async function searchLocation(keyword, serviceType = 'amap') {
  if (serviceType === 'google') {
    return await searchGooglePlaces(keyword)
  } else if (serviceType === 'osm') {
    // OpenStreetMap - 完全免费
    return await searchOSMLocation(keyword)
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
  } else if (serviceType === 'osm') {
    // OpenStreetMap - 完全免费
    return await fetchOSMRestaurants({ location, radius, keywords })
  } else {
    // 高德地图
    try {
      return await fetchRestaurants({ location, radius, keywords })
    } catch (error) {
      console.warn('Fetch 请求失败，尝试 JSONP:', error)
      return await fetchRestaurantsJsonp({ location, radius, keywords })
    }
  }
}
