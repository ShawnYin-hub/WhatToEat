import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { databaseService } from '../services/databaseService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [guestMode, setGuestMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 恢复游客模式（不影响已登录态）
    try {
      const storedGuest = localStorage.getItem('wte_guest_mode')
      if (storedGuest === '1') setGuestMode(true)
    } catch {
      // ignore
    }

    // 获取当前用户
    authService.getCurrentUser().then(({ user }) => {
      setUser(user)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
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
