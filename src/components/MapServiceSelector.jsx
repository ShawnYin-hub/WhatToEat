import { useState } from 'react'
import { motion } from 'framer-motion'

const MAP_SERVICES = {
  amap: {
    id: 'amap',
    name: '高德地图',
    description: '适用于中国内地',
    icon: '🇨🇳',
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    description: '全球免费（推荐海外）',
    icon: '🌍',
    free: true,
  },
}

function MapServiceSelector({ value, onChange }) {
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
            className={`min-h-[44px] px-3 sm:px-4 py-3 rounded-xl border-2 transition-all touch-manipulation ${
              selectedService === service.id
                ? 'border-apple-text bg-apple-text text-white shadow-md'
                : 'border-gray-200 bg-white text-apple-text hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">{service.icon}</span>
              <span className="font-medium text-sm">{service.name}</span>
              <span className={`text-xs ${
                selectedService === service.id ? 'text-white/80' : 'text-gray-500'
              }`}>
                {service.description}
              </span>
              {service.free && (
                <span className={`text-xs font-bold ${
                  selectedService === service.id ? 'text-white' : 'text-green-600'
                }`}>
                  ✓ 免费
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      {selectedService === 'osm' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800"
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
              <div className="font-medium mb-1">✓ 完全免费，无需配置</div>
              <div className="text-xs text-blue-700">
                OpenStreetMap 是开源地图服务，全球可用，无需 API Key，无需绑卡。
                <span className="block mt-1 font-medium">⚠️ 注意：在中国内地可能需要 VPN 才能正常使用。</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default MapServiceSelector
