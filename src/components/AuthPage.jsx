import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, enterGuestMode } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        // 注册成功后切换到登录模式
        setIsLogin(true)
        setError(t('auth.signupSuccess'))
      }
    } catch (err) {
      setError(err.message || t('auth.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="safe-area-container bg-apple-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景渐变动效 */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(196, 181, 253, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 20%, rgba(253, 224, 71, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo/标题区域 */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-semibold text-apple-text mb-3"
          >
            {t('app.name')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 text-lg"
          >
            {t('app.tagline')}
          </motion.p>
        </div>

        {/* 卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-[28px] p-8 shadow-lg"
        >
          {/* 切换标签 */}
          <div className="flex mb-6 bg-gray-100 rounded-[20px] p-1">
            <motion.button
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
              className={`flex-1 py-3 rounded-[16px] font-medium text-base transition-all ${
                isLogin
                  ? 'bg-white text-apple-text shadow-sm'
                  : 'text-gray-600'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {t('auth.login')}
            </motion.button>
            <motion.button
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
              className={`flex-1 py-3 rounded-[16px] font-medium text-base transition-all ${
                !isLogin
                  ? 'bg-white text-apple-text shadow-sm'
                  : 'text-gray-600'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {t('auth.signup')}
            </motion.button>
          </div>

          {/* 表单 */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
            >
              {/* 邮箱输入 */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-gray-50 rounded-[20px] border-0 text-base focus:outline-none focus:ring-2 focus:ring-apple-text focus:ring-opacity-20 transition-all"
                />
              </div>

              {/* 密码输入 */}
              <div className="mb-6">
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-5 py-4 bg-gray-50 rounded-[20px] border-0 text-base focus:outline-none focus:ring-2 focus:ring-apple-text focus:ring-opacity-20 transition-all"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 px-4 py-3 rounded-[16px] text-sm ${
                    error.includes('成功')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {error}
                </motion.div>
              )}

              {/* 提交按钮 */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-apple-text text-white rounded-[20px] font-medium text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.processing') : isLogin ? t('auth.login') : t('auth.signup')}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* 游客模式提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-center text-gray-500 text-sm"
        >
          <p>{t('auth.guestOr')}</p>
          <p className="mt-1 text-xs">{t('auth.guestNote')}</p>
          <motion.button
            type="button"
            onClick={enterGuestMode}
            whileTap={{ scale: 0.98 }}
            className="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 py-3 rounded-[18px] bg-white/70 hover:bg-white text-apple-text shadow-sm border border-white/40 backdrop-blur-sm transition-transform active:scale-95 touch-manipulation"
          >
            {t('auth.continueGuest')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AuthPage
