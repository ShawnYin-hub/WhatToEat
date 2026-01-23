// AI 推荐服务：结合画像与搜索/选择历史调用 DeepSeek 生成每日推荐
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = (import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/').replace(/\/+$/, '')
const DEEPSEEK_COMPLETIONS_URL = `${DEEPSEEK_BASE_URL}/v1/chat/completions`

import i18n from '../i18n'

function normalizeLanguage(lng) {
  if (!lng) return 'zh'
  const lower = String(lng).toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return 'zh'
}

function buildRecommendationPrompt({ selectionHistory = [], searchHistory = [], persona = null, lang = 'zh' }) {
  const selectionsText = JSON.stringify(selectionHistory?.slice?.(0, 30) || [], null, 2)
  const searchesText = JSON.stringify(searchHistory?.slice?.(0, 20) || [], null, 2)
  const personaText = persona ? JSON.stringify(persona, null, 2) : 'null'

  if (lang === 'en') {
    return {
      system: `You are a warm, supportive food companion.
Your tone should feel gentle, caring, and encouraging (never sarcastic).
Return STRICT JSON only (no Markdown, no extra text).`,
      user: `Use persona (may be null), selection_history, and search_history to craft today's cozy picks.
Return STRICT JSON:
{
  "title": "short headline",
  "tagline": "warm 1-2 lines, like a caring friend",
  "restaurants": [
    {
      "name": "restaurant name",
      "recommended_dish": "signature dish",
      "reason": "warm reason (<= 30 words)",
      "fit": ["tag1", "tag2"]
    }
  ]
}

persona:
${personaText}

selection_history (newest first):
${selectionsText}

search_history (newest first):
${searchesText}

Rules:
- Prefer tastes inferred from persona; if missing, rely on histories.
- Must output 3-5 restaurants (no empty array).
- Each reason should reference a preference signal (tag/history) implicitly.
- If little data, give safe, popular mainstream picks.
- Avoid pressure; keep it cozy and reassuring.`,
    }
  }

  return {
    system: `你是一个“暖心的美食搭子”，说话温柔、治愈、像朋友一样体贴（不要毒舌、不要说教）。
只返回严格 JSON，禁止 Markdown 或多余解释。`,
    user: `结合 persona（可能为 null）、selection_history、search_history 生成今日「暖心」推荐。
返回严格 JSON：
{
  "title": "简短标题",
  "tagline": "1-2 行暖心推荐语（像朋友一样）",
  "restaurants": [
    {
      "name": "餐厅名",
      "recommended_dish": "推荐菜",
      "reason": "不超过30字的暖心理由",
      "fit": ["匹配点1", "匹配点2"]
    }
  ]
}

persona：
${personaText}

selection_history（最新在前）：
${selectionsText}

search_history（最新在前）：
${searchesText}

规则：
- 优先使用 persona 的口味标签；缺失则依据历史。
- JSON 必须可解析。
- 必须输出 3-5 家餐厅（restaurants 不能为空）。
- reason 要“软一点”，不逼迫，像在照顾情绪。
- 数据不足时给大众口味的稳妥选项（也要给 3-5 家）。`,
  }
}

export async function generateAiRecommendations({ selectionHistory = [], searchHistory = [], persona = null } = {}) {
  if (!DEEPSEEK_API_KEY) {
    return {
      data: {
        title: '今天想好好吃一顿',
        tagline: '不急，慢慢挑～我给你备了几条温柔的选择。',
        restaurants: [
          { name: '附近口碑餐厅', recommended_dish: '招牌菜', reason: '先从大家都喜欢的开始，安心不踩雷。', fit: ['稳妥', '口碑'] },
          { name: '清爽轻食店', recommended_dish: '轻食碗/沙拉', reason: '想吃轻一点也很棒，身体会谢谢你。', fit: ['清淡', '轻负担'] },
          { name: '奶茶/咖啡店', recommended_dish: '奶茶/拿铁', reason: '下午也别忘了补点甜，给自己一点小奖励。', fit: ['奶茶', '甜品'] },
        ],
      },
      error: 'DeepSeek API Key 未配置',
    }
  }

  const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
  const { system, user } = buildRecommendationPrompt({ selectionHistory, searchHistory, persona, lang })

  try {
    const response = await fetch(DEEPSEEK_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.6,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const restaurants = Array.isArray(parsed.restaurants) ? parsed.restaurants : []
        return {
          data: {
            title: parsed.title || '今天想好好吃一顿',
            tagline: parsed.tagline || '不急，慢慢挑～我给你备了几条温柔的选择。',
            restaurants: restaurants.slice(0, 5).map((r) => ({
              name: r?.name || '附近口碑餐厅',
              recommended_dish: r?.recommended_dish || '招牌菜',
              reason: r?.reason || '先从大家都喜欢的开始，安心不踩雷。',
              fit: Array.isArray(r?.fit) ? r.fit.slice(0, 3) : [],
            })),
          },
          error: null,
        }
      }
    } catch (e) {
      // ignore parse error, fallback below
    }

    return {
      data: {
        title: '今天想好好吃一顿',
        tagline: content || '不急，慢慢挑～我给你备了几条温柔的选择。',
        restaurants: fallbackCopyForNoParse(),
      },
      error: null,
    }
  } catch (error) {
    console.error('生成 AI 推荐失败', error)
    return {
      data: {
        title: '今天想好好吃一顿',
        tagline: '不急，慢慢挑～就算今天状态一般，也值得吃点好的。',
        restaurants: fallbackCopyForNoParse(),
      },
      error: error.message || '生成推荐失败',
    }
  }
}

