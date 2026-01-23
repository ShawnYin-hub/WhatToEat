// 历史记录诊断工具
import { supabase } from '../services/supabase'
import { databaseService } from '../services/databaseService'

export const historyDebug = {
  // 检查Supabase连接
  async checkConnection() {
    console.log('🔍 检查Supabase连接...')
    
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', SUPABASE_URL)
    console.log('Supabase Key exists:', !!SUPABASE_ANON_KEY)
    
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      console.error('❌ Supabase URL 未配置！')
      return false
    }
    
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
      console.error('❌ Supabase ANON KEY 未配置！')
      return false
    }
    
    console.log('✅ Supabase 配置正常')
    return true
  },
  
  // 检查用户登录状态
  async checkUserAuth() {
    console.log('🔍 检查用户登录状态...')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ 获取用户信息失败:', error)
      return null
    }
    
    if (!user) {
      console.warn('⚠️ 用户未登录！历史记录需要登录才能保存。')
      return null
    }
    
    console.log('✅ 用户已登录:', user.email)
    return user
  },
  
  // 检查数据库表是否存在
  async checkTables() {
    console.log('🔍 检查数据库表...')
    
    try {
      // 检查 search_history 表
      const { error: searchError } = await supabase
        .from('search_history')
        .select('id')
        .limit(1)
      
      if (searchError) {
        console.error('❌ search_history 表不存在或无权访问:', searchError)
      } else {
        console.log('✅ search_history 表存在')
      }
      
      // 检查 selection_results 表
      const { error: selectionError } = await supabase
        .from('selection_results')
        .select('id')
        .limit(1)
      
      if (selectionError) {
        console.error('❌ selection_results 表不存在或无权访问:', selectionError)
      } else {
        console.log('✅ selection_results 表存在')
      }
      
      return !searchError && !selectionError
    } catch (err) {
      console.error('❌ 检查表时出错:', err)
      return false
    }
  },
  
  // 测试保存搜索历史
  async testSaveSearchHistory(userId) {
    console.log('🔍 测试保存搜索历史...')
    
    try {
      const testData = {
        address: '测试地址',
        categories: ['川湘菜', '粤菜'],
        distance: 2000,
        mapService: 'amap',
      }
      
      const { data, error } = await databaseService.saveSearchHistory(userId, testData)
      
      if (error) {
        console.error('❌ 保存搜索历史失败:', error)
        return false
      }
      
      console.log('✅ 保存搜索历史成功:', data)
      return true
    } catch (err) {
      console.error('❌ 测试保存搜索历史时出错:', err)
      return false
    }
  },
  
  // 测试保存选择结果
  async testSaveSelectionResult(userId) {
    console.log('🔍 测试保存选择结果...')
    
    try {
      const testData = {
        restaurant_name: '测试餐厅',
        category: '川湘菜',
        address: '测试地址123号',
      }
      
      const { data, error } = await databaseService.saveSelectionResult(userId, testData)
      
      if (error) {
        console.error('❌ 保存选择结果失败:', error)
        return false
      }
      
      console.log('✅ 保存选择结果成功:', data)
      return true
    } catch (err) {
      console.error('❌ 测试保存选择结果时出错:', err)
      return false
    }
  },
  
  // 查看历史记录数量
  async checkHistoryCounts(userId) {
    console.log('🔍 检查历史记录数量...')
    
    try {
      const { data: searchData } = await databaseService.getUserSearchHistory(userId)
      const { data: selectionData } = await databaseService.getUserSelectionHistory(userId)
      
      console.log('📊 搜索历史数量:', searchData?.length || 0)
      console.log('📊 选择结果数量:', selectionData?.length || 0)
      
      if (searchData && searchData.length > 0) {
        console.log('最近搜索历史:', searchData[0])
      }
      
      if (selectionData && selectionData.length > 0) {
        console.log('最近选择结果:', selectionData[0])
      }
      
      return {
        searchCount: searchData?.length || 0,
        selectionCount: selectionData?.length || 0,
      }
    } catch (err) {
      console.error('❌ 检查历史记录数量时出错:', err)
      return null
    }
  },
  
  // 完整诊断
  async runFullDiagnostic() {
    console.log('🚀 开始完整诊断...')
    console.log('=' .repeat(50))
    
    // 1. 检查连接
    const connectionOk = await this.checkConnection()
    if (!connectionOk) {
      console.log('=' .repeat(50))
      console.error('❌ 诊断失败：Supabase 未正确配置')
      console.log('请创建 .env 文件并配置：')
      console.log('VITE_SUPABASE_URL=你的Supabase URL')
      console.log('VITE_SUPABASE_ANON_KEY=你的Supabase ANON KEY')
      return
    }
    
    // 2. 检查用户
    const user = await this.checkUserAuth()
    if (!user) {
      console.log('=' .repeat(50))
      console.warn('⚠️ 诊断警告：用户未登录')
      console.log('历史记录功能需要用户登录。请：')
      console.log('1. 注册账号')
      console.log('2. 登录')
      console.log('3. 重新测试')
      return
    }
    
    // 3. 检查表
    await this.checkTables()
    
    // 4. 测试保存功能
    await this.testSaveSearchHistory(user.id)
    await this.testSaveSelectionResult(user.id)
    
    // 5. 查看历史记录
    await this.checkHistoryCounts(user.id)
    
    console.log('=' .repeat(50))
    console.log('✅ 诊断完成！')
  }
}

// 在浏览器控制台中暴露诊断工具
if (typeof window !== 'undefined') {
  window.historyDebug = historyDebug
}
