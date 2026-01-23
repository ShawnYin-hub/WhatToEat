import { supabase } from './supabase'

export const databaseService = {
  // 创建或更新用户资料
  async upsertUserProfile(userId, profileData) {
    try {
      // 验证 userId 是有效的 UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!userId || !uuidRegex.test(userId)) {
        console.error('[databaseService] 无效的 userId:', userId)
        return { data: null, error: new Error('无效的用户 ID') }
      }

      // 只保留数据库中存在的字段（根据 schema.sql）
      // user_profiles 表字段：id, email, display_name, avatar_url, created_at, updated_at
      const allowedFields = ['email', 'display_name', 'avatar_url']
      const sanitizedData = {}
      
      // 将 camelCase 转换为 snake_case（displayName -> display_name）
      if (profileData.displayName !== undefined) {
        sanitizedData.display_name = profileData.displayName
      }
      if (profileData.email !== undefined) {
        sanitizedData.email = profileData.email
      }
      if (profileData.avatar_url !== undefined) {
        sanitizedData.avatar_url = profileData.avatar_url
      }
      // 也支持直接传入 snake_case
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined && !sanitizedData[field]) {
          sanitizedData[field] = profileData[field]
        }
      })

      // 不手动设置 updated_at，让数据库触发器自动更新
      // 如果表中有 updated_at 字段，应该由触发器自动管理
      const payload = {
        id: userId,
        ...sanitizedData,
        // 注意：不包含 updated_at，让数据库触发器自动更新
      }

      console.log('[databaseService] 准备 upsert user_profiles:', {
        id: payload.id,
        fields: Object.keys(sanitizedData),
      })

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload, {
          onConflict: 'id'
        })
      
      if (error) {
        console.error('[databaseService] upsert user_profiles 失败:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          payload: { ...payload, id: payload.id }, // 不打印完整 payload，只打印结构
        })
        throw error
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('[databaseService] upsertUserProfile 异常:', error)
      return { data: null, error }
    }
  },

  // 获取用户资料
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 保存搜索历史
  async saveSearchHistory(userId, searchCriteria) {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          search_criteria: searchCriteria,
          timestamp: new Date().toISOString(),
        })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 获取用户搜索历史（最近30条）
  async getUserSearchHistory(userId, limit = 30) {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 保存浏览记录（抽取出来但未确认的餐厅）
  async saveViewHistory(userId, restaurantData) {
    try {
      const { data, error } = await supabase
        .from('view_history')
        .insert({
          user_id: userId,
          restaurant_name: restaurantData.restaurant_name,
          category: restaurantData.category,
          address: restaurantData.address,
          rating: restaurantData.rating,
          distance: restaurantData.distance,
          viewed_at: new Date().toISOString(),
        })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 获取用户浏览历史
  async getUserViewHistory(userId, limit = 50) {
    try {
      let query = supabase
        .from('view_history')
        .select('*')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
      
      if (limit !== null && limit !== undefined) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 保存选择结果（点击"就吃这家"或"带我导航"确认的餐厅）
  async saveSelectionResult(userId, restaurantData) {
    try {
      // 构建 payload，使用表中实际的字段名
      // 注意：表中字段名是 restaurant_category，不是 category
      const payload = {
        user_id: userId,
        restaurant_name: restaurantData.restaurant_name,
        restaurant_category: restaurantData.category || null, // 映射：category -> restaurant_category
        timestamp: new Date().toISOString(),
      }
      
      // 添加可选字段
      if (restaurantData.address) {
        payload.address = restaurantData.address
      }
      if (restaurantData.rating) {
        payload.rating = restaurantData.rating
      }
      
      console.log('💾 准备保存选择结果:', payload)
      
      const { data, error } = await supabase
        .from('selection_results')
        .insert(payload)
        .select()
      
      if (error) {
        console.error('❌ Supabase 保存选择结果失败:', error)
        throw error
      }
      
      console.log('✅ 选择结果已保存到 Supabase:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ 保存选择结果异常:', error)
      return { data: null, error }
    }
  },

  // 获取用户选择历史
  async getUserSelectionHistory(userId, limit = null) {
    try {
      let query = supabase
        .from('selection_results')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
      
      // 如果指定了 limit，则应用限制；否则获取所有记录
      if (limit !== null && limit !== undefined) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      // 将数据库字段名映射为代码中使用的字段名
      // restaurant_category -> category (为了兼容现有代码)
      const mappedData = (data || []).map((item) => ({
        ...item,
        category: item.restaurant_category || item.category || null, // 兼容两种字段名
      }))
      
      return { data: mappedData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // 获取用户统计数据
  async getUserStats(userId) {
    try {
      // 获取本周搜索次数
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: searchData, error: searchError } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', weekAgo.toISOString())

      if (searchError) throw searchError

      // 获取最常吃的菜系（使用实际字段名 restaurant_category）
      const { data: selectionData, error: selectionError } = await supabase
        .from('selection_results')
        .select('restaurant_category, category') // 兼容两种字段名
        .eq('user_id', userId)

      if (selectionError) throw selectionError

      // 统计菜系（优先使用 restaurant_category，如果没有则用 category）
      const categoryCount = {}
      selectionData?.forEach(item => {
        const cat = item.restaurant_category || item.category
        if (cat) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
        }
      })

      const topCategory = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '暂无'

      return {
        data: {
          weeklySearches: searchData?.length || 0,
          topCategory,
          totalSearches: searchData?.length || 0,
          totalSelections: selectionData?.length || 0,
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  },
}
