import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { databaseService } from '../services/databaseService'
import { deepseekService } from '../services/deepseekService'
import PersonaModal from './PersonaModal'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/supabase'

function ProfilePage({ onBack }) {
  const { user, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [viewHistory, setViewHistory] = useState([])
  const [selectionHistory, setSelectionHistory] = useState([])
  const [persona, setPersona] = useState(null)
  const [showPersonaModal, setShowPersonaModal] = useState(false)
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const locale = (i18n.resolvedLanguage || i18n.language || 'zh').startsWith('en') ? 'en-US' : 'zh-CN'
  const formatDateTime = (ts) => {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts))
    } catch {
      return new Date(ts).toLocaleString(locale)
    }
  }
  const translateCuisine = (c) => t(`foods.cuisines.${c}`, { defaultValue: c })

  useEffect(() => {
    loadData()
  }, [user])

  // 监听页面可见性，当页面重新可见时刷新数据（用户可能在其他页面选择了餐厅）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('👀 页面可见，刷新历史记录')
        loadData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // 监听选择保存事件
    const handleSelectionSaved = (event) => {
      console.log('📢 收到选择保存事件，刷新历史记录:', event.detail)
      if (user) {
        // 延迟一点刷新，确保数据库已写入
        setTimeout(() => {
          loadData()
        }, 500)
      }
    }
    window.addEventListener('selectionSaved', handleSelectionSaved)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('selectionSaved', handleSelectionSaved)
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 加载用户资料
      const { data: profileData } = await databaseService.getUserProfile(user.id)
      if (profileData) {
        setDisplayName(profileData.display_name || '')
        setAvatarUrl(profileData.avatar_url || '')
      }

      // 加载统计数据
      const { data: statsData } = await databaseService.getUserStats(user.id)
      setStats(statsData)

      // 加载搜索历史
      const { data: searchData } = await databaseService.getUserSearchHistory(user.id, 30)
      setSearchHistory(searchData || [])

      // 加载浏览历史（抽取但未确认的）
      const { data: viewData } = await databaseService.getUserViewHistory(user.id, 50)
      
      // 加载选择历史（获取所有记录）
      const { data: selectionData } = await databaseService.getUserSelectionHistory(user.id)
      setSelectionHistory(selectionData || [])

      // 去重：如果一条记录既在 view_history 中，又在 selection_results 中
      // 应该只显示在"已确认的选择"中，不显示在"看了但没选"中
      const normalizeName = (name) => {
        if (!name) return ''
        // 更严格的规范化：去除所有空格、标点，统一小写
        return String(name)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '')  // 去除所有空格
          .replace(/[，。、！？；：]/g, '')  // 去除中文标点
          .replace(/[,.\-!?;:]/g, '')  // 去除英文标点
      }
      
      const selectionNames = new Set(
        (selectionData || [])
          .map((s) => normalizeName(s.restaurant_name))
          .filter(Boolean)
      )
      
      console.log('📊 选择结果数量:', selectionData?.length || 0)
      console.log('📊 浏览记录数量:', viewData?.length || 0)
      console.log('📊 选择结果列表:', (selectionData || []).map(s => s.restaurant_name))
      console.log('📊 浏览记录列表:', (viewData || []).map(v => v.restaurant_name))
      console.log('📊 规范化后的选择名称集合:', Array.from(selectionNames))
      
      const filteredViewHistory = (viewData || []).filter((view) => {
        const viewName = normalizeName(view.restaurant_name)
        const isSelected = selectionNames.has(viewName)
        if (isSelected) {
          console.log(`🔍 过滤掉已选择的记录: "${view.restaurant_name}" (规范化: "${viewName}")`)
        } else {
          console.log(`✓ 保留浏览记录: "${view.restaurant_name}" (规范化: "${viewName}")`)
        }
        // 如果这个餐厅名称在选择结果中存在，则从浏览历史中过滤掉
        return !isSelected
      })
      
      console.log('📊 去重后的浏览记录数量:', filteredViewHistory.length)
      console.log('📊 最终显示：已确认', selectionData?.length || 0, '条，浏览但未选', filteredViewHistory.length, '条')
      setViewHistory(filteredViewHistory)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePersona = async () => {
    setLoadingPersona(true)
    try {
      // 仅使用最近 10-20 条最终决策记录生成画像
      const recentSelections = (selectionHistory || []).slice(0, 20)
      const { data, error } = await deepseekService.generateUserPersona(recentSelections)
      if (error) {
        alert(t('profile.generateFailed', { error }))
      } else {
        setPersona(data)
        setShowPersonaModal(true)
      }
    } catch (error) {
      alert(t('profile.generateFailed', { error: error.message }))
    } finally {
      setLoadingPersona(false)
    }
  }

  const handleExportReport = () => {
    // 生成 HTML 报告
    const htmlContent = generateHTMLReport(user, stats, persona, selectionHistory)
    
    // 创建 Blob 并下载
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t('profile.exportFile', { date: new Date().toISOString().split('T')[0] })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await databaseService.upsertUserProfile(user.id, {
        email: user.email,
        display_name: displayName?.trim() || null,
        avatar_url: avatarUrl?.trim() || null,
      })
      if (error) throw error
      alert(t('profile.saveSuccess'))
    } catch (error) {
      alert(t('profile.saveFailed', { error: error.message || 'error' }))
    } finally {
      setSavingProfile(false)
    }
  }

  // 压缩和缩放图片
  const resizeImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // 计算缩放比例
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Canvas to Blob failed'))
              }
            },
            file.type,
            quality
          )
        }
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert(t('profile.invalidFileType'))
      return
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(t('profile.fileTooLarge'))
      return
    }

    setUploadingAvatar(true)
    try {
      // 压缩图片
      const resizedBlob = await resizeImage(file)
      
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`

      // 删除旧头像（如果存在）
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
        }
      }

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedBlob, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const newAvatarUrl = urlData.publicUrl

      // 更新数据库
      const { error: updateError } = await databaseService.upsertUserProfile(user.id, {
        email: user.email,
        display_name: displayName?.trim() || null,
        avatar_url: newAvatarUrl,
      })

      if (updateError) throw updateError

      setAvatarUrl(newAvatarUrl)
      alert(t('profile.saveSuccess'))
    } catch (error) {
      console.error('Upload error:', error)
      alert(t('profile.uploadFailed', { error: error.message || 'Unknown error' }))
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const generateHTMLReport = (user, stats, persona, selections) => {
    const topRestaurants = selections
      ?.slice(0, 3)
      ?.map((s, i) => `${i + 1}. ${s.restaurant_name} (${s.category})`)
      .join('<br>') || '暂无'

    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的美食报告 - whattoeat.today</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 28px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #1D1D1F; margin-bottom: 30px; font-size: 32px; }
    h2 { color: #1D1D1F; margin-top: 30px; margin-bottom: 15px; font-size: 24px; }
    .section { margin-bottom: 30px; padding: 20px; background: rgba(245,245,247,0.9); border-radius: 20px; border: 1px solid rgba(29,29,31,0.08); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
    .stat-item { text-align: center; padding: 15px; background: white; border-radius: 16px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1D1D1F; letter-spacing: -0.02em; }
    .stat-label { color: #666; margin-top: 5px; }
    .watermark { text-align: center; color: #999; margin-top: 40px; font-size: 14px; }
    p { line-height: 1.8; color: #333; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍽️ 我的美食报告</h1>
    
    <div class="section">
      <h2>用户信息</h2>
      <p><strong>邮箱:</strong> ${user?.email || '未知'}</p>
      <p><strong>报告生成时间:</strong> ${new Date().toLocaleString(locale)}</p>
    </div>

    ${stats ? `
    <div class="section">
      <h2>统计数据</h2>
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">${stats.weeklySearches || 0}</div>
          <div class="stat-label">本周搜索</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.totalSelections || 0}</div>
          <div class="stat-label">总选择数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.topCategory || '暂无'}</div>
          <div class="stat-label">最常菜系</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${persona ? `
    <div class="section">
      <h2>AI 画像称号</h2>
      <p>${persona.title || '暂无'}</p>
    </div>

    <div class="section">
      <h2>150字报告</h2>
      <p>${(persona.report || '暂无').replaceAll('\n', '<br>')}</p>
    </div>
    ` : ''}

    <div class="section">
      <h2>常选餐厅 TOP 3</h2>
      <p>${topRestaurants}</p>
    </div>

    <div class="watermark">
      <p>Generated by whattoeat.today</p>
    </div>
  </div>
