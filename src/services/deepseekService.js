// DeepSeek API 服务（从环境变量读取）
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
// 开发环境使用代理，生产环境直接调用
const DEEPSEEK_BASE_URL = import.meta.env.DEV
  ? '/api/deepseek'  // 开发环境使用代理
  : (import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/').replace(/\/+$/, '')
const DEEPSEEK_COMPLETIONS_URL = `${DEEPSEEK_BASE_URL}/v1/chat/completions`

import i18n from '../i18n'

function normalizeLanguage(lng) {
  if (!lng) return 'zh'
  const lower = String(lng).toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('en')) return 'en'
  return 'zh'
}

function buildPersonaPrompt(recentSelections, lang) {
  const selectionsText = JSON.stringify(recentSelections, null, 2)

  if (lang === 'en') {
    return {
      system: `You are a professional, witty food critic.
You MUST write the persona report strictly in English.
The title MUST be in English as well.
Return strict JSON only (no Markdown, no extra explanations).`,
      user: `Analyze the user's recent final dining decisions (selection_results) and produce structured content for a high-design modal:
- title (<= 10 words)
- report (~150 words, funny but not mean)
- 6-8 short taste tags
- loves (3-5)
- avoids (2-4)
- signature dishes (3-6)
- one actionable tip (1 sentence, <= 20 words)

Recent selections (10-20, newest first):
${selectionsText}

Output MUST be strict JSON:
{
  "title": "short title",
  "report": "about 150 words",
  "tags": ["tag1", "tag2"],
  "loves": ["love1", "love2"],
  "avoids": ["avoid1", "avoid2"],
  "signature_dishes": ["dish1", "dish2"],
  "next_try": "one actionable tip"
}`,
    }
  }

  return {
    system: `你现在要扮演一位“专业、幽默且带有一点点毒舌的美食评论家”。
你必须严格使用中文输出画像报告，称号也必须是中文。
输出必须是严格 JSON（不要 Markdown，不要多余解释）。`,
    user: `我会给你用户最近的吃饭最终决策记录（selection_results）。请你分析用户口味偏好，做出一个“高设计感报告弹窗”需要的结构化内容：
- 专属称号（10字以内）
- 150字中文短报告（好笑但不刻薄）
- 6-8 个口味标签（短词）
- 更爱（3-5条）
- 雷区（2-4条）
- 代表菜（3-6条）
- 一句可执行建议（1句，<=35字）

用户最近选择记录（10-20条，越新越靠前）：
${selectionsText}

输出必须是严格 JSON（不要 Markdown，不要多余解释）：
{
  "title": "专属称号（10字以内）",
  "report": "约150字中文短报告",
  "tags": ["标签1", "标签2"],
  "loves": ["更爱1", "更爱2"],
  "avoids": ["雷区1", "雷区2"],
  "signature_dishes": ["代表菜1", "代表菜2"],
  "next_try": "一句可执行建议"
}`,
  }
}

function buildDailyRecommendationPrompt(selectionHistory, searchHistory, lang) {
  const selectionsText = JSON.stringify(selectionHistory?.slice?.(0, 30) || [], null, 2)
  const searchesText = JSON.stringify(searchHistory?.slice?.(0, 20) || [], null, 2)

  if (lang === 'en') {
    return {
      system: `You are a warm, supportive food companion who knows when people need to eat or grab milk tea.
Use only English.
Return STRICT JSON only (no Markdown, no chatter).`,
      user: `Based on the user's recent confirmed restaurants (selection_history) and recent searches (search_history), craft concise daily picks for three time slots: lunch, afternoon_tea (milk tea / coffee / desserts), and dinner.

Return STRICT JSON:
{
  "summary": "One-line headline for the day",
  "slots": [
    {
      "slot": "lunch" | "afternoon_tea" | "dinner",
      "title": "short idea (<= 12 words)",
      "why": "1-2 warm sentences why this fits today",
      "keywords": ["search keyword1", "keyword2"],
      "tags": ["spicy", "light", "milk tea", "..."],
      "drink_focus": "milk tea / coffee / none",
      "cta": "short call to action (<= 15 words)"
    }
  ]
}

selection_history (newest first, include category/address if any):
${selectionsText}

search_history (newest first):
${searchesText}

Rules:
- Keep JSON minimal.
- Afternoon_tea slot MUST lean to drinks/desserts (milk tea preferred if the history shows it).
- Keywords should be directly usable in a nearby search app.
- If history is empty, propose mainstream, safe choices.
- Tone: gentle, caring, and encouraging (no pressure).`,
    }
  }

  return {
    system: `你是一个“暖心的美食/奶茶提醒助手”，负责在饭点和下午茶给出灵感。
必须全程使用中文，且只返回严格 JSON，不要额外解释或 Markdown。`,
    user: `根据用户最近的最终决策记录 selection_history 和搜索记录 search_history，生成今日 3 个时段的推荐：午餐(lunch)、下午茶(afternoon_tea，偏奶茶/咖啡/甜品)、晚餐(dinner)。

返回严格 JSON：
{
  "summary": "今天的简短标题",
  "slots": [
    {
      "slot": "lunch" | "afternoon_tea" | "dinner",
      "title": "12字以内灵感",
      "why": "1-2 句暖心理由（像朋友一样）",
      "keywords": ["搜索关键词1", "关键词2"],
      "tags": ["清淡", "重口", "奶茶", "..."],
      "drink_focus": "奶茶/咖啡/无",
      "cta": "15字以内行动提示"
    }
  ]
}

selection_history（越新越前，包含分类/地址信息）：
${selectionsText}

search_history（越新越前）：
${searchesText}

规则：
- 只返回 JSON。
- afternoon_tea 必须偏饮品/甜品（若历史里常见奶茶要优先奶茶）。
- keywords 要能直接用于附近搜索。
- 没有历史时给大众口味的稳妥选项。
- 语气要温柔、鼓励、不催促。`,
  }
}

