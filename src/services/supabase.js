import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 注意：这些值应该从环境变量中读取，但为了简化，这里先硬编码
// 用户需要在 Supabase 项目中获取这些值
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// 检测是否在开发/预览环境（localhost）
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// 在开发/预览环境中使用代理路径
const getSupabaseUrl = () => {
  if (isLocalDev && SUPABASE_URL.includes('supabase.co')) {
    // 提取 Supabase 项目 ID
    const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (projectId) {
      // 使用代理路径
      return `${window.location.origin}/api/supabase`
    }
  }
  return SUPABASE_URL
}

// 自定义 fetch，在开发环境中自动使用代理
const customFetch = (url, options = {}) => {
  let finalUrl = url
  if (isLocalDev && typeof url === 'string' && url.includes('supabase.co')) {
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
