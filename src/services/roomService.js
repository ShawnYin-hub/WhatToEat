import { supabase } from './supabase'

// 生成 6 位邀请码：大写字母 + 数字
function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length)
    code += chars[idx]
  }
  return code
}

export const roomService = {
  /**
   * 创建房间
   * @param {{ hostId: string }} params
   */
  async createRoom({ hostId }) {
    try {
      // 验证用户是否登录
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !currentUser) {
        console.error('[roomService] 用户未登录:', authError)
        throw new Error('用户未登录，无法创建房间')
      }
      
      // 验证 hostId 是否匹配当前用户
      if (hostId !== currentUser.id) {
        console.error('[roomService] hostId 不匹配:', { hostId, currentUserId: currentUser.id })
        throw new Error('hostId 与当前用户不匹配')
      }
      
      console.log('[roomService] 创建房间，用户ID:', currentUser.id)
      console.log('[roomService] 传入的 hostId:', hostId)
      console.log('[roomService] hostId 匹配检查:', hostId === currentUser.id)
      
      // 确保 hostId 与当前用户ID匹配
      if (hostId !== currentUser.id) {
        console.error('[roomService] hostId 不匹配:', { hostId, currentUserId: currentUser.id })
        throw new Error('hostId 必须与当前登录用户ID匹配')
      }
      
      const code = generateRoomCode()
      
      // 先检查这个code是否已存在，如果存在则重新生成
      let attempts = 0
      let finalCode = code
      while (attempts < 10) {
        try {
          const { data: existing, error: checkError } = await supabase
            .from('rooms')
            .select('code')
            .eq('code', finalCode)
            .maybeSingle() // 使用 maybeSingle 避免 406 错误
          
          // 如果查询失败或没有找到，说明 code 可用
          if (checkError || !existing) break
          finalCode = generateRoomCode()
          attempts++
        } catch (err) {
          // 如果查询出错，假设 code 可用，继续
          console.warn('[roomService] 检查 code 时出错，继续使用:', err)
          break
        }
      }
      
      const insertData = {
        code: finalCode,
        host_id: currentUser.id, // 使用验证后的 currentUser.id
        status: 'waiting',
      }
      
      console.log('[roomService] 准备插入数据:', insertData)
      
      // 方法 1: 尝试使用 RPC 函数（如果存在）
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_room', {
          p_host_id: currentUser.id,
          p_code: finalCode,
          p_status: 'waiting',
        })
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log('[roomService] 使用 RPC 函数创建房间成功')
          return { data: rpcData[0], error: null }
        }
        
        if (rpcError) {
          console.warn('[roomService] RPC 函数不可用，使用直接 INSERT:', rpcError)
        }
      } catch (rpcErr) {
        console.warn('[roomService] RPC 函数调用失败，使用直接 INSERT:', rpcErr)
      }
      
      // 方法 2: 回退到直接 INSERT
      const { data, error } = await supabase
        .from('rooms')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('[roomService] 创建房间失败 - 详细错误:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          hostId,
          finalCode,
        })
        throw error
      }
      return { data, error: null }
    } catch (error) {
      console.error('[roomService] 创建房间失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 根据邀请码加入房间
   * @param {{ userId: string, code: string }} params
   */
  async joinRoom({ userId, code }) {
    try {
      const normalizedCode = (code || '').trim().toUpperCase()
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', normalizedCode)
        .single()

      if (roomError) throw roomError

      // 加入成员表（不存在则插入）
      const { data: member, error: memberError } = await supabase
        .from('room_members')
        .upsert(
          {
            room_id: room.id,
            user_id: userId,
            joined_at: new Date().toISOString(),
          },
          {
            onConflict: 'room_id,user_id',
          }
        )
        .select('*')
        .single()

      if (memberError) throw memberError

      return { data: { room, member }, error: null }
    } catch (error) {
      console.error('[roomService] 加入房间失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 更新成员偏好（JSON）
   * @param {{ roomId: string, userId: string, preferences: any }} params
   */
  async updatePreferences({ roomId, userId, preferences }) {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .upsert(
          {
            room_id: roomId,
            user_id: userId,
            preferences,
            joined_at: new Date().toISOString(),
          },
          {
            onConflict: 'room_id,user_id',
          }
        )
        .select('*')
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('[roomService] 更新偏好失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 获取房间成员及偏好
   */
  async getRoomMembers(roomId) {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('[roomService] 获取房间成员失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 更新房间状态及可选的结果字段
   * @param {{ roomId: string, status: string, patch?: object }} params
   */
  async updateRoomStatus({ roomId, status, patch = {} }) {
    try {
      const updateData = {
        status,
        ...patch,
      }
      
      // 尝试使用 RPC 函数（POST 方法，避免 CORS PATCH 问题）
      try {
        const { data, error } = await supabase.rpc('update_room_status', {
          p_room_id: roomId,
          p_status: status,
          p_final_restaurant_name: patch.final_restaurant_name || null,
          p_decision_reason: patch.decision_reason || null,
          p_current_candidates: patch.current_candidates || null,
        })

        if (error) throw error
        
        // RPC 函数返回数组，取第一个元素
        const roomData = Array.isArray(data) && data.length > 0 ? data[0] : data
        return { data: roomData, error: null }
      } catch (rpcError) {
        // 如果 RPC 函数不存在，回退到直接 UPDATE
        console.warn('[roomService] RPC 函数不可用，使用直接 UPDATE:', rpcError)
        
        const { data, error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', roomId)
          .select('*')
          .single()

        if (error) {
          console.error('[roomService] 更新房间状态失败 - 详细错误:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            updateData,
            roomId,
          })
          throw error
        }
        return { data, error: null }
      }
    } catch (error) {
      console.error('[roomService] 更新房间状态失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 更新房间的候选餐厅列表
   * @param {{ roomId: string, candidates: any[] }} params
   */
  async updateRoomCandidates({ roomId, candidates }) {
    try {
      // 尝试使用 RPC 函数（POST 方法，避免 CORS PATCH 问题）
      try {
        const { data, error } = await supabase.rpc('update_room_candidates', {
          p_room_id: roomId,
          p_candidates: candidates,
        })

        if (error) throw error
        
        // RPC 函数返回数组，取第一个元素
        const roomData = Array.isArray(data) && data.length > 0 ? data[0] : data
        return { data: roomData, error: null }
      } catch (rpcError) {
        // 如果 RPC 函数不存在，回退到直接 UPDATE
        console.warn('[roomService] RPC 函数不可用，使用直接 UPDATE:', rpcError)
        
        const { data, error } = await supabase
          .from('rooms')
          .update({
            current_candidates: candidates,
          })
          .eq('id', roomId)
          .select('*')
          .single()

        if (error) throw error
        return { data, error: null }
      }
    } catch (error) {
      console.error('[roomService] 更新候选餐厅失败:', error)
      return { data: null, error }
    }
  },

  /**
   * 订阅指定房间的 Realtime 状态变更
   * @param {string} roomId
   * @param {(payload: any) => void} onChange
   * @returns {{ unsubscribe: () => void }}
   */
  subscribeRoom(roomId, onChange) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          try {
            if (typeof onChange === 'function') {
              onChange(payload)
            }
          } catch (error) {
            console.error('[roomService] 处理房间变更回调出错:', error)
          }
        }
      )
      .subscribe()

    return {
      unsubscribe() {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.error('[roomService] 取消订阅失败:', error)
        }
      },
    }
  },
}

