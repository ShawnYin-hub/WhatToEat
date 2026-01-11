import { motion, AnimatePresence } from 'framer-motion'

function ResultModal({ isOpen, restaurant, onClose, onChangeRestaurant }) {
  if (!isOpen || !restaurant) return null

  // 渲染星级评分
  const renderRating = (rating) => {
    if (!rating || rating === '0' || rating === 0) return null
    
    const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating
    if (isNaN(ratingNum)) return null

    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm">评分：</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(ratingNum)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-apple-text font-medium ml-1">{ratingNum.toFixed(1)}</span>
      </div>
    )
  }

  // 生成高德地图导航链接
  const getNavigationUrl = () => {
    if (!restaurant.location) return null
    // 高德地图网页版导航链接
    return `https://uri.amap.com/navigation?to=${restaurant.location.lng},${restaurant.location.lat},${encodeURIComponent(restaurant.name)}&mode=car&src=webapp`
  }

  const navigationUrl = getNavigationUrl()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
          />

          {/* 弹窗内容 - 毛玻璃效果 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-w-md w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 毛玻璃效果卡片 */}
              <div className="bg-white/80 backdrop-blur-xl rounded-apple p-6 sm:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-xl translate-y-12 -translate-x-12" />

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 active:bg-white/90 transition-colors z-10 touch-manipulation"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* 结果内容 */}
                <div className="text-center relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-5xl sm:text-6xl mb-3 sm:mb-4"
                  >
                    🎉
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-semibold text-apple-text mb-2"
                  >
                    今天去吃
                  </motion.h2>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl sm:text-3xl font-bold text-apple-text mb-4 sm:mb-6 px-2 break-words"
                  >
                    {restaurant.name}
                  </motion.h3>

                  {/* 餐厅信息卡片 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3 sm:space-y-4 text-left bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border border-white/40"
                  >
                    {/* 星级评分 */}
                    {restaurant.rating && renderRating(restaurant.rating)}

                    {/* 距离 */}
                    {restaurant.distance > 0 && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
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
                        <span className="text-gray-500 text-sm">距离：</span>
                        <span className="text-apple-text font-medium">
                          {restaurant.distance > 1000
                            ? `${(restaurant.distance / 1000).toFixed(1)}km`
                            : `${restaurant.distance}m`}
                        </span>
                      </div>
                    )}

                    {/* 地址 */}
                    {restaurant.address && (
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0"
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
                        <div className="flex-1">
                          <span className="text-gray-500 text-sm">地址：</span>
                          <span className="text-apple-text text-sm leading-relaxed">
                            {restaurant.address}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* 操作按钮 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onChangeRestaurant}
                      className="flex-1 min-h-[44px] py-3 px-4 sm:px-6 bg-white/80 backdrop-blur-sm text-apple-text rounded-xl font-medium hover:bg-white active:bg-white/90 transition-colors border border-white/40 shadow-sm touch-manipulation"
                    >
                      换一家
                    </motion.button>
                    {navigationUrl && (
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={navigationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] py-3 px-4 sm:px-6 bg-apple-text text-white rounded-xl font-medium hover:bg-opacity-90 active:bg-opacity-80 transition-colors shadow-lg touch-manipulation flex items-center justify-center"
                      >
                        带我导航
                      </motion.a>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ResultModal
