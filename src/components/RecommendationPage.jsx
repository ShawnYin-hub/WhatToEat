import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { databaseService } from '../services/databaseService'
import { deepseekService } from '../services/deepseekService'
import { generateAiRecommendations, generateWarmNotifications } from '../services/aiService'
import { notificationService } from '../services/notificationService'
import { searchRestaurants } from '../services/locationService'

const gradientBg = [
  'radial-gradient(circle at 20% 20%, rgba(147, 197, 253, 0.22) 0%, transparent 35%)',
  'radial-gradient(circle at 80% 10%, rgba(196, 181, 253, 0.22) 0%, transparent 32%)',
  'radial-gradient(circle at 50% 80%, rgba(253, 224, 71, 0.18) 0%, transparent 32%)',
].join(',')

function RecommendationPage({ onBack }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ title: '', tagline: '', restaurants: [] })
  const [persona, setPersona] = useState(null)
  const [contextMeta, setContextMeta] = useState({ location: null, radius: 2000, mapService: 'amap' })
  const [notifyCopy, setNotifyCopy] = useState({})

  // 预设优雅降级文案
  const fallbackCopy = useMemo(
    () => ({
      title: t('recommendation.fallbackTitle'),
      tagline: t('recommendation.fallbackTagline'),
      restaurants: [
        {
          name: t('recommendation.fallbackRestaurant'),
          recommended_dish: t('recommendation.fallbackDish'),
          reason: t('recommendation.fallbackReason'),
        },
      ],
    }),
    [t]
  )

  useEffect(() => {
    // 自动请求通知权限
    notificationService.requestPermission().then(() => {
      notificationService.scheduleDailyRecommendations([], { onClickUrl: '#/recommendation' })
    })
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (data && data.title) {
      // 将推荐结果映射到 3 个时段，便于定时通知展示
      const slotPayload = [
        { slot: 'lunch', title: data.title, why: data.tagline, cta: t('recommendation.cta') },
        { slot: 'afternoon_tea', title: data.title, why: data.tagline, cta: t('recommendation.cta') },
        { slot: 'dinner', title: data.title, why: data.tagline, cta: t('recommendation.cta') },
      ]
      notificationService.scheduleDailyRecommendations(slotPayload, {
        onClickUrl: '#/recommendation',
        buildContent: (slot, rec) => {
          const warm = notifyCopy?.[slot.key]
          return {
            title: warm?.title || t(`daily.slots.${slot.key}.notifyTitle`, { defaultValue: t('daily.notify.defaultTitle') }),
            body: warm?.body || rec?.why || data.tagline || t('daily.notify.defaultBody'),
            url: '#/recommendation',
          }
        },
      })
    }
  }, [data, t, notifyCopy])

  const fetchData = async () => {
    setError('')
    setLoading(true)
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

      // 解析最近一次搜索的坐标/半径/地图服务，用于获取真实“附近餐厅”
      const latestSearch = Array.isArray(searchHistory) ? searchHistory[0]?.search_criteria : null
      const parsed = parseSearchContext(latestSearch)
      if (parsed?.location) {
        setContextMeta(parsed)
      }

      // 拉取画像（用于 prompt），失败不影响主流程
      let personaData = null
      try {
        const personaRes = await deepseekService.generateUserPersona(selectionHistory || [])
        personaData = personaRes.data || null
        setPersona(personaData)
      } catch {
        // ignore persona error
      }

      // 先让 DeepSeek 给出“关键词策略”（饭点/下午茶/晚餐），再去地图 API 抓取真实餐厅
      const { data: slotPlan, error: slotErr } = await deepseekService.generateDailyRecommendations({
        selectionHistory: selectionHistory || [],
        searchHistory: searchHistory || [],
      })

      const loc = parsed?.location
      if (loc && slotPlan?.slots?.length) {
        const restaurants = await hydrateWithRealRestaurants(slotPlan.slots, parsed)
        // 生成一个暖心标题/文案（DeepSeek），但餐厅用真实 POI
        const { data: aiData, error: aiErr } = await generateAiRecommendations({
          selectionHistory: selectionHistory || [],
          searchHistory: searchHistory || [],
          persona: personaData,
        })
        const merged = {
          title: aiData?.title || fallbackCopy.title,
          tagline: aiData?.tagline || fallbackCopy.tagline,
          restaurants: restaurants.length ? restaurants : (aiData?.restaurants || fallbackCopy.restaurants),
        }
        setData(merged)

        // 用真实餐厅名生成“吸引人且暖心”的通知文案（一次调用给三段）
        const topNames = {
          lunch: restaurants?.[0]?.name || '',
          afternoon_tea: restaurants?.[1]?.name || restaurants?.[0]?.name || '',
          dinner: restaurants?.[2]?.name || restaurants?.[0]?.name || '',
        }
        const slotsForCopy = [
          { slot: 'lunch', restaurant: topNames.lunch },
          { slot: 'afternoon_tea', restaurant: topNames.afternoon_tea },
          { slot: 'dinner', restaurant: topNames.dinner },
        ]
        const { data: notifData } = await generateWarmNotifications({ slots: slotsForCopy })
        if (Array.isArray(notifData) && notifData.length) {
          const map = {}
          notifData.forEach((x) => {
            if (x?.slot) {
              map[x.slot] = { title: x.title, body: x.body }
            }
          })
          setNotifyCopy(map)
        }

        if (slotErr) setError(slotErr)
        if (aiErr) setError(aiErr)
      } else {
        // 没有坐标（或没有计划）时：回退到文案型推荐（可能不是附近真实 POI）
        const { data: aiData, error: aiErr } = await generateAiRecommendations({
          selectionHistory: selectionHistory || [],
          searchHistory: searchHistory || [],
          persona: personaData,
        })
        if (aiErr) {
          setData(fallbackCopy)
          setError(aiErr)
        } else if (aiData) {
          setData(aiData)
        } else {
          setData(fallbackCopy)
        }
        if (!loc) {
          setError(t('recommendation.needRecentSearch'))
        }
      }
    } catch (err) {
      console.error('加载 AI 推荐失败', err)
      setData(fallbackCopy)
      setError(err.message || t('recommendation.error'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  return (
    <div className="safe-area-container relative overflow-hidden">
      {/* 背景流体渐变 */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 opacity-80 blur-3xl"
          style={{ background: gradientBg }}
          animate={{ scale: [1, 1.04, 1], rotate: [0, 2, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 pt-4 safe-top">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <motion.button
            onClick={onBack}
            whileTap={{ scale: 0.95 }}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white/70 backdrop-blur border border-white/60 shadow-sm text-blue-500"
            aria-label="back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-semibold tracking-tight text-apple-text">{t('recommendation.title')}</div>
            <div className="text-xs text-gray-500 mt-1">{t('recommendation.subtitle')}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchData}
            disabled={refreshing}
            className="px-4 py-2 rounded-full bg-apple-text text-white text-sm font-medium shadow-md disabled:opacity-60"
          >
            {refreshing ? t('recommendation.refreshing') : t('recommendation.refresh')}
          </motion.button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 pt-6 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50/80 border border-red-100 text-sm text-red-700 backdrop-blur"
          >
            {t('recommendation.errorWithMsg', { error })}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative overflow-hidden rounded-[28px] bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_24px_60px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-10 w-64 h-64 bg-white/40 blur-3xl" />
            <div className="absolute -bottom-24 -right-8 w-72 h-72 bg-blue-200/30 blur-3xl" />
          </div>
          <div className="relative p-6 sm:p-8 space-y-4">
            <div className="text-xs uppercase tracking-[0.28em] text-gray-500">{t('recommendation.label')}</div>
            <div className="text-3xl sm:text-4xl font-semibold text-apple-text leading-tight">
              {loading ? t('recommendation.loadingTitle') : data.title || fallbackCopy.title}
            </div>
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl">
              {loading ? t('recommendation.loadingTagline') : data.tagline || fallbackCopy.tagline}
            </div>
            {persona?.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {persona.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/70 border border-white/60 text-xs text-apple-text">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {(loading ? fallbackCopy.restaurants : data.restaurants || fallbackCopy.restaurants).map((item, idx) => (
              <motion.div
                key={`${item.name}-${idx}`}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.45, ease: 'easeInOut', delay: idx * 0.05 }}
                className="relative overflow-hidden rounded-2xl bg-white/60 border border-white/60 backdrop-blur-xl shadow-lg p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-base font-semibold text-apple-text leading-tight">{item.name}</div>
                  <span className="text-xs text-gray-400">{idx + 1}</span>
                </div>
                {item.recommended_dish && (
                  <div className="text-sm text-blue-600 font-medium">
                    {t('recommendation.dish')} {item.recommended_dish}
                  </div>
                )}
                {item.reason && <div className="text-sm text-gray-700 leading-relaxed">{item.reason}</div>}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  {t('recommendation.tip')}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default RecommendationPage

function parseSearchContext(searchCriteria) {
  const address = searchCriteria?.address
  const mapService = searchCriteria?.mapService || 'amap'
  const radius = Number(searchCriteria?.distance || 2000)
  if (!address || typeof address !== 'string') return { location: null, radius, mapService }
  const m = address.trim().match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)
  if (!m) return { location: null, radius, mapService }
  const lat = parseFloat(m[1])
  const lng = parseFloat(m[3])
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { location: null, radius, mapService }
  return { location: { latitude: lat, longitude: lng }, radius, mapService }
}

async function hydrateWithRealRestaurants(slotPlans, context) {
  const { location, radius, mapService } = context || {}
  if (!location) return []

  const all = []
  for (const slot of slotPlans.slice(0, 3)) {
    const keywords = Array.isArray(slot.keywords) ? slot.keywords.filter(Boolean).slice(0, 3) : []
    try {
      const result = await searchRestaurants({ location, radius: radius || 2000, keywords }, mapService)
      const pois = Array.isArray(result?.pois) ? result.pois : []
      const top = pois.slice(0, 2).map((p) => ({
        name: p.name,
        recommended_dish: (slot.tags || []).find((x) => String(x).includes('奶茶')) ? '招牌饮品' : '招牌菜',
        reason: slot.why || '',
        fit: Array.isArray(slot.tags) ? slot.tags.slice(0, 3) : [],
        address: p.address || '',
        distance: p.distance || '',
      }))
      all.push(...top)
    } catch {
      // ignore slot failure
    }
  }

  // 去重
  const seen = new Set()
  return all.filter((x) => {
    const key = x.name
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 6)
}
