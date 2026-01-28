import { supabase } from './supabase'

export const authService = {
  // 邮箱注册
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 邮箱登录
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        // 统一包装错误信息，便于 UI 显示更友好的提示
        const wrappedError = new Error(
          error.message ||
            error.error_description ||
            '登录失败，请检查邮箱和密码是否正确',
        )
        // 保留原始错误对象，方便调试
        wrappedError.cause = error
        throw wrappedError
      }
      return { data, error: null }
    } catch (error) {
      console.error('[authService.signIn] 登录失败:', error)
      return { data: null, error }
    }
  },

  // 登出
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  // 获取当前用户
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  },

  // 监听认证状态变化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
