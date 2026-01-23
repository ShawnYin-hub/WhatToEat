import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

function LocationButton({ onLocationChange }) {
  const [isLoading, setIsLoading] = useState(false)
  const [locationName, setLocationName] = useState(null)
  const { t } = useTranslation()

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert(t('location.errors.notSupported'))
      return
    }

    setIsLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const locationData = { latitude, longitude }
        onLocationChange(locationData)
        setLocationName(t('location.currentLocation'))
        setIsLoading(false)
      },
      (error) => {
        console.error('获取位置失败:', error)
        let errorMessage = t('location.errors.failed')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('location.errors.permissionDenied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('location.errors.unavailable')
            break
          case error.TIMEOUT:
            errorMessage = t('location.errors.timeout')
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
          <span className="text-base font-medium">{t('location.getting')}</span>
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
            {locationName || t('location.clickToGet')}
          </span>
        </>
      )}
    </motion.button>
  )
}

export default LocationButton
