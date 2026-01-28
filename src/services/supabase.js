import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 注意：这些值应该从环境变量中读取，但为了简化，这里先硬编码
// 用户需要在 Supabase 项目中获取这些值
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// 检测是否在开发/预览环境（localhost）
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// 检测是否是开发服务器（端口 5173，支持代理）
const isDevServer = isLocalDev && window.location.port === '5173'

// 在开发服务器环境中使用代理路径（预览服务器不支持代理）
const getSupabaseUrl = () => {
  // 只在开发服务器（端口 5173）中使用代理，预览服务器（4173）直接使用原始 URL
  if (isDevServer && SUPABASE_URL.includes('supabase.co')) {
    // 提取 Supabase 项目 ID
    const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (projectId) {
      // 使用代理路径（仅开发服务器支持）
      return `${window.location.origin}/api/supabase`
    }
  }
  // 预览服务器或生产环境直接使用原始 URL
  return SUPABASE_URL
}

// 自定义 fetch，仅在开发服务器中使用代理
const customFetch = (url, options = {}) => {
  let finalUrl = url
  // 只在开发服务器（端口 5173）中使用代理
  if (isDevServer && typeof url === 'string' && url.includes('supabase.co')) {
    // 将 Supabase URL 替换为代理路径
    finalUrl = url.replace(/https:\/\/[^/]+\.supabase\.co/, `${window.location.origin}/api/supabase`)
  }
  return fetch(finalUrl, options)
}

// 创建 Supabase 客户端，配置 fetch 选项以处理 CORS
export const supabase = createClient(getSupabaseUrl(), SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
    fetch: customFetch, // 使用自定义 fetch
  },
})
