import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'

function PersonaModal({ isOpen, persona, onClose, onRegenerate }) {
  if (!isOpen) return null
  const { t } = useTranslation()

  const tags = Array.isArray(persona?.tags) ? persona.tags : []
  const loves = Array.isArray(persona?.loves) ? persona.loves : []
  const avoids = Array.isArray(persona?.avoids) ? persona.avoids : []
  const signature = Array.isArray(persona?.signature_dishes) ? persona.signature_dishes : []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-w-md w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="apple-card p-6 sm:p-8 relative overflow-hidden">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#c2d3ff]/45 via-[#b8e1ff]/25 to-transparent rounded-full blur-2xl -translate-y-24 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#d9d9ff]/30 via-white/20 to-transparent rounded-full blur-xl translate-y-16 -translate-x-16" />

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/90 active:bg-white transition-colors z-10 touch-manipulation border border-white/60"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="relative z-10">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.12 }}
                      className="text-5xl mb-3 select-none"
                    >
                      🧠🍽️
                    </motion.div>
                    <div className="text-sm text-gray-600">{t('persona.title')}</div>
                    <div className="mt-2 text-2xl font-semibold text-apple-text break-words tracking-tight">
                      {persona?.title || t('persona.fallbackTitle')}
                    </div>
                  </div>

                  {/* 标签 */}
                  {tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                      {tags.slice(0, 8).map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/70 border border-white/70 text-apple-text"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 主报告 */}
                  <div className="mt-6 apple-subcard p-4">
                    <div className="text-xs text-gray-500 mb-2">{t('persona.commentTitle')}</div>
                    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {persona?.report || t('persona.noReport')}
                    </div>
                  </div>

                  {/* 分栏卡片 */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="apple-subcard p-4">
                      <div className="text-sm font-semibold text-apple-text mb-2">{t('persona.loves')}</div>
                      <div className="space-y-1">
                        {(loves.length ? loves : ['—']).slice(0, 4).map((x, idx) => (
                          <div key={`${x}-${idx}`} className="text-xs text-gray-700">
                            • {x}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="apple-subcard p-4">
                      <div className="text-sm font-semibold text-apple-text mb-2">{t('persona.avoids')}</div>
                      <div className="space-y-1">
                        {(avoids.length ? avoids : ['—']).slice(0, 4).map((x, idx) => (
                          <div key={`${x}-${idx}`} className="text-xs text-gray-700">
                            • {x}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {signature.length > 0 && (
                    <div className="mt-3 apple-subcard p-4">
                      <div className="text-sm font-semibold text-apple-text mb-2">{t('persona.signature')}</div>
                      <div className="flex flex-wrap gap-2">
                        {signature.slice(0, 6).map((x) => (
                          <span key={x} className="px-2.5 py-1 rounded-full text-xs bg-white/70 text-apple-text border border-white/70">
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {persona?.next_try && (
                    <div className="mt-3 apple-accent p-4 shadow-sm">
                      <div className="text-xs text-gray-600 mb-1">{t('persona.nextTry')}</div>
                      <div className="text-sm font-semibold leading-relaxed">{persona.next_try}</div>
                    </div>
                  )}

                  {/* 操作区 */}
                  <div className="mt-5 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 min-h-[44px] py-3 px-4 apple-btn-soft font-medium shadow-sm touch-manipulation hover:bg-white/95 active:scale-95 transition-transform"
                    >
                      {t('actions.close')}
                    </motion.button>
                    {onRegenerate && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onRegenerate}
                        className="flex-1 min-h-[44px] py-3 px-4 apple-btn-primary font-medium touch-manipulation hover:opacity-90 active:scale-95 transition-transform"
                      >
                        {t('persona.regenerate')}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PersonaModal

