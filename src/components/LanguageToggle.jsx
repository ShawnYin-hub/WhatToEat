import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

function normalizeLanguage(lng) {
  if (!lng) return 'zh'
  const lower = String(lng).toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return 'zh'
}

export default function LanguageToggle({ className = '' }) {
  const { i18n, t } = useTranslation()
  const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

  const next = current === 'zh' ? 'en' : 'zh'

  return (
    <motion.button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      whileTap={{ scale: 0.98 }}
      className={[
        'min-h-[36px] px-3 py-1.5 rounded-full',
        'bg-white/70 hover:bg-white/90 active:bg-white',
        'border border-white/60 backdrop-blur-sm shadow-sm',
        'text-xs font-semibold tracking-wide text-apple-text',
        'transition-colors select-none',
        className,
      ].join(' ')}
      aria-label={`Switch language to ${next === 'zh' ? 'Chinese' : 'English'}`}
    >
      <span className={current === 'zh' ? 'opacity-100' : 'opacity-50'}>{t('lang.zh')}</span>
      <span className="mx-1 opacity-40">/</span>
      <span className={current === 'en' ? 'opacity-100' : 'opacity-50'}>{t('lang.en')}</span>
    </motion.button>
  )
}

