import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'

export const SUPPORTED_LANGUAGES = ['zh', 'en']

function normalizeLanguage(lng) {
  if (!lng) return 'zh'
  const lower = String(lng).toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return 'zh'
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'whattoeat_lang',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

// Keep <html lang> in sync for fonts & accessibility
i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLanguage(lng)
  document.documentElement.lang = normalized === 'zh' ? 'zh-CN' : 'en'
  document.documentElement.dataset.lang = normalized
})

// initialize lang attributes ASAP
document.documentElement.lang = normalizeLanguage(i18n.resolvedLanguage) === 'zh' ? 'zh-CN' : 'en'
document.documentElement.dataset.lang = normalizeLanguage(i18n.resolvedLanguage)

export default i18n

