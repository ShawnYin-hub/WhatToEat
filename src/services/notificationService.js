const DEFAULT_SLOTS = [
  { key: 'lunch', hour: 11, minute: 30 },
  { key: 'afternoon_tea', hour: 15, minute: 0 },
  { key: 'dinner', hour: 18, minute: 30 },
]

let timers = []

function isSupported() {
  return typeof window !== 'undefined' && typeof Notification !== 'undefined'
}

function getPermissionStatus() {
  if (!isSupported()) return 'denied'
  return Notification.permission
}

// 简单的 Toast 提示函数（如果项目中没有 Toast 组件）
function showToast(message, type = 'info') {
  // 尝试使用现有的 Toast 系统，如果没有则使用简单的 alert
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(message, type)
  } else {
    // 创建一个简单的临时提示
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeInOut 3s ease-in-out;
    `
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transition = 'opacity 0.3s'
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 2700)
  }
}

async function requestPermission() {
  if (!isSupported()) {
    showToast('当前环境不支持浏览器通知', 'error')
    return 'denied'
  }
  
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  
  // 如果之前被拒绝过，给用户友好提示
  if (Notification.permission === 'denied') {
    showToast('通知权限已被拒绝，请在浏览器设置中允许通知', 'error')
    return 'denied'
  }
  
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      showToast('通知权限已开启，饭点会自动提醒你', 'success')
    } else if (permission === 'denied') {
      showToast('通知权限被拒绝，无法接收饭点提醒', 'error')
    }
    
    return permission
  } catch (e) {
    console.error('通知权限请求失败', e)
    showToast('请求通知权限时出错，请稍后重试', 'error')
    return 'denied'
  }
}

function clearScheduled() {
  timers.forEach((id) => {
    clearTimeout(id)
  })
  timers = []
}

function getNextDelay(hour, minute) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime() - now.getTime()
}

function showNotification(content) {
  if (!isSupported() || Notification.permission !== 'granted') return false
  try {
    const { title, body, url } = content || {}
    const notification = new Notification(title || '饭点提醒', {
      body: body || '',
      silent: true,
      data: url || null,
    })
    if (url) {
      notification.onclick = (event) => {
        event.preventDefault()
        try {
          window.focus()
        } catch {
          // ignore
        }
        try {
          window.location.hash = url
        } catch {
          // ignore
        }
      }
    }
    return true
  } catch (e) {
    console.error('展示通知失败', e)
    return false
  }
}

function scheduleSlot(slot, rec, buildContent, onClickUrl) {
  const delay = getNextDelay(slot.hour, slot.minute)
  const timerId = window.setTimeout(() => {
    const payload = buildContent(slot, rec)
    if (onClickUrl && !payload.url) {
      payload.url = onClickUrl
    }
    showNotification(payload)
    // 安排下一天的通知
    scheduleSlot(slot, rec, buildContent, onClickUrl)
  }, delay)
  timers.push(timerId)
}

function defaultBuilder(slot, rec) {
  const titleMap = {
    lunch: '午餐灵感',
    afternoon_tea: '下午茶来点甜',
    dinner: '晚餐灵感',
  }
  const slotTitle = titleMap[slot.key] || '今日美食'
  const body = rec
    ? `${rec.title || ''}${rec.why ? ` · ${rec.why}` : ''}`
    : '看看附近有什么好吃的？'
  return { title: slotTitle, body }
}

function scheduleDailyRecommendations(recommendations = [], options = {}) {
  const buildContent = options.buildContent || defaultBuilder
  const onClickUrl = options.onClickUrl || '#/recommendation'
  clearScheduled()
  if (!isSupported() || Notification.permission !== 'granted') {
    return { scheduled: 0, error: 'no-permission' }
  }

  let scheduled = 0
  DEFAULT_SLOTS.forEach((slot) => {
    const rec = recommendations.find((r) => r.slot === slot.key)
    scheduleSlot(slot, rec, buildContent, onClickUrl)
    scheduled += 1
  })

  return { scheduled, error: null }
}

function sendTestNotification(content) {
  if (!isSupported()) return false
  if (Notification.permission !== 'granted') return false
  return showNotification(content || { title: '通知已开启', body: '测试提醒：稍后到饭点会自动推送。', url: '#/recommendation' })
}

export const notificationService = {
  DEFAULT_SLOTS,
  isSupported,
  getPermissionStatus,
  requestPermission,
  clearScheduled,
  scheduleDailyRecommendations,
  sendTestNotification,
}
