import { motion } from 'framer-motion'

function EmptyState({ onRetry }) {
  const messages = [
    {
      emoji: '🏜️',
      title: '美食荒漠警告！',
      subtitle: '这附近好像...',
      description: '方圆之内，竟然找不到一家合适的餐厅。要不要试试扩大搜索范围，或者换个口味？',
    },
    {
      emoji: '🔍',
      title: '空空如也',
      subtitle: '什么都没有找到',
      description: '可能是筛选条件太严格了，试试去掉一些标签或者扩大搜索范围吧～',
    },
    {
      emoji: '🤔',
      title: '这里有点冷清',
      subtitle: '暂时没有发现美食',
      description: '附近似乎没有符合条件的餐厅。换个地方试试，或者调整一下你的美食偏好？',
    },
  ]

  const randomMessage = messages[Math.floor(Math.random() * messages.length)]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="bg-white rounded-apple p-6 sm:p-8 text-center shadow-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-6xl sm:text-7xl mb-3 sm:mb-4"
      >
        {randomMessage.emoji}
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl sm:text-2xl font-bold text-apple-text mb-2"
      >
        {randomMessage.title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-base sm:text-lg text-gray-600 mb-3"
      >
        {randomMessage.subtitle}
      </motion.p>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-gray-500 mb-5 sm:mb-6 leading-relaxed px-2"
      >
        {randomMessage.description}
      </motion.p>

      {onRetry && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="min-h-[44px] px-6 py-3 bg-apple-text text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors touch-manipulation"
        >
          再试一次
        </motion.button>
      )}
    </motion.div>
  )
}

export default EmptyState