</body>
</html>`
  }

  if (loading) {
    return (
      <div className="safe-area-container bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
      <div className="safe-area-container bg-gray-50 relative">
      {/* 顶部导航 */}
      <div className="bg-white sticky top-0 z-20 border-b border-gray-200 safe-top">
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

          <h1 className="text-lg font-semibold text-gray-900">
            {t('profile.title', '个人中心')}
          </h1>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20 pt-6 space-y-4">
        {/* 个人资料卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-md overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight break-words">
                {displayName || user?.email?.split('@')[0] || user?.email || t('select.unknown')}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('profile.explorer')}</p>
            </div>
          </div>
        </motion.div>

        {/* 统计数据 */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('profile.stats', '统计数据')}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{stats.weeklySearches || 0}</div>
                <div className="text-xs text-gray-600 mt-1">{t('profile.weeklySearches', '本周搜索')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{stats.totalSelections || 0}</div>
                <div className="text-xs text-gray-600 mt-1">{t('profile.totalSelections', '总选择')}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900 truncate">{stats.topCategory || '—'}</div>
                <div className="text-xs text-gray-600 mt-1">{t('profile.topCategory', '最常菜系')}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 基本资料编辑 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="text-sm text-gray-600">{t('profile.displayName')}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePlaceholder')}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-600 block mb-2">{t('profile.avatar')}</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-md overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement.innerHTML = (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                    }}
                  />
                ) : (
                  (displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <motion.label
                  htmlFor="avatar-upload"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block w-full py-3 px-4 bg-blue-50 text-blue-600 rounded-xl font-medium text-center cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  {uploadingAvatar ? t('profile.saving') : (avatarUrl ? t('profile.changeAvatar') : t('profile.uploadAvatar'))}
                </motion.label>
                <p className="text-xs text-gray-400 mt-2">{t('profile.avatarHint')}</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={savingProfile}
            onClick={handleSaveProfile}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-sm disabled:opacity-60"
          >
            {savingProfile ? t('profile.saving') : t('profile.save')}
          </motion.button>
        </motion.div>

        {/* AI 画像生成 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('profile.aiPersona', 'AI 美食画像')}</h3>
          
          {!persona ? (
            <motion.button
              onClick={handleGeneratePersona}
              disabled={loadingPersona}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-blue-500 text-white rounded-xl text-base font-medium shadow-sm hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loadingPersona ? t('profile.generating', '生成中...') : t('profile.generate', '生成我的 AI 画像')}
            </motion.button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {persona.title?.[0] || '🍽️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{persona.title || '美食探索者'}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{t('profile.personaGenerated', '画像已生成')}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setShowPersonaModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors active:scale-95"
                >
                  {t('profile.viewReport', '查看报告')}
                </motion.button>
                <motion.button
                  onClick={handleExportReport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3 px-4 bg-white text-blue-500 border-2 border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors active:scale-95"
                >
                  {t('profile.exportReport', '导出报告')}
                </motion.button>
              </div>
              
              <motion.button
                onClick={handleGeneratePersona}
                disabled={loadingPersona}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95"
              >
                {loadingPersona ? t('profile.generating', '生成中...') : t('profile.regenerate', '重新生成')}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* 历史记录 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-2 p-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex-1 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-2 -m-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-base font-medium text-gray-900 block">{t('profile.history', '历史记录')}</span>
                  <span className="text-xs text-gray-500">
                    {t('profile.historyCount', { count: selectionHistory.length + viewHistory.length }, `${selectionHistory.length + viewHistory.length} 条记录`)}
                  </span>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <motion.button
              onClick={loadData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="刷新历史记录"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>

          {showHistory && (selectionHistory.length > 0 || viewHistory.length > 0) && (
            <div className="border-t border-gray-100 max-h-[500px] overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* 已确认的选择（绿色标记 - 有设计感） */}
                {selectionHistory.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {t('profile.confirmedSelections', '已确认的选择')}
                      </span>
                      <span className="text-xs text-gray-400">({selectionHistory.length})</span>
                    </div>
                    {selectionHistory.map((item, index) => (
                      <motion.div
                        key={`selection-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group relative p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border-l-4 border-green-500 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        {/* 左侧绿色装饰条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-400 rounded-l-xl"></div>
                        
                        {/* 右上角确认图标 */}
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                {item.restaurant_name || '未知餐厅'}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {item.category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {item.address && (
                              <p className="text-xs text-gray-600 mt-2 truncate flex items-center gap-1">
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {item.address}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDateTime(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 浏览但未确认的记录（灰色标记 - 有设计感） */}
                {viewHistory.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2 mt-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {t('profile.viewedButNotSelected', '看了但没选')}
                      </span>
                      <span className="text-xs text-gray-400">({viewHistory.length})</span>
                    </div>
                    {viewHistory.map((item, index) => (
                      <motion.div
                        key={`view-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (selectionHistory.length + index) * 0.02 }}
                        className="group relative p-4 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 border-l-4 border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] opacity-75"
                      >
                        {/* 左侧灰色装饰条 */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-300 to-gray-400 rounded-l-xl"></div>
                        
                        {/* 右上角"跳过"图标 */}
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center shadow-sm">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                              {item.restaurant_name || '未知餐厅'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-200 text-gray-600 text-xs font-medium">
                                  {item.category}
                                </span>
                              )}
                              {item.rating && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-xs text-gray-500">{item.rating}</span>
                                </div>
                              )}
                              {item.distance > 0 && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {item.distance > 1000 ? `${(item.distance / 1000).toFixed(1)}km` : `${item.distance}m`}
                                </span>
                              )}
                            </div>
                            {item.address && (
                              <p className="text-xs text-gray-500 mt-2 truncate flex items-center gap-1">
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {item.address}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDateTime(item.viewed_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showHistory && selectionHistory.length === 0 && viewHistory.length === 0 && (
            <div className="border-t border-gray-100 p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">📝</div>
              <p className="text-gray-500 text-sm font-medium">{t('profile.noHistory', '暂无历史记录')}</p>
              <p className="text-gray-400 text-xs mt-1">开始使用"帮我选"功能吧！</p>
            </div>
          )}
        </motion.div>

        {/* 退出登录按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <button
            onClick={signOut}
            className="w-full text-left text-base font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            {t('profile.logout', '退出登录')}
          </button>
        </motion.div>

      </div>

      <PersonaModal
        isOpen={showPersonaModal}
        persona={persona}
        onClose={() => setShowPersonaModal(false)}
        onRegenerate={handleGeneratePersona}
      />
    </div>
  )
}

export default ProfilePage
