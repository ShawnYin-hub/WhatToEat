import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 老虎机滚动动画组件
 */
function SlotMachine({ restaurants, duration = 1500, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(true)

  useEffect(() => {
    if (!restaurants || restaurants.length === 0) {
      if (onComplete) onComplete()
      return
    }

    setIsSpinning(true)
    setCurrentIndex(0) // 重置索引
    
    // 每次切换间隔，最少30ms，让滚动更快更流畅
    const interval = Math.max(30, duration / Math.max(restaurants.length, 30))
    let iteration = 0

    const spinInterval = setInterval(() => {
      setCurrentIndex((prev) => {
        iteration++
        // 确保每次选择不同的索引
        let nextIndex
        do {
          nextIndex = Math.floor(Math.random() * restaurants.length)
        } while (nextIndex === prev && restaurants.length > 1)
        return nextIndex
      })
    }, interval)

    // 持续时间结束后停止
    const timeout = setTimeout(() => {
      clearInterval(spinInterval)
      setIsSpinning(false)
      // 最终随机选择一个
      const finalIndex = Math.floor(Math.random() * restaurants.length)
      setCurrentIndex(finalIndex)
      if (onComplete) {
        setTimeout(onComplete, 200) // 延迟一点再完成，让动画更自然
      }
    }, duration)

    return () => {
      clearInterval(spinInterval)
      clearTimeout(timeout)
    }
  }, [restaurants, duration, onComplete])

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-apple-text">正在搜索...</div>
      </div>
    )
  }

  const currentRestaurant = restaurants[currentIndex]

  return (
    <div className="relative h-28 sm:h-32 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            duration: isSpinning ? 0.15 : 0.3,
            ease: isSpinning ? 'easeOut' : 'easeInOut',
          }}
          className="text-center px-4"
        >
          <div className="text-xl sm:text-2xl font-bold text-apple-text break-words">
            {currentRestaurant?.name || '...'}
          </div>
          {currentRestaurant?.type && (
            <div className="text-xs sm:text-sm text-gray-500 mt-1">{currentRestaurant.type}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 上下渐变遮罩，增强滚动感 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-b from-white to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  )
}

export default SlotMachine
