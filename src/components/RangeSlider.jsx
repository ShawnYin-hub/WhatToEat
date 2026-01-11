import { motion } from 'framer-motion'

function RangeSlider({ value, onChange }) {
  const min = 500
  const max = 5000
  const step = 100

  const handleChange = (e) => {
    onChange(Number(e.target.value))
  }

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`
    }
    return `${meters}m`
  }

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative py-2 -my-2">
        {/* 自定义滑动条轨道 */}
        <div className="h-2 sm:h-2.5 bg-gray-200 rounded-full">
          <motion.div
            className="h-2 sm:h-2.5 bg-apple-text rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* 原生滑动条（增大触摸区域） */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer touch-manipulation"
          style={{ WebkitAppearance: 'none' }}
        />
        
        {/* 滑动条滑块指示器 - 移动端更大 */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 sm:w-6 sm:h-6 bg-apple-text rounded-full shadow-lg pointer-events-none touch-manipulation"
          style={{ left: `calc(${percentage}% - 16px)` }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      </div>
      
      {/* 显示当前值 */}
      <div className="flex justify-between items-center">
        <span className="text-xs sm:text-sm text-gray-600">{formatDistance(min)}</span>
        <span className="text-base sm:text-lg font-semibold text-apple-text">
          {formatDistance(value)}
        </span>
        <span className="text-xs sm:text-sm text-gray-600">{formatDistance(max)}</span>
      </div>
    </div>
  )
}

export default RangeSlider
