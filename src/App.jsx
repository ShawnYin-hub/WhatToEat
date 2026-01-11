import { useState } from 'react'
import { motion } from 'framer-motion'
import LocationSelector from './components/LocationSelector'
import MapServiceSelector from './components/MapServiceSelector'
import FoodChips from './components/FoodChips'
import RangeSlider from './components/RangeSlider'
import SelectButton from './components/SelectButton'

function App() {
  const [mapService, setMapService] = useState('amap') // 'amap' 或 'osm'
  const [selectedFoods, setSelectedFoods] = useState([])
  const [range, setRange] = useState(2000) // 默认 2km
  const [location, setLocation] = useState(null)

  return (
    <div className="min-h-screen bg-apple-bg flex flex-col relative overflow-hidden">
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

      {/* 顶部标题区域 */}
      <header className="pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-semibold text-apple-text mb-2 sm:mb-3"
        >
          今天吃什么
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base sm:text-lg text-gray-600"
        >
          解决选择困难症
        </motion.p>
      </header>

      {/* 中间配置区域卡片 */}
      <main className="flex-1 px-4 sm:px-6 pb-6 sm:pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-apple p-5 sm:p-6 shadow-sm max-w-2xl mx-auto"
        >
          {/* 地图服务选择 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
              地图服务
            </h2>
            <MapServiceSelector value={mapService} onChange={setMapService} />
          </div>

          {/* 搜索位置 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
              搜索位置
            </h2>
            <LocationSelector onLocationChange={setLocation} mapService={mapService} />
          </div>

          {/* 想吃什么 */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
              想吃什么
            </h2>
            <FoodChips
              selectedFoods={selectedFoods}
              onSelectionChange={setSelectedFoods}
            />
          </div>

          {/* 搜索范围 */}
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-apple-text mb-3 sm:mb-4">
              搜索范围
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
    </div>
  )
}

export default App
