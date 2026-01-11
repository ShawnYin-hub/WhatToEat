import { useState } from 'react'
import { motion } from 'framer-motion'

function LocationButton({ onLocationChange }) {
  const [isLoading, setIsLoading] = useState(false)
  const [locationName, setLocationName] = useState(null)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能')
      return
    }

    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationData = { latitude, longitude }
        onLocationChange(locationData)
        setLocationName('定位成功')
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
        alert(errorMessage)
        setIsLoading(false)
      }
    )
  }

  return (
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
            {locationName || '点击获取定位'}
          </span>
        </>
      )}
    </motion.button>
  )
}

export default LocationButton
