import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRandomRestaurant } from '../services/amapApi'
import { searchRestaurants } from '../services/locationService'
import { databaseService } from '../services/databaseService'
import { useAuth } from '../contexts/AuthContext'
import { getWeightedRecommendation } from '../services/recommendationEngine'
import { filterRestaurantsByFoods, getSearchKeywords } from '../services/foodMappingService'
import ResultModal from './ResultModal'
import SlotMachine from './SlotMachine'
import EmptyState from './EmptyState'
import { useTranslation } from 'react-i18next'

function SelectButton({ selectedFoods, range, location, mapService = 'amap' }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [allRestaurants, setAllRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [preferredRestaurantId, setPreferredRestaurantId] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [error, setError] = useState(null)
  const [slotKey, setSlotKey] = useState(0) // 用于强制重新渲染 SlotMachine

  const formatRestaurant = (restaurant) => {
    // 处理 location：高德地图返回字符串 "lng,lat"，GreenStreet 返回对象 { latitude, longitude }
    let location = null
    if (restaurant.location) {
      if (typeof restaurant.location === 'string') {
        // 高德地图格式："经度,纬度"
        const [lng, lat] = restaurant.location.split(',')
        if (lng && lat) {
          location = { lng, lat }
        }
      } else if (typeof restaurant.location === 'object') {
        // GreenStreet/高德地图格式：{ latitude, longitude } 或 { lng, lat }
        if (restaurant.location.latitude && restaurant.location.longitude) {
          location = {
            latitude: restaurant.location.latitude,
            longitude: restaurant.location.longitude,
          }
        } else if (restaurant.location.lng && restaurant.location.lat) {
          location = restaurant.location
        }
      }
    }

    return {
      name: restaurant.name || t('select.unknownRestaurant'),
      type: restaurant.type || '',
      address: restaurant.address || '',
      distance: parseInt(restaurant.distance || '0', 10),
      tel: restaurant.tel || '',
      rating: restaurant.biz_ext?.rating || restaurant.rating || null,
      location,
    }
  }

  const handleSelect = async () => {
    // 验证必要条件
    if (!location) {
      setError(t('select.needLocation'))
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedRestaurant(null)
    setIsSpinning(false) // 先不显示老虎机
    setShowEmptyState(false) // 隐藏空状态
    setPreferredRestaurantId(null)
    setDecisionReason('')

    try {
      // 获取搜索关键词（将用户选择的菜品转换为地图API可识别的关键词）
      const searchKeywords = getSearchKeywords(selectedFoods)
      
      // 调用地图服务 API
      const result = await searchRestaurants(
        {
          location,
          radius: range,
          keywords: searchKeywords.length > 0 ? searchKeywords : selectedFoods,
        },
        mapService
      )
      let pois = result.pois || []

      // 如果用户选择了特定菜品，过滤结果确保只返回匹配的餐厅
      if (selectedFoods && selectedFoods.length > 0) {
        pois = filterRestaurantsByFoods(pois, selectedFoods)
      }

      if (pois.length === 0) {
        setIsLoading(false)
        setShowEmptyState(true)
        return
      }

      // 如果之前显示了空状态，现在隐藏它
      if (showEmptyState) {
        setShowEmptyState(false)
      }

      // 保存所有餐厅用于换一家功能（已经是过滤后的结果）
      setAllRestaurants(pois)

      // 如果用户已登录，记录搜索历史
      if (user) {
        try {
          await databaseService.saveSearchHistory(user.id, {
            address: location.address || `${location.lat},${location.lng}`,
            categories: selectedFoods,
            distance: range,
            mapService,
          })
        } catch (err) {
          console.error('保存搜索历史失败:', err)
          // 不阻止用户使用，静默失败
        }
      }

      // 在开始老虎机动画前，尝试调用 AI 权重推荐
      // 注意：pois 已经是过滤后的结果，只包含匹配用户选择菜品的餐厅
      try {
        const weatherLocation =
          location && (location.latitude && location.longitude)
            ? { latitude: location.latitude, longitude: location.longitude }
            : location && (location.lat && location.lng)
              ? { latitude: location.lat, longitude: location.lng }
              : null

        const { bestRestaurantId, decision_reason } = await getWeightedRecommendation({
          userId: user?.id || null,
          location: weatherLocation,
          mood: null, // 预留心情参数，后续可从 UI 传入
          candidates: pois, // 已经是过滤后的结果
          selectedFoods: selectedFoods, // 传递用户选择的菜品，供AI参考
        })

        if (bestRestaurantId) {
          setPreferredRestaurantId(bestRestaurantId)
        }
        if (decision_reason) {
          setDecisionReason(decision_reason)
        }
      } catch (aiErr) {
        console.warn('AI 加权推荐失败，回退为普通随机:', aiErr)
      }

      // API 调用完成后，开始老虎机动画
      setIsLoading(false)
      setIsSpinning(true)
      setSlotKey((prev) => prev + 1) // 触发老虎机重新渲染

      // SlotMachine 组件会在动画完成后调用 handleSlotComplete
    } catch (err) {
      console.error('选择餐厅失败:', err)
      setError(err.message || t('select.fetchFailed'))
      setIsLoading(false)
    }
  }

  const handleSlotComplete = async () => {
    // 老虎机动画完成，优先选择 AI 推荐的餐厅，若没有则随机
    // 注意：allRestaurants 已经是过滤后的结果，只包含匹配用户选择菜品的餐厅
    if (allRestaurants.length > 0) {
      let target = null

      if (preferredRestaurantId) {
        target =
          allRestaurants.find(
            (poi) =>
              poi.id === preferredRestaurantId ||
              poi.uid === preferredRestaurantId ||
              poi.poiId === preferredRestaurantId ||
              poi.name === preferredRestaurantId
          ) || null
        
        // 如果AI推荐的餐厅不匹配用户选择的菜品，重新过滤
        if (target && selectedFoods && selectedFoods.length > 0) {
          const matches = filterRestaurantsByFoods([target], selectedFoods)
          if (matches.length === 0) {
            target = null // AI推荐的餐厅不匹配，重置为null
          }
        }
      }

      if (!target) {
        // 随机选择，但确保从已过滤的列表中随机（已经是匹配的）
        target = getRandomRestaurant(allRestaurants)
      }

      if (target) {
        const formattedRestaurant = formatRestaurant(target)
        setSelectedRestaurant(formattedRestaurant)
        setIsSpinning(false)
        setIsLoading(false)
        setShowModal(true)
        
        // 保存浏览记录（用户看到了但还未确认）
        if (user) {
          try {
            await databaseService.saveViewHistory(user.id, {
              restaurant_name: formattedRestaurant.name,
              category: formattedRestaurant.type || selectedFoods[0] || t('select.unknown'),
              address: formattedRestaurant.address || '',
              rating: formattedRestaurant.rating || null,
              distance: formattedRestaurant.distance || 0,
            })
            console.log('✅ 浏览记录已保存')
          } catch (err) {
            console.error('❌ 保存浏览记录失败:', err)
          }
        }
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
              <div className="text-base sm:text-lg font-medium text-apple-text">{t('actions.pickingForYou')}</div>
            </div>
            <SlotMachine
              key={slotKey}
              restaurants={allRestaurants.map((poi) => ({
                name: poi.name || t('select.unknownRestaurant'),
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
              {t('actions.searching')}
            </span>
          ) : isSpinning ? (
            <span className="relative z-10">{t('actions.picking')}</span>
          ) : (
            <span className="relative z-10">{t('actions.helpMeChoose')}</span>
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
        aiReason={decisionReason}
        onClose={() => {
          setShowModal(false)
          setSelectedRestaurant(null)
        }}
        onChangeRestaurant={handleChangeRestaurant}
        onConfirmSelection={async (restaurant) => {
          // 记录用户最终选择
          if (user && restaurant) {
            try {
              console.log('🔄 开始保存选择结果:', {
                userId: user.id,
                restaurantName: restaurant.name,
                category: restaurant.type || selectedFoods[0] || t('select.unknown'),
                address: restaurant.address || '',
              })
              
              const { data, error } = await databaseService.saveSelectionResult(user.id, {
                restaurant_name: restaurant.name,
                category: restaurant.type || selectedFoods[0] || t('select.unknown'),
                address: restaurant.address || '',
              })
              
              if (error) {
                console.error('❌ 保存选择结果失败:', error)
                alert(`保存失败: ${error.message || error}`)
              } else {
                console.log('✅ 选择结果已保存成功:', data)
                // 保存成功后，可以触发一个自定义事件，让 ProfilePage 知道需要刷新
                window.dispatchEvent(new CustomEvent('selectionSaved', { 
                  detail: { restaurantName: restaurant.name } 
                }))
              }
            } catch (err) {
              console.error('❌ 保存选择结果异常:', err)
              alert(`保存异常: ${err.message || err}`)
            }
          } else {
            console.warn('⚠️ 无法保存：用户或餐厅信息缺失', { user: !!user, restaurant: !!restaurant })
          }
        }}
        mapService={mapService}
      />
    </>
  )
}

export default SelectButton