export const deepseekService = {
  // 生成用户画像
  async generateUserPersona(selectionHistory) {
    try {
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API Key 未配置')
      }

      const recentSelections = Array.isArray(selectionHistory) ? selectionHistory.slice(0, 20) : []
      const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
      const { system, user } = buildPersonaPrompt(recentSelections, lang)

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
            {
              role: 'system',
              content: system,
            },
            {
              role: 'user',
              content: user,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API 错误: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''

      // 尝试解析 JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            data: {
              title: parsed.title || '嘴刁但诚实的食客',
              report: parsed.report || content,
              tags: Array.isArray(parsed.tags) ? parsed.tags : [],
              loves: Array.isArray(parsed.loves) ? parsed.loves : [],
              avoids: Array.isArray(parsed.avoids) ? parsed.avoids : [],
              signature_dishes: Array.isArray(parsed.signature_dishes) ? parsed.signature_dishes : [],
              next_try: parsed.next_try || '',
            },
            error: null,
          }
        }
      } catch (e) {
        // ignore
      }

      return {
        data: {
          title: '嘴刁但诚实的食客',
          report: content,
          tags: [],
          loves: [],
          avoids: [],
          signature_dishes: [],
          next_try: '',
        },
        error: null,
      }
    } catch (error) {
      console.warn('DeepSeek API 错误（已降级）:', error.message || error)
      // 降级：返回空数据，不阻塞页面
      return {
        data: {
          title: '美食探索者',
          report: '你正在探索各种美食，保持好奇心，继续尝试新口味吧！',
          tags: ['探索中'],
          loves: [],
          avoids: [],
          signature_dishes: [],
          next_try: '',
        },
        error: null, // 不显示错误，让页面正常显示
      }
    }
  },

  // 生成每日时段推荐（午餐、下午茶、晚餐）
  async generateDailyRecommendations(options = {}) {
    const {
      selectionHistory = [],
      searchHistory = [],
    } = options

    try {
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API Key 未配置')
      }

      const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
      const { system, user } = buildDailyRecommendationPrompt(selectionHistory, searchHistory, lang)

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
          temperature: 0.65,
          max_tokens: 1000,
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
          const slots = Array.isArray(parsed.slots) ? parsed.slots : []
          return {
            data: {
              summary: parsed.summary || '',
              slots: slots.map((slot) => ({
                slot: slot.slot || 'lunch',
                title: slot.title || '',
                why: slot.why || '',
                keywords: Array.isArray(slot.keywords) ? slot.keywords : [],
                tags: Array.isArray(slot.tags) ? slot.tags : [],
                drink_focus: slot.drink_focus || '',
                cta: slot.cta || '',
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
          summary: '',
          slots: [],
        },
        error: null,
      }
    } catch (error) {
      console.warn('DeepSeek API 错误（已降级）:', error.message || error)
      // 降级：返回空推荐，不阻塞页面
      return {
        data: {
          summary: '今天也要好好吃饭',
          slots: [],
        },
        error: null, // 不显示错误，让页面正常显示
      }
    }
  },
}
