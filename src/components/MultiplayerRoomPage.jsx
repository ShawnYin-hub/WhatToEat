import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { roomService } from '../services/roomService'
import SlotMachine from './SlotMachine'
import { searchRestaurants } from '../services/locationService'
import { getWeightedRecommendation } from '../services/recommendationEngine'

/**
 * 多人联机选餐页面
 */
function MultiplayerRoomPage({ onBack }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [mode, setMode] = useState('idle') // idle | host | join
  const [room, setRoom] = useState(null)
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [status, setStatus] = useState('waiting')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [channel, setChannel] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [slotKey, setSlotKey] = useState(0)
  const [allRestaurants, setAllRestaurants] = useState([])
  const [finalRestaurant, setFinalRestaurant] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [currentLocation, setCurrentLocation] = useState(null)
  const [userPreferences, setUserPreferences] = useState([])
  const [roomMembers, setRoomMembers] = useState([])

  const isHost = !!room && user && room.host_id === user.id

  // Host 创建房间后自动定位并搜索附近餐厅
  useEffect(() => {
    if (!isHost || !room?.id || room.current_candidates) return

    const fetchNearbyRestaurants = async () => {
      try {
        if (!navigator.geolocation) {
          console.warn('浏览器不支持定位')
          return
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            setCurrentLocation({ latitude, longitude })

            try {
              const result = await searchRestaurants(
                {
                  location: { latitude, longitude },
                  radius: 2000,
                  keywords: [],
                },
                'amap'
              )

              const pois = Array.isArray(result?.pois) ? result.pois : []
              const top10 = pois.slice(0, 10)

              if (top10.length > 0) {
                await roomService.updateRoomCandidates({
                  roomId: room.id,
                  candidates: top10,
                })
                setAllRestaurants(top10)
              }
            } catch (err) {
              console.error('搜索附近餐厅失败:', err)
            }
          },
          (err) => {
            console.warn('获取位置失败:', err)
          }
        )
      } catch (err) {
        console.error('定位失败:', err)
      }
    }

    fetchNearbyRestaurants()
  }, [isHost, room?.id, room?.current_candidates])

  // 订阅房间状态和候选餐厅变化
  useEffect(() => {
    if (!room?.id) return

    const sub = roomService.subscribeRoom(room.id, (payload) => {
      const newData = payload.new
      console.log('[MultiplayerRoomPage] Realtime 收到更新:', {
        status: newData?.status,
        final_restaurant_name: newData?.final_restaurant_name,
        event: payload.eventType,
        isHost: isHost ? 'Host' : 'Member',
      })
      
      if (newData?.status) {
        console.log('[MultiplayerRoomPage] Realtime: 更新状态', newData.status)
        setStatus(newData.status)
      }

      if (newData?.current_candidates && Array.isArray(newData.current_candidates)) {
        setAllRestaurants(newData.current_candidates)
      }

      if (newData?.status === 'rolling') {
        requestAnimationFrame(() => {
          setIsSpinning(true)
          setSlotKey((k) => k + 1)
        })
      }

      if (newData?.status === 'finished') {
        setIsSpinning(false)
        console.log('[MultiplayerRoomPage] Realtime: 收到 finished 状态', {
          final_restaurant_name: newData.final_restaurant_name,
          decision_reason: newData.decision_reason,
          isHost: isHost ? 'Host' : 'Member',
          current_candidates_count: Array.isArray(newData.current_candidates) ? newData.current_candidates.length : 0,
        })
        
        // 所有参与者（包括 Host 和成员）都通过 Realtime 同步显示结果
        // 延迟显示，让动画更流畅（与动画时长 2000ms 匹配）
        setTimeout(() => {
          const restaurantName = newData.final_restaurant_name || ''
          const reason = newData.decision_reason || ''
          
          console.log('[MultiplayerRoomPage] Realtime: 准备设置最终结果（所有参与者同步）:', { 
            restaurantName, 
            reason,
            isHost: isHost ? 'Host' : 'Member',
            allRestaurantsCount: allRestaurants.length,
          })
          
          if (restaurantName) {
            // 从候选列表中查找地址
            // 优先使用 room.current_candidates（最新），其次使用 allRestaurants
            const candidatesSource = newData.current_candidates || allRestaurants
            const selectedCandidate = Array.isArray(candidatesSource) 
              ? candidatesSource.find(r => r.name === restaurantName)
              : null
            const restaurantAddress = selectedCandidate?.address || selectedCandidate?.location?.address || ''
            
            console.log('[MultiplayerRoomPage] Realtime: 设置最终结果（所有参与者同步）', {
              restaurantName,
              restaurantAddress,
              reason,
              isHost: isHost ? 'Host' : 'Member',
              candidatesCount: Array.isArray(candidatesSource) ? candidatesSource.length : 0,
              foundCandidate: !!selectedCandidate,
            })
            
            // 设置状态和结果
            setFinalRestaurant({
              name: restaurantName,
              address: restaurantAddress,
            })
            setDecisionReason(reason)
            // 确保状态也更新
            setStatus('finished')
            
            console.log('[MultiplayerRoomPage] Realtime: ✅ 最终结果已设置，弹窗应该显示！', {
              restaurantName,
              isHost: isHost ? 'Host' : 'Member',
            })
          } else {
            console.warn('[MultiplayerRoomPage] Realtime: ⚠️ 收到 finished 状态但没有餐厅名称', {
              newData,
            })
          }
        }, 2100) // 延迟到动画完成后（2000ms 动画 + 100ms 缓冲），确保所有参与者同步看到结果
      }
    })

    setChannel(sub)
    return () => {
      sub?.unsubscribe()
    }
  }, [room?.id])

  // 成员端：从房间的 current_candidates 加载餐厅列表
  useEffect(() => {
    if (isHost || !room?.current_candidates) return

    if (Array.isArray(room.current_candidates) && room.current_candidates.length > 0) {
      setAllRestaurants(room.current_candidates)
    }
  }, [room?.current_candidates, isHost])

  // 加载房间成员列表
  useEffect(() => {
    if (!room?.id) return

    const loadMembers = async () => {
      const { data } = await roomService.getRoomMembers(room.id)
      if (data) {
        setRoomMembers(data)
      }
    }

    loadMembers()
    const interval = setInterval(loadMembers, 3000)
    return () => clearInterval(interval)
  }, [room?.id])

  const handleCreateRoom = async () => {
    if (!user) {
      setError(t('multiplayer.needLogin') || '请先登录')
      return
    }
    setLoading(true)
    setError('')
    try {
      // 添加调试日志
      console.log('[MultiplayerRoomPage] 准备创建房间，用户信息:', {
        user,
        userId: user?.id,
        userEmail: user?.email,
        hasUser: !!user,
        userKeys: user ? Object.keys(user) : [],
      })
      
      // 如果 useAuth 返回的 user 为空，尝试直接从 supabase 获取
      let actualUser = user
      if (!actualUser || !actualUser.id) {
        console.warn('[MultiplayerRoomPage] useAuth 返回的 user 为空，尝试从 supabase 获取')
        const { supabase } = await import('../services/supabase')
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('[MultiplayerRoomPage] 从 supabase 获取用户失败:', authError)
          throw new Error('用户未登录，无法创建房间')
        }
        if (!supabaseUser) {
          throw new Error('用户未登录，无法创建房间')
        }
        actualUser = supabaseUser
        console.log('[MultiplayerRoomPage] 从 supabase 获取到用户:', actualUser.id)
      }
      
      if (!actualUser || !actualUser.id) {
        throw new Error('用户未登录，无法创建房间')
      }
      
      const { data, error: err } = await roomService.createRoom({ hostId: actualUser.id })
      if (err) throw err
      setRoom(data)
      setInviteCode(data.code)
      setStatus(data.status || 'waiting')
      setMode('host')
    } catch (e) {
      console.error('创建房间失败', e)
      setError(e.message || '创建房间失败')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!user) {
      setError(t('multiplayer.needLogin') || '请先登录')
      return
    }
    if (!joinCode.trim()) {
      setError(t('multiplayer.enterCode') || '请输入房间码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await roomService.joinRoom({
        userId: user.id,
        code: joinCode,
      })
      if (err) throw err
      setRoom(data.room)
      setInviteCode(data.room.code)
      setStatus(data.room.status || 'waiting')
      setMode('join')
    } catch (e) {
      console.error('加入房间失败', e)
      setError(e.message || '加入房间失败')
    } finally {
      setLoading(false)
    }
  }

  // 任意成员点击「一起选」
  const handleTogetherSelect = async () => {
    if (!room || !user) {
      console.warn('[MultiplayerRoomPage] 房间或用户不存在')
      return
    }

    // 防止重复点击：如果已经在 rolling 或 finished 状态，不执行
    if (status === 'rolling' || status === 'finished') {
      console.log('[MultiplayerRoomPage] 选餐流程已在进行中或已完成，忽略重复点击')
      return
    }

    try {
      console.log('[MultiplayerRoomPage] 开始选餐流程...', { isHost, userId: user.id })
      setLoading(true)
      setError('')

      // 1. 确保有候选餐厅
      if (!allRestaurants.length && room.current_candidates) {
        console.log('[MultiplayerRoomPage] 从房间加载候选餐厅:', room.current_candidates.length)
        setAllRestaurants(room.current_candidates)
      }

      // 2. 更新状态为 rolling（触发动画）- 所有成员都可以触发
      console.log('[MultiplayerRoomPage] 更新房间状态为 rolling...')
      const rollingResult = await roomService.updateRoomStatus({ roomId: room.id, status: 'rolling' })
      if (rollingResult.error) {
        console.error('[MultiplayerRoomPage] 更新 rolling 状态失败:', rollingResult.error)
        throw rollingResult.error
      }
      console.log('[MultiplayerRoomPage] 房间状态已更新为 rolling')

      // 3. 获取候选餐厅列表
      let candidates = room.current_candidates || []
      if (!Array.isArray(candidates) || candidates.length === 0) {
        candidates = allRestaurants
      }
      console.log('[MultiplayerRoomPage] 候选餐厅数量:', candidates.length)

      if (candidates.length === 0) {
        const errorMsg = '还没有找到附近餐厅，请先确保已定位成功'
        console.error('[MultiplayerRoomPage]', errorMsg)
        setError(errorMsg)
        await roomService.updateRoomStatus({ roomId: room.id, status: 'waiting' })
        return
      }

      // 4. 获取成员偏好
      console.log('[MultiplayerRoomPage] 获取房间成员偏好...')
      const { data: members } = await roomService.getRoomMembers(room.id)
      const allPreferences = Array.isArray(members)
        ? members.map((m) => m.preferences).filter(Boolean)
        : []
      console.log('[MultiplayerRoomPage] 成员偏好:', allPreferences)

      const groupPreferences = allPreferences.length > 0
        ? {
            tags: Array.from(
              new Set(
                allPreferences
                  .flatMap((p) => (Array.isArray(p?.tags) ? p.tags : []))
                  .filter(Boolean)
              )
            ),
          }
        : null
      console.log('[MultiplayerRoomPage] 合并后的偏好:', groupPreferences)

      // 5. 调用 AI 推荐
      console.log('[MultiplayerRoomPage] 调用 AI 推荐引擎...')
      const recommendationResult = await getWeightedRecommendation({
        userId: user.id,
        location: currentLocation,
        mood: null,
        candidates,
        groupPreferences,
      })
      
      if (!recommendationResult) {
        throw new Error('AI 推荐返回空结果')
      }

      const bestName = recommendationResult.bestRestaurantName || ''
      const aiReason = recommendationResult.decision_reason || ''
      console.log('[MultiplayerRoomPage] AI 推荐结果:', { bestName, aiReason })

      if (!bestName) {
        throw new Error('AI 未能推荐餐厅')
      }
      
      // 从候选列表中获取完整信息（包括地址）
      const selectedCandidate = candidates.find(c => c.name === bestName) || candidates[0]
      const restaurantAddress = selectedCandidate?.address || selectedCandidate?.location?.address || ''
      console.log('[MultiplayerRoomPage] 选中的餐厅信息:', { bestName, restaurantAddress })

      // 6. 更新最终结果
      // 注意：只有 host 可以更新最终结果（数据库 RPC 函数限制）
      // 如果是成员触发的，这里会失败，但没关系，因为：
      // - 状态已经更新为 'rolling'，所有用户都能看到动画
      // - 成员端会通过 Realtime 监听看到 host 或其他成员执行的结果
      // - 如果多个成员同时点击，只有第一个成功执行完整流程的人会更新最终结果
      console.log('[MultiplayerRoomPage] 更新最终结果...', { bestName, aiReason, isHost })
      
      try {
        const finalResult = await roomService.updateRoomStatus({
          roomId: room.id,
          status: 'finished',
          patch: {
            final_restaurant_name: bestName,
            decision_reason: aiReason,
          },
        })

        if (finalResult.error) {
          // 如果不是 host，更新最终结果会失败，这是正常的
          // 成员端会通过 Realtime 看到 host 执行的结果
          if (!isHost) {
            console.log('[MultiplayerRoomPage] 成员无法更新最终结果，等待通过 Realtime 同步')
            // 恢复状态为 waiting，让 host 可以执行
            await roomService.updateRoomStatus({ roomId: room.id, status: 'waiting' })
            return
          }
          throw finalResult.error
        }

        console.log('[MultiplayerRoomPage] 选餐流程完成！', finalResult.data)
        
        // 执行完整流程的用户：立即更新本地状态（确保能看到结果）
        // 同时 Realtime 会同步给所有成员，成员端也会在 2100ms 后看到结果
        if (finalResult.data) {
          const restaurantName = finalResult.data.final_restaurant_name || bestName
          const reason = finalResult.data.decision_reason || aiReason
          
          if (restaurantName) {
            // 延迟显示，与动画同步（2100ms）
            setTimeout(() => {
              console.log('[MultiplayerRoomPage] 设置最终结果（直接设置）', {
                restaurantName,
                reason,
                restaurantAddress,
                isHost,
              })
              setFinalRestaurant({
                name: restaurantName,
                address: restaurantAddress,
              })
              setDecisionReason(reason)
              // 确保状态也更新为 finished
              setStatus('finished')
            }, 2100)
          }
        }
      } catch (updateError) {
        // 如果不是 host，更新最终结果会失败，这是正常的
        if (!isHost && updateError.message?.includes('Only the room host')) {
          console.log('[MultiplayerRoomPage] 成员无法更新最终结果，等待通过 Realtime 同步')
          // 恢复状态为 waiting，让 host 可以执行
          try {
            await roomService.updateRoomStatus({ roomId: room.id, status: 'waiting' })
          } catch (recoverError) {
            console.error('[MultiplayerRoomPage] 恢复状态失败:', recoverError)
          }
          return
        }
        throw updateError
      }
    } catch (e) {
      console.error('[MultiplayerRoomPage] 联机抽签失败:', e)
      const errorMsg = e.message || '联机抽签失败'
      setError(errorMsg)
      
      // 尝试恢复状态
      if (room?.id) {
        try {
          await roomService.updateRoomStatus({ roomId: room.id, status: 'waiting' })
        } catch (recoverError) {
          console.error('[MultiplayerRoomPage] 恢复状态失败:', recoverError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const renderHeader = () => (
    <div className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-2 safe-top bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.92 }}
          className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-semibold tracking-tight text-gray-900">
            {t('multiplayer.title')}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {t('multiplayer.subtitle')}
          </div>
        </div>
      </div>
    </div>
  )

  const renderIdle = () => (
    <div className="space-y-5">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateRoom}
        disabled={loading}
        className="w-full min-h-[56px] py-4 px-6 rounded-2xl bg-gray-900 text-white font-semibold text-base shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
      >
        {loading ? '...' : t('multiplayer.createRoom')}
      </motion.button>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex-1 h-px bg-gray-200" />
        <span>{t('multiplayer.orJoin')}</span>
        <span className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="flex gap-3">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base font-medium tracking-wider outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 transition-all"
          placeholder={t('multiplayer.enterCode')}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleJoinRoom}
          disabled={loading || !joinCode.trim()}
          className="min-w-[80px] rounded-2xl bg-gray-900 text-white font-semibold px-5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('multiplayer.join')}
        </motion.button>
      </div>
    </div>
  )

  const renderRoomInfo = () => (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-gray-100/60 shadow-sm"
      >
        <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          {t('multiplayer.roomCode')}
        </div>
        <div className="text-3xl font-mono tracking-[0.4em] text-gray-900 mb-2 font-semibold">
          {inviteCode || '------'}
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">
          {t('multiplayer.shareTip')}
        </div>
      </motion.div>

      {roomMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-100/60 shadow-sm"
        >
          <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            {t('multiplayer.participants')}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {roomMembers.map((member) => (
              <div
                key={member.user_id}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                title={member.user_id}
              >
                {member.user_id?.slice(0, 2).toUpperCase() || '?'}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )

  const renderRolling = () => (
    <AnimatePresence>
      {isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100/60"
        >
          <div className="text-center mb-4 text-sm text-gray-600 font-medium">
            {t('multiplayer.rolling')}
          </div>
          <SlotMachine
            key={slotKey}
            restaurants={allRestaurants.map((r) => ({
              name: r.name,
              type: r.type || '',
            }))}
            duration={2000}
            onComplete={() => {
              // 动画完成后，如果状态已经是 finished，会自动显示结果弹窗
              console.log('[MultiplayerRoomPage] 老虎机动画完成')
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )

  const renderResultModal = () => {
    // 添加调试日志
    console.log('[MultiplayerRoomPage] renderResultModal 检查:', {
      status,
      finalRestaurant,
      hasName: !!finalRestaurant?.name,
      decisionReason,
      shouldShow: !!finalRestaurant?.name,
    })
    
    // 放宽条件：只要有 finalRestaurant.name 就显示，不强制要求 status === 'finished'
    // 因为可能存在状态同步延迟，或者 Host 端已经设置了本地状态
    if (!finalRestaurant?.name) {
      console.log('[MultiplayerRoomPage] renderResultModal: 条件不满足，不显示弹窗（缺少餐厅名称）')
      return null
    }
    
    console.log('[MultiplayerRoomPage] renderResultModal: 显示弹窗！')

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // 点击背景不关闭，必须点击关闭按钮
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200/60 relative"
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                // 不关闭，让用户看到结果
                // 可以添加一个"再来一次"的按钮
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-4">
              {/* 庆祝动画 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="text-6xl mb-2"
              >
                🎉
              </motion.div>

              {/* 标题 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 font-medium"
              >
                {t('multiplayer.finalTitle')}
              </motion.div>

              {/* 餐厅名称 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl sm:text-3xl font-bold text-gray-900 break-words leading-tight px-2"
              >
                {finalRestaurant.name}
              </motion.div>

              {/* AI 理由 */}
              {decisionReason && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {t('multiplayer.aiReasonPrefix')}
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed px-2">
                    {decisionReason}
                  </div>
                </motion.div>
              )}

              {/* 参与者列表 */}
              {roomMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {t('multiplayer.participants')} ({roomMembers.length})
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {roomMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                        title={member.user_id}
                      >
                        {member.user_id?.slice(0, 2).toUpperCase() || '?'}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 操作按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6 flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 可以添加导航功能
                    if (finalRestaurant?.address) {
                      window.open(`https://uri.amap.com/navigation?to=${encodeURIComponent(finalRestaurant.address)}`, '_blank')
                    }
                  }}
                  className="flex-1 rounded-2xl bg-gray-900 text-white font-semibold py-3 px-4 text-sm"
                >
                  导航
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 关闭弹窗
                    setFinalRestaurant(null)
                    setDecisionReason('')
                    // 可以重置房间状态或保持 finished
                  }}
                  className="flex-1 rounded-2xl bg-gray-100 text-gray-700 font-semibold py-3 px-4 text-sm"
                >
                  知道了
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  const renderFinished = () => {
    // 这个函数保留用于非弹窗显示（如果需要）
    return null
  }

  const renderRules = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-8 pt-6 border-t border-gray-200/60"
    >
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-gray-100/60">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          {t('multiplayer.rulesTitle')}
        </div>
        <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono">1.</span>
            <span>{t('multiplayer.step1')}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono">2.</span>
            <span>{t('multiplayer.step2')}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono">3.</span>
            <span>{t('multiplayer.step3')}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono">4.</span>
            <span>{t('multiplayer.step4')}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono">5.</span>
            <span>{t('multiplayer.step5')}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100/60 text-gray-500 italic">
            {t('multiplayer.rulesNote')}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="safe-area-container bg-gradient-to-b from-gray-50 to-white flex flex-col relative overflow-hidden min-h-screen">
      {renderHeader()}
      <main className="flex-1 px-4 sm:px-6 pb-8 pt-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-700 rounded-2xl px-4 py-3 text-sm"
            >
              {error}
            </motion.div>
          )}

          {!room && renderIdle()}

          {room && (
            <div className="space-y-5">
              {renderRoomInfo()}

              {/* 偏好选择区 */}
              {status === 'waiting' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {t('multiplayer.selectPreferences')}
                  </div>
                  <PreferenceSelector
                    selected={userPreferences}
                    onChange={(tags) => {
                      setUserPreferences(tags)
                      if (room?.id && user) {
                        roomService.updatePreferences({
                          roomId: room.id,
                          userId: user.id,
                          preferences: { tags },
                        })
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 leading-relaxed">
                    {t('multiplayer.waitingTip')}
                  </div>
                </motion.div>
              )}

              {status === 'voting' && (
                <div className="text-sm text-gray-500 text-center py-2">
                  {t('multiplayer.votingTip')}
                </div>
              )}

              {/* 所有成员都可以点击"一起选"按钮 */}
              {(status === 'waiting' || status === 'voting') && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || status === 'rolling' || status === 'finished'}
                  onClick={handleTogetherSelect}
                  className="w-full min-h-[56px] rounded-2xl bg-gray-900 text-white font-semibold text-base shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {loading ? '...' : status === 'rolling' ? t('multiplayer.rolling') : t('multiplayer.togetherSelect') || '一起选'}
                </motion.button>
              )}

              {renderRolling()}
              {status === 'finished' && renderFinished()}
            </div>
          )}

          {renderRules()}
        </div>
      </main>

      {/* 结果弹窗 - 在所有内容之上 */}
      {renderResultModal()}
    </div>
  )
}

/**
 * 偏好选择器组件
 */
function PreferenceSelector({ selected = [], onChange }) {
  const { t } = useTranslation()
  const preferences = [
    { id: 'not_spicy', label: t('multiplayer.notSpicy') },
    { id: 'fast_food', label: t('multiplayer.fastFood') },
    { id: 'good_environment', label: t('multiplayer.goodEnvironment') },
    { id: 'group_friendly', label: t('multiplayer.groupFriendly') },
    { id: 'light_food', label: t('multiplayer.lightFood') },
    { id: 'budget_friendly', label: t('multiplayer.budgetFriendly') },
  ]

  const handleToggle = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(newSelected)
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {preferences.map((pref) => {
        const isSelected = selected.includes(pref.id)
        return (
          <motion.button
            key={pref.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleToggle(pref.id)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200/60 hover:bg-gray-50'
            }`}
          >
            {pref.label}
          </motion.button>
        )
      })}
    </div>
  )
}

export default MultiplayerRoomPage
