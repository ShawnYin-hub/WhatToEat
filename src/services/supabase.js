import { createClient } from '@supabase/supabase-js'

// Supabase 配置
// 注意：这些值应该从环境变量中读取，但为了简化，这里先硬编码
// 用户需要在 Supabase 项目中获取这些值
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// 创建 Supabase 客户端，配置 fetch 选项以处理 CORS
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
  },
})
