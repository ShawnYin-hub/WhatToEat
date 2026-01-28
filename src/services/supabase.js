import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 注意：这些值应该从环境变量中读取。
// iOS 真机/模拟器打包时，如果没注入 env，会走默认值；默认值必须是“非空字符串”，否则 Supabase SDK 会直接抛错导致白屏。
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kjsbpejwcyakpkherdaf.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// 检测是否在 Capacitor 环境中（iOS/Android）
const isCapacitor = typeof window !== 'undefined' && 
  (window.location.protocol === 'capacitor:' || 
   window.location.protocol === 'ionic:' ||
   window.Capacitor !== undefined)

// 检测是否在开发/预览环境（localhost）
const isLocalDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

// 检测是否是开发服务器（端口 5173，支持代理）
const isDevServer = isLocalDev && window.location.port === '5173'

// 获取 Supabase URL
const getSupabaseUrl = () => {
  // 验证 URL 是否有效
  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
    console.error('❌ Supabase URL 配置错误:', SUPABASE_URL)
    console.error('请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
    throw new Error('Supabase URL 未配置或格式错误。URL 必须以 http:// 或 https:// 开头')
  }

  // 在 Capacitor 环境中，始终使用原始 URL（不使用代理）
  if (isCapacitor) {
    return SUPABASE_URL
  }

  // 只在开发服务器（端口 5173）中使用代理
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
  
  // 在 Capacitor 环境中，不使用代理
  if (isCapacitor) {
    return fetch(finalUrl, options)
  }
  
  // 只在开发服务器（端口 5173）中使用代理
  if (isDevServer && typeof url === 'string' && url.includes('supabase.co')) {
    // 将 Supabase URL 替换为代理路径
    finalUrl = url.replace(/https:\/\/[^/]+\.supabase\.co/, `${window.location.origin}/api/supabase`)
  }
  
  return fetch(finalUrl, options)
}

// Supabase SDK 要求 anon key 为非空字符串，否则会直接抛错（导致 Capacitor 启动白屏）。
// 这里做一层兜底：即使你没配置真实 key，也先保证 App 能启动（相关联网/登录功能会失败，但不会白屏）。
const effectiveAnonKey =
  SUPABASE_ANON_KEY && String(SUPABASE_ANON_KEY).trim().length > 0
    ? SUPABASE_ANON_KEY
    : 'YOUR_SUPABASE_ANON_KEY'

// 创建 Supabase 客户端，配置 fetch 选项以处理 CORS
export const supabase = createClient(getSupabaseUrl(), effectiveAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': effectiveAnonKey,
    },
    fetch: customFetch, // 使用自定义 fetch
  },
})
