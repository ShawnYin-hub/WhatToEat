import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const MAP_SERVICES = {
  amap: {
    id: 'amap',
    name: '高德地图',
    description: '适用于中国内地',
    icon: '🇨🇳',
  },
  greenstreet: {
    id: 'greenstreet',
    name: 'GreenStreet',
    description: '全球免费（推荐海外）',
    icon: '🌿',
    free: true,
  },
}

function MapServiceSelector({ value, onChange }) {
  const { t } = useTranslation()
  const [selectedService, setSelectedService] = useState(value || 'amap')

  const handleChange = (serviceId) => {
    setSelectedService(serviceId)
    if (onChange) {
      onChange(serviceId)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Object.values(MAP_SERVICES).map((service) => (
          <motion.button
            key={service.id}
            onClick={() => handleChange(service.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`min-h-[44px] px-3 sm:px-4 py-3 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
              selectedService === service.id
                ? 'border-apple-text bg-apple-text text-white shadow-md'
                : 'border-gray-200 bg-white text-apple-text hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">{service.icon}</span>
              <span className="font-medium text-sm">{t(`map.${service.id}.name`)}</span>
              <span className={`text-xs ${
                selectedService === service.id ? 'text-white/80' : 'text-gray-500'
              }`}>
                {t(`map.${service.id}.desc`)}
              </span>
              {service.free && (
                <span className={`text-xs font-bold ${
                  selectedService === service.id ? 'text-white' : 'text-green-600'
                }`}>
                  {t('map.free')}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      {selectedService === 'greenstreet' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="font-medium mb-1">{t('map.tipTitle')}</div>
              <div className="text-xs text-green-700">
                {t('map.tipBody')}
                <span className="block mt-1 font-medium">{t('map.tipBody2')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default MapServiceSelector
