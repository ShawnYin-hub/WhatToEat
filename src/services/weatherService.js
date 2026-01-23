// WeatherService：封装和风天气实时天气查询
// 说明：
// - 默认从 import.meta.env.VITE_QWEATHER_API_KEY 读取 Key
// - 若未配置或调用失败，会返回安全的 fallback，而不是直接抛错

const QWEATHER_API_KEY =
  import.meta.env.VITE_QWEATHER_API_KEY || '06bfd081af4b459697ee8b40a420a365'

const QWEATHER_BASE_URL = 'https://devapi.qweather.com/v7/weather/now'

/**
 * 将和风天气的原始响应归一化为业务可用结构
 */
function normalizeWeather(raw) {
  if (!raw || raw.code !== '200' || !raw.now) {
    return {
      code: raw?.code || 'fallback',
      text: '未知',
      category: 'unknown',
      temp: null,
      raw: raw || null,
    }
  }

  const text = raw.now.text || '未知'
  const temp = raw.now.temp ? Number(raw.now.temp) : null
  const icon = raw.now.icon || ''

  let category = 'unknown'

  // 简单按天气现象与温度划分类别
  const lower = text.toLowerCase()
  const isRain =
    lower.includes('雨') ||
    lower.includes('shower') ||
    lower.includes('rain') ||
    ['300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310', '311', '312', '313'].includes(
      icon
    )

  if (isRain) {
    category = 'rainy'
  } else if (temp != null && temp >= 30) {
    category = 'hot'
  } else if (temp != null && temp <= 5) {
    category = 'cold'
  } else if (lower.includes('晴') || lower.includes('sun') || icon === '100') {
    category = 'sunny'
  } else if (lower.includes('云') || lower.includes('阴') || lower.includes('cloud')) {
    category = 'cloudy'
  }

  return {
    code: raw.code,
    text,
    category,
    temp,
    raw,
  }
}

/**
 * 获取当前天气信息
 * @param {{ latitude: number, longitude: number }} params
 * @returns {Promise<{ code: string, text: string, category: string, temp: number | null, raw: any }>}
 */
export async function getCurrentWeather({ latitude, longitude }) {
  // 若缺少坐标或 API Key，不阻塞流程，直接返回 unknown
  if (!latitude || !longitude || !QWEATHER_API_KEY) {
    console.warn('[WeatherService] 缺少坐标或 QWeather API Key，使用 fallback 天气')
    return {
      code: 'fallback',
      text: '未知',
      category: 'unknown',
      temp: null,
      raw: null,
    }
  }

  const params = new URLSearchParams({
    key: QWEATHER_API_KEY,
    location: `${longitude},${latitude}`, // 和风天气使用 "经度,纬度"
  })

  const url = `${QWEATHER_BASE_URL}?${params.toString()}`
  
  // 隐藏 API Key 的部分字符用于调试日志
  const maskedKey = QWEATHER_API_KEY 
    ? `${QWEATHER_API_KEY.substring(0, 4)}****${QWEATHER_API_KEY.substring(QWEATHER_API_KEY.length - 4)}`
    : 'MISSING'
  const debugUrl = url.replace(QWEATHER_API_KEY, maskedKey)
  console.log('[WeatherService] 请求和风天气 API:', {
    url: debugUrl,
    location: `${longitude},${latitude}`,
    keyLength: QWEATHER_API_KEY?.length || 0,
  })

  try {
    const res = await fetch(url, {
      method: 'GET',
    })

    if (!res.ok) {
      console.warn('[WeatherService] 和风天气接口返回非 2xx 状态码:', {
        status: res.status,
        statusText: res.statusText,
        url: debugUrl,
        location: `${longitude},${latitude}`,
      })
      // 如果 API key 无效或配额用完，返回默认值，不影响主流程
      return {
        code: String(res.status),
        text: '未知',
        category: 'unknown',
        temp: null,
        raw: null,
      }
    }

    const data = await res.json()
    return normalizeWeather(data)
  } catch (error) {
    console.warn('[WeatherService] 获取天气失败，使用 fallback：', error)
    return {
      code: 'error',
      text: '未知',
      category: 'unknown',
      temp: null,
      raw: null,
    }
  }
}