function fallbackCopyForNoParse() {
  return [
    { name: '附近口碑餐厅', recommended_dish: '招牌菜', reason: '先从大家都喜欢的开始，安心不踩雷。', fit: ['稳妥', '口碑'] },
    { name: '家常小馆', recommended_dish: '热乎家常菜', reason: '热热乎乎的一口，最能安慰疲惫。', fit: ['家常', '暖胃'] },
    { name: '奶茶/咖啡店', recommended_dish: '奶茶/拿铁', reason: '给自己一点甜，今天也会变轻一点。', fit: ['奶茶', '甜品'] },
  ]
}

function buildWarmNotificationPrompt({ slots = [], lang = 'zh' }) {
  const slotsText = JSON.stringify(slots, null, 2)

  if (lang === 'en') {
    return {
      system: `You write warm, catchy notification copy (Baidu Maps vibe: caring, inviting, short).
Return STRICT JSON only.`,
      user: `Write 3 notification messages for meal moments using the provided slot + top restaurant name(s).
Return STRICT JSON:
{
  "notifications": [
    { "slot": "lunch"|"afternoon_tea"|"dinner", "title": "short catchy title (<= 14 words)", "body": "warm, inviting body (<= 28 words)" }
  ]
}

Input:
${slotsText}

Rules:
- Keep it cozy, never pushy.
- Mention the restaurant name naturally (if provided).
- If restaurant is missing, still make it comforting.`
    }
  }

  return {
    system: `你擅长写“像百度地图那种”的通知文案：短、暖、很吸引人，但不催促。
只返回严格 JSON。`,
    user: `请根据给定的 slot 和该时段的“附近餐厅名”，写 3 条饭点/下午茶通知文案。
返回严格 JSON：
{
  "notifications": [
    { "slot": "lunch"|"afternoon_tea"|"dinner", "title": "14字内吸引人标题", "body": "28字内暖心正文" }
  ]
}

输入：
${slotsText}

规则：
- 语气像朋友，温柔、有点俏皮，但不油腻。
- 尽量自然带上餐厅名（如果有）。
- 没有餐厅名也要给出温柔替代。`
  }
}

export async function generateWarmNotifications({ slots = [] } = {}) {
  if (!DEEPSEEK_API_KEY) {
    return { data: null, error: 'DeepSeek API Key 未配置' }
  }
  const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
  const { system, user } = buildWarmNotificationPrompt({ slots, lang })

  try {
    const response = await fetch(DEEPSEEK_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    })
    if (!response.ok) throw new Error(`DeepSeek API 错误: ${response.status}`)
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const notifications = Array.isArray(parsed.notifications) ? parsed.notifications : []
      return { data: notifications, error: null }
    }

    return { data: null, error: null }
  } catch (e) {
    console.error('生成通知文案失败', e)
    return { data: null, error: e.message || '生成通知文案失败' }
  }
}
