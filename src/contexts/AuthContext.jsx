import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { databaseService } from '../services/databaseService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 AuthContext: 初始化开始')
    
    // 恢复游客模式（不影响已登录态）
    try {
      const storedGuest = localStorage.getItem('wte_guest_mode')
      if (storedGuest === '1') {
        setGuestMode(true)
        console.log('🔐 AuthContext: 恢复游客模式')
      }
    } catch (e) {
      console.warn('🔐 AuthContext: 读取游客模式失败', e)
    }

    // 获取当前用户（添加超时和错误处理）
    const getUserPromise = authService.getCurrentUser().then(({ user }) => {
      console.log('🔐 AuthContext: 获取用户成功', user ? '已登录' : '未登录')
      setUser(user)
      setLoading(false)
    }).catch((error) => {
      console.error('🔐 AuthContext: 获取用户失败', error)
      // 即使失败也设置 loading 为 false，避免一直显示加载状态
      setLoading(false)
    })

    // 设置超时（5秒），避免一直等待
    const timeoutId = setTimeout(() => {
      console.warn('🔐 AuthContext: 获取用户超时，强制设置 loading = false')
      setLoading(false)
    }, 5000)

    // 清理超时
    getUserPromise.finally(() => {
      clearTimeout(timeoutId)
    })

    // 监听认证状态变化
    try {
      const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
        console.log('🔐 AuthContext: 认证状态变化', event, session?.user ? '已登录' : '未登录')
        setUser(session?.user ?? null)

        // 一旦登录成功，退出游客模式
        if (session?.user) {
          setGuestMode(false)
          try {
            localStorage.removeItem('wte_guest_mode')
          } catch {
            // ignore
          }
        }
        
        // 如果用户登录，创建或更新用户资料
        if (session?.user) {
          databaseService.upsertUserProfile(session.user.id, {
            email: session.user.email,
          })
        }
      })

      return () => {
        subscription?.unsubscribe()
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error('🔐 AuthContext: 监听认证状态失败', error)
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }, [])

  const signUp = async (email, password) => {
    const { data, error } = await authService.signUp(email, password)
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await authService.signIn(email, password)
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    if (error) throw error
  }

  const enterGuestMode = () => {
    setGuestMode(true)
    try {
      localStorage.setItem('wte_guest_mode', '1')
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, guestMode, loading, signUp, signIn, signOut, enterGuestMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
