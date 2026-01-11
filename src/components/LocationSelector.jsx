import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchLocation } from '../services/locationService'

function LocationSelector({ onLocationChange, mapService = 'amap' }) {
  const [mode, setMode] = useState('auto') // 'auto' 或 'manual'
  const [isLoading, setIsLoading] = useState(false)
  const [locationInfo, setLocationInfo] = useState(null)
  const [address, setAddress] = useState('')
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  // 自动定位
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理位置功能')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationData = {
          latitude,
          longitude,
          formatted_address: '当前位置',
          source: 'auto',
        }
        onLocationChange(locationData)
        setLocationInfo('定位成功')
        setIsLoading(false)
      },
      (error) => {
        console.error('获取位置失败:', error)
        let errorMessage = '无法获取您的位置'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用'
            break
          case error.TIMEOUT:
            errorMessage = '获取位置超时'
            break
        }
        setError(errorMessage)
        setTimeout(() => setError(null), 5000)
        setIsLoading(false)
      }
    )
  }

  // 搜索地点（自动补全）
  const handleSearchPOI = async (keyword) => {
    if (!keyword || !keyword.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const results = await searchLocation(keyword, mapService)

      setSearchResults(results)
      setShowResults(results.length > 0)
      setIsSearching(false)
    } catch (err) {
      console.error('POI 搜索失败:', err)
      setError(err.message || '搜索失败，请稍后重试')
      setSearchResults([])
      setShowResults(false)
      setIsSearching(false)
    }
  }

  // 输入框变化时自动搜索（防抖）
  useEffect(() => {
    if (mode !== 'manual') return

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 如果输入为空，清空结果
    if (!address.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    // 延迟搜索（防抖 500ms）
    const keyword = address
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchPOI(keyword)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, mode])

  // 选择搜索结果
  const handleSelectResult = (poi) => {
    // 兼容不同API的返回格式
    const lat = poi.location?.latitude || (typeof poi.location === 'string' ? parseFloat(poi.location.split(',')[1]) : 0)
    const lng = poi.location?.longitude || (typeof poi.location === 'string' ? parseFloat(poi.location.split(',')[0]) : 0)
    
    const locationData = {
      latitude: lat,
      longitude: lng,
      formatted_address: poi.formatted_address || poi.address || poi.name,
      name: poi.name,
      source: 'manual',
    }

    onLocationChange(locationData)
    setLocationInfo(poi.name)
    setAddress(poi.name)
    setShowResults(false)
    setSearchResults([])
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError(null)
    setLocationInfo(null)
    setAddress('')
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <div className="space-y-4">
      {/* 模式切换标签 */}
      <div className="flex gap-2 bg-gray-50 rounded-xl p-1">
        <button
          onClick={() => handleModeChange('auto')}
          disabled={isLoading}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm transition-all touch-manipulation ${
            mode === 'auto'
              ? 'bg-white text-apple-text shadow-sm'
              : 'text-gray-600 hover:text-apple-text'
          } disabled:opacity-50`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>自动定位</span>
          </div>
        </button>
        <button
          onClick={() => handleModeChange('manual')}
          disabled={isLoading}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm transition-all touch-manipulation ${
            mode === 'manual'
              ? 'bg-white text-apple-text shadow-sm'
              : 'text-gray-600 hover:text-apple-text'
          } disabled:opacity-50`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>手动输入</span>
          </div>
        </button>
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {mode === 'auto' ? (
          <motion.div
            key="auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              onClick={handleGetLocation}
              disabled={isLoading}
              className="w-full min-h-[44px] flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-apple-text transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-apple-text border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-base font-medium">正在获取位置...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="text-base font-medium">
                    {locationInfo || '点击获取当前位置'}
                  </span>
                </>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="relative">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    setError(null)
                    if (e.target.value.trim()) {
                      setShowResults(true)
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true)
                    }
                  }}
                  onBlur={() => {
                    // 延迟隐藏，让点击事件先触发
                    setTimeout(() => setShowResults(false), 200)
                  }}
                  placeholder="例如：北京大学、中关村、三里屯..."
                  className="w-full min-h-[44px] px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-apple-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-text focus:border-transparent touch-manipulation"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <motion.div
                      className="w-5 h-5 border-2 border-apple-text border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
              </div>

              {/* 搜索结果下拉列表 */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
                  >
                    {searchResults.map((poi, index) => (
                      <button
                        key={poi.id || index}
                        onClick={() => handleSelectResult(poi)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 touch-manipulation"
                      >
                        <div className="font-medium text-apple-text mb-1">
                          {poi.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {poi.formatted_address || poi.address}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 已选择的位置显示 */}
            {locationInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>已选择：{locationInfo}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocationSelector
