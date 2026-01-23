import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { databaseService } from '../services/databaseService'
import { deepseekService } from '../services/deepseekService'
import { notificationService } from '../services/notificationService'

const NOTIFY_KEY = 'wte_daily_notify_enabled'

function DailyRecommendationsPage({ onBack }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [permission, setPermission] = useState(notificationService.getPermissionStatus())

  const slots = notificationService.DEFAULT_SLOTS

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFY_KEY)
      setNotifyEnabled(stored === '1')
    } catch {
      // ignore storage failure
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
    return () => notificationService.clearScheduled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (notifyEnabled && permission === 'granted' && recommendations.length > 0) {
      notificationService.scheduleDailyRecommendations(recommendations, {
        buildContent: (slot, rec) => ({
          title:
            t(`daily.slots.${slot.key}.notifyTitle`, {
              defaultValue: t('daily.notify.defaultTitle'),
            }) || t('daily.notify.defaultTitle'),
          body: rec
            ? `${rec.title || ''}${rec.why ? ` · ${rec.why}` : ''}`
            : t('daily.notify.defaultBody'),
        }),
      })
    } else {
      notificationService.clearScheduled()
    }
  }, [notifyEnabled, permission, recommendations, t])

  const mappedSlots = useMemo(
    () =>
      slots.map((slot) => ({
        ...slot,
        rec: recommendations.find((r) => r.slot === slot.key),
      })),
    [recommendations, slots]
  )

  const fetchRecommendations = async () => {
    setError('')
    setLoading((prev) => prev === true || recommendations.length === 0)
    setRefreshing(true)
    try {
      const selectionPromise = user
        ? databaseService.getUserSelectionHistory(user.id, 30)
        : Promise.resolve({ data: [] })
      const searchPromise = user
        ? databaseService.getUserSearchHistory(user.id, 20)
        : Promise.resolve({ data: [] })

      const [{ data: selectionHistory }, { data: searchHistory }] = await Promise.all([
        selectionPromise,
        searchPromise,
      ])

      const { data, error: aiError } = await deepseekService.generateDailyRecommendations({
        selectionHistory: selectionHistory || [],
        searchHistory: searchHistory || [],
      })

      if (aiError) {
        throw new Error(aiError)
      }

      setRecommendations(data?.slots || [])
      setSummary(data?.summary || '')
    } catch (err) {
      console.error('加载每日推荐失败', err)
      setError(err.message || t('daily.errorFallback'))
      setRecommendations([])
      setSummary('')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleToggleNotification = async () => {
    if (!notifyEnabled) {
      if (!notificationService.isSupported()) {
        setError(t('daily.notify.unsupported'))
        return
      }
      const perm = await notificationService.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError(t('daily.notify.permissionDenied'))
        return
      }
      try {
        localStorage.setItem(NOTIFY_KEY, '1')
      } catch {
        // ignore
      }
      setNotifyEnabled(true)
    } else {
      notificationService.clearScheduled()
      try {
        localStorage.removeItem(NOTIFY_KEY)
      } catch {
        // ignore
      }
      setNotifyEnabled(false)
    }
  }

  const handleTestNotification = () => {
    if (!notificationService.isSupported()) {
      setError(t('daily.notify.unsupported'))
      return
    }
    const ok = notificationService.sendTestNotification({
      title: t('daily.notify.testTitle'),
      body: t('daily.notify.testBody'),
    })
    if (!ok) {
      setError(t('daily.notify.permissionDenied'))
    }
  }

  return (
    <div className="safe-area-container bg-gray-50 relative">
      <div className="bg-white sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.95 }}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">{t('daily.title')}</h1>
            <p className="text-xs text-gray-500">{t('daily.subtitle')}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchRecommendations}
              disabled={refreshing}
              className="px-3 py-2 text-sm font-medium rounded-xl bg-blue-500 text-white shadow-sm disabled:opacity-60"
            >
              {refreshing ? t('daily.refreshing') : t('daily.refresh')}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-14 pt-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {t('daily.error', { error })}
          </div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="text-xs text-blue-600 mb-1">{t('daily.summary')}</div>
            <div className="text-base text-gray-900 font-semibold">{summary}</div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center text-lg">
              🔔
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">{t('daily.notify.title')}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('daily.notify.desc')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      notifyEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {notifyEnabled ? t('daily.notify.enabled') : t('daily.notify.disabled')}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleNotification}
                    className="px-3 py-2 rounded-xl bg-apple-text text-white text-sm font-medium shadow-sm"
                  >
                    {notifyEnabled ? t('daily.notify.turnOff') : t('daily.notify.turnOn')}
                  </motion.button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleTestNotification}
                  className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {t('daily.notify.test')}
                </button>
                <span className="text-xs text-gray-400">
                  {t('daily.notify.scheduleHint', {
                    lunch: t('daily.slots.lunch.time'),
                    tea: t('daily.slots.afternoon_tea.time'),
                    dinner: t('daily.slots.dinner.time'),
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-7 h-7 border-2 border-apple-text border-t-transparent rounded-full"
            />
            <span className="ml-3 text-sm text-gray-600">{t('daily.loading')}</span>
          </div>
        ) : mappedSlots.every((s) => !s.rec) ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-500 text-sm">
            {t('daily.empty')}
          </div>
        ) : (
          mappedSlots.map((slot, idx) => (
            <motion.div
              key={slot.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                    {slot.key === 'lunch' ? '🍜' : slot.key === 'afternoon_tea' ? '🧋' : '🍲'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {t(`daily.slots.${slot.key}.label`)}
                      <span className="text-xs text-gray-500 ml-2">{t(`daily.slots.${slot.key}.time`)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {slot.rec?.drink_focus ? slot.rec.drink_focus : t(`daily.slots.${slot.key}.hint`)}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{idx + 1}/3</span>
              </div>

              <div className="mt-3">
                <div className="text-base font-semibold text-gray-900">
                  {slot.rec?.title || t(`daily.slots.${slot.key}.fallback`)}
                </div>
                {slot.rec?.why && <p className="text-sm text-gray-600 mt-2">{slot.rec.why}</p>}
              </div>

              {slot.rec?.keywords?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">{t('daily.keywords')}</div>
                  <div className="flex flex-wrap gap-2">
                    {slot.rec.keywords.slice(0, 4).map((kw) => (
                      <span key={kw} className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {slot.rec?.tags?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">{t('daily.tags')}</div>
                  <div className="flex flex-wrap gap-2">
                    {slot.rec.tags.slice(0, 6).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {slot.rec?.cta && (
                <div className="mt-3 text-sm text-apple-text font-medium">
                  {t('daily.cta')}：{slot.rec.cta}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default DailyRecommendationsPage
