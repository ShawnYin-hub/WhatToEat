import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import ProfilePage from './components/ProfilePage'
import DailyRecommendationsPage from './components/DailyRecommendationsPage'
import RecommendationPage from './components/RecommendationPage'
import MultiplayerRoomPage from './components/MultiplayerRoomPage'
import LocationSelector from './components/LocationSelector'
import MapServiceSelector from './components/MapServiceSelector'
import FoodChips from './components/FoodChips'
import RangeSlider from './components/RangeSlider'
import SelectButton from './components/SelectButton'
import LanguageToggle from './components/LanguageToggle'
import { useTranslation } from 'react-i18next'

// 加载历史记录诊断工具（仅在开发环境）
if (import.meta.env.DEV) {
  import('./utils/historyDebug')
}
import { notificationService } from './services/notificationService'

function MainApp() {
  const { user, guestMode, loading } = useAuth()
  const { t, i18n } = useTranslation()
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#/recommendation') return 'recommendation'
    return 'home'
  }) // 'home', 'profile', 'daily', 'recommendation', 'multiplayer'
  const [mapService, setMapService] = useState('amap')
  const [selectedFoods, setSelectedFoods] = useState([])
  const [range, setRange] = useState(2000)
  const [location, setLocation] = useState(null)

  // 调试：输出状态信息
  useEffect(() => {
    console.log('📱 App.jsx: 组件已渲染')
    console.log('📱 App.jsx: loading =', loading)
    console.log('📱 App.jsx: user =', user ? '已登录' : '未登录')
    console.log('📱 App.jsx: guestMode =', guestMode)
    console.log('📱 App.jsx: currentPage =', currentPage)
  }, [loading, user, guestMode, currentPage])

  // 监听 hash，便于通知点击后跳转
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/recommendation') {
        setCurrentPage('recommendation')
      }
    }
    window.addEventListener('hashchange', handleHash)
    handleHash()
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // 应用启动时请求通知权限（静默失败即可）
  useEffect(() => {
    notificationService.requestPermission()
  }, [])

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="safe-area-container bg-apple-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-apple-text border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // 未登录且非游客模式，显示登录页面
  if (!user && !guestMode) {
    return <AuthPage />
  }

  // 如果当前是个人中心页面
  if (currentPage === 'profile') {
    // 游客不允许进入个人中心
    if (!user) {
      return <AuthPage />
    }
    return <ProfilePage onBack={() => setCurrentPage('home')} />
  }

  if (currentPage === 'daily') {
    return <DailyRecommendationsPage onBack={() => setCurrentPage('home')} />
  }

  if (currentPage === 'recommendation') {
    return <RecommendationPage onBack={() => setCurrentPage('home')} />
  }

  if (currentPage === 'multiplayer') {
    return <MultiplayerRoomPage onBack={() => setCurrentPage('home')} />
  }

  // 主页面（搜索功能）
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={i18n.resolvedLanguage || i18n.language}
        initial={{ opacity: 0, filter: 'blur(2px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(2px)' }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="safe-area-container bg-apple-bg flex flex-col relative overflow-x-hidden overflow-y-auto i18n-fade"
      >
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
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                'radial-gradient(circle at 60% 30%, rgba(196, 181, 253, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 30% 70%, rgba(253, 224, 71, 0.08) 0%, transparent 50%)',
                'radial-gradient(circle at 70% 50%, rgba(147, 197, 253, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 60% 30%, rgba(196, 181, 253, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* 顶部导航栏（固定 + 安全区） */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 safe-top">
          <div className="frosted-bar max-w-2xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="title-chip text-sm sm:text-base font-semibold">
                  <span className="title-badge text-xs sm:text-sm font-semibold">Eat</span>
                  <span className="truncate">{t('app.name')}</span>
                </span>
                <span className="text-xs sm:text-sm subdued">{t('app.tagline')}</span>
              </div>
            </motion.div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <LanguageToggle />
              <motion.button
                onClick={() => setCurrentPage('multiplayer')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden min-w-[44px] min-h-[44px] px-3 py-1.5 text-sm font-semibold text-purple-600 bg-white rounded-full border border-purple-100 shadow-sm hover:bg-purple-50 touch-manipulation"
              >
                <span className="relative z-10">
                  {t('home.multiplayer') || '联机选餐'}
                </span>
              </motion.button>
              <motion.button
                onClick={() => {
                  window.location.hash = '#/recommendation'
                  setCurrentPage('recommendation')
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="relative overflow-hidden min-w-[44px] min-h-[44px] px-3 py-1.5 text-sm font-semibold text-blue-600 bg-white rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 touch-manipulation"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-100 opacity-80"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="relative z-10">{t('home.daily')}</span>
              </motion.button>
              {user ? (
                <motion.button
                  onClick={() => setCurrentPage('profile')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="min-w-[44px] min-h-[44px] px-2 sm:px-3 py-1 text-sm font-semibold text-apple-text/70 hover:text-apple-text/90 touch-manipulation"
                >
                  {t('home.profile') || '个人中心'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setCurrentPage('profile')}
                  whileTap={{ scale: 0.95 }}
                  className="min-h-[44px] px-2 sm:px-3 py-1 text-sm font-semibold text-apple-text/70 hover:text-apple-text/90 touch-manipulation"
                >
                  {t('home.loginUnlock')}
                </motion.button>
              )}
            </div>
          </div>
        </header>

        {/* 中间配置区域卡片 */}
        <main className="flex-1 px-4 sm:px-6 pt-8 sm:pt-10 pb-6 sm:pb-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-apple p-5 sm:p-6 shadow-sm max-w-2xl mx-auto"
          >
            {/* 地图服务选择 */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
                {t('home.mapService')}
              </h2>
              <MapServiceSelector value={mapService} onChange={setMapService} />
            </div>

            {/* 搜索位置 */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
                {t('home.searchLocation')}
              </h2>
              <LocationSelector onLocationChange={setLocation} mapService={mapService} />
            </div>

            {/* 想吃什么 */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
                {t('home.whatToEat')}
              </h2>
              <FoodChips
                selectedFoods={selectedFoods}
                onSelectionChange={setSelectedFoods}
              />
            </div>

            {/* 搜索范围 */}
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
                {t('home.searchRange')}
              </h2>
              <RangeSlider value={range} onChange={setRange} />
            </div>
          </motion.div>
        </main>

        {/* 底部按钮 */}
        <footer className="px-4 sm:px-6 pb-6 sm:pb-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <SelectButton
              selectedFoods={selectedFoods}
              range={range}
              location={location}
              mapService={mapService}
            />
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App
