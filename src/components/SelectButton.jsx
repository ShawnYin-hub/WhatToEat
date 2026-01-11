import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRandomRestaurant } from '../services/amapApi'
import { searchRestaurants } from '../services/locationService'
import ResultModal from './ResultModal'
import SlotMachine from './SlotMachine'
import EmptyState from './EmptyState'

function SelectButton({ selectedFoods, range, location, mapService = 'amap' }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [allRestaurants, setAllRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [error, setError] = useState(null)
  const [slotKey, setSlotKey] = useState(0) // 用于强制重新渲染 SlotMachine

  const formatRestaurant = (restaurant) => {
    return {
      name: restaurant.name || '未知餐厅',
      type: restaurant.type || '',
      address: restaurant.address || '',
      distance: parseInt(restaurant.distance || '0', 10),
      tel: restaurant.tel || '',
      rating: restaurant.biz_ext?.rating || restaurant.rating || null,
      location: restaurant.location
        ? {
            lng: restaurant.location.split(',')[0],
            lat: restaurant.location.split(',')[1],
          }
        : null,
    }
  }

  const handleSelect = async () => {
    // 验证必要条件
    if (!location) {
      setError('请先设置搜索位置（自动定位或手动输入地址）')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedRestaurant(null)
    setIsSpinning(false) // 先不显示老虎机
    setShowEmptyState(false) // 隐藏空状态

    try {
      // 调用地图服务 API
      const result = await searchRestaurants(
        {
          location,
          radius: range,
          keywords: selectedFoods,
        },
        mapService
      )
      const pois = result.pois

      if (pois.length === 0) {
        setIsLoading(false)
        setShowEmptyState(true)
        return
      }

      // 如果之前显示了空状态，现在隐藏它
      if (showEmptyState) {
        setShowEmptyState(false)
      }

      // 保存所有餐厅用于换一家功能
      setAllRestaurants(pois)
      
      // API 调用完成后，开始老虎机动画
      setIsLoading(false)
      setIsSpinning(true)
      setSlotKey((prev) => prev + 1) // 触发老虎机重新渲染

      // SlotMachine 组件会在动画完成后调用 handleSlotComplete
    } catch (err) {
      console.error('选择餐厅失败:', err)
      setError(err.message || '获取餐厅信息失败，请稍后重试')
      setIsLoading(false)
    }
  }

  const handleSlotComplete = () => {
    // 老虎机动画完成，随机选择一个餐厅
    if (allRestaurants.length > 0) {
      const randomRestaurant = getRandomRestaurant(allRestaurants)
      if (randomRestaurant) {
        const formattedRestaurant = formatRestaurant(randomRestaurant)
        setSelectedRestaurant(formattedRestaurant)
        setIsSpinning(false)
        setIsLoading(false)
        setShowModal(true)
      }
    }
  }

  const handleChangeRestaurant = () => {
    // 换一家：重新触发老虎机动画
    if (allRestaurants.length > 0) {
      setShowModal(false)
      setSelectedRestaurant(null)
      // 强制重新渲染 SlotMachine 组件
      setSlotKey((prev) => prev + 1)
      setIsSpinning(true)
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* 美食荒漠提示 */}
        {showEmptyState && (
          <EmptyState
            onRetry={() => {
              setShowEmptyState(false)
              handleSelect()
            }}
          />
        )}

        {/* 老虎机滚动区域 */}
        {isSpinning && allRestaurants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-apple p-4 sm:p-6 shadow-sm"
          >
            <div className="text-center mb-3 sm:mb-4">
              <div className="text-base sm:text-lg font-medium text-apple-text">正在为你挑选...</div>
            </div>
            <SlotMachine
              key={slotKey}
              restaurants={allRestaurants.map((poi) => ({
                name: poi.name || '未知餐厅',
                type: poi.type || '',
              }))}
              duration={1500}
              onComplete={handleSlotComplete}
            />
          </motion.div>
        )}

        <motion.button
          onClick={handleSelect}
          disabled={isLoading || isSpinning || showEmptyState}
          className="w-full min-h-[56px] py-4 sm:py-6 bg-apple-text text-white text-lg sm:text-xl font-semibold rounded-apple shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          whileHover={!isLoading && !isSpinning && !showEmptyState ? { scale: 1.02 } : {}}
          whileTap={!isLoading && !isSpinning && !showEmptyState ? { scale: 0.98 } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* 呼吸灯效果 */}
          {!isLoading && !isSpinning && (
            <motion.div
              className="absolute inset-0 bg-white opacity-0"
              animate={{
                opacity: [0, 0.1, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* 加载状态 */}
          {isLoading && !isSpinning ? (
            <span className="relative z-10 flex items-center justify-center gap-2">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              正在搜索...
            </span>
          ) : isSpinning ? (
            <span className="relative z-10">正在挑选中...</span>
          ) : (
            <span className="relative z-10">帮我选</span>
          )}
        </motion.button>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 结果弹窗 */}
      <ResultModal
        isOpen={showModal}
        restaurant={selectedRestaurant}
        onClose={() => {
          setShowModal(false)
          setSelectedRestaurant(null)
        }}
        onChangeRestaurant={handleChangeRestaurant}
      />
    </>
  )
}

export default SelectButton
