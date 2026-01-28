// RecommendationEngine：结合天气、心情、历史记录和当前候选餐厅做 AI 加权推荐

import { getCurrentWeather } from './weatherService'
import { databaseService } from './databaseService'
import { matchesSelectedFoods } from './foodMappingService'

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
// 开发环境使用代理，生产环境直接调用
const DEEPSEEK_BASE_URL = import.meta.env.DEV
  ? '/api/deepseek'  // 开发环境使用代理
  : (import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/').replace(/\/+$/, '')
const DEEPSEEK_COMPLETIONS_URL = `${DEEPSEEK_BASE_URL}/v1/chat/completions`

/**
 * 根据 selection_results 粗略计算“重油/清淡/甜品”等偏好与连续重复度
 */
function analyzeSelectionHistory(history = []) {
  const recent = Array.isArray(history) ? history.slice(0, 10) : []

  const categoryCount = {}
  recent.forEach((item) => {
    // 兼容两种字段名：restaurant_category 或 category
    const cat = (item.restaurant_category || item.category || '').trim()
    if (!cat) return
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })

  // 判断是否"连吃 3 顿同类"
  let repeatedCategory = null
  if (recent.length >= 3) {
    const [a, b, c] = recent
    const catA = a.restaurant_category || a.category
    const catB = b.restaurant_category || b.category
    const catC = c.restaurant_category || c.category
    if (catA && catA === catB && catB === catC) {
      repeatedCategory = catA
    }
  }

  return {
    recent,
    categoryCount,
    repeatedCategory,
  }
}

/**
 * 分析用户"看了但没选"的模式，推断用户可能不喜欢的类型
 * @param {Array} viewHistory - view_history 表的数据（看了但没选的）
 * @param {Array} selectionHistory - selection_results 表的数据（选了的）
 */
function analyzeViewButNotSelected(viewHistory = [], selectionHistory = []) {
  // 统计每个 category 在 view_history 中出现的次数
  const viewCountByCategory = {}
  viewHistory.forEach((item) => {
    const cat = (item.category || '').trim()
    if (!cat) return
    viewCountByCategory[cat] = (viewCountByCategory[cat] || 0) + 1
  })

  // 统计每个 category 在 selection_results 中出现的次数
  // 注意：selection_results 表中字段名是 restaurant_category
  const selectCountByCategory = {}
  selectionHistory.forEach((item) => {
    // 兼容两种字段名：restaurant_category 或 category
    const cat = (item.restaurant_category || item.category || '').trim()
    if (!cat) return
    selectCountByCategory[cat] = (selectCountByCategory[cat] || 0) + 1
  })

  // 计算每个 category 的"拒绝率"和"看了但没选"的次数
  const dislikedCategories = []
  const allCategories = new Set([
    ...Object.keys(viewCountByCategory),
    ...Object.keys(selectCountByCategory),
  ])

  allCategories.forEach((cat) => {
    const viewCount = viewCountByCategory[cat] || 0
    const selectCount = selectCountByCategory[cat] || 0
    const total = viewCount + selectCount

    if (total === 0) return

    // 如果看了 3 次以上但一次都没选，或者拒绝率 > 70%，认为用户可能不喜欢
    const rejectionRate = viewCount / total
    if ((viewCount >= 3 && selectCount === 0) || (rejectionRate > 0.7 && viewCount >= 2)) {
      dislikedCategories.push({
        category: cat,
        viewCount,
        selectCount,
        rejectionRate: Math.round(rejectionRate * 100),
      })
    }
  })

  // 按拒绝率降序排序
  dislikedCategories.sort((a, b) => b.rejectionRate - a.rejectionRate)

  return {
    dislikedCategories: dislikedCategories.slice(0, 5), // 只取前 5 个最不喜欢的
    viewCountByCategory,
    selectCountByCategory,
  }
}

/**
 * 将候选 POI 列表映射为轻量结构，便于发送给 AI
 */
function mapCandidatesForAi(candidates = []) {
  return candidates.slice(0, 30).map((c) => ({
    id: c.id || c.uid || c.poiId || c.name, // 尽量给一个可识别的 id
    name: c.name || '',
    category: c.type || c.category || '',
    distance: c.distance != null ? Number(c.distance) : null,
    address: c.address || '',
    // 是否在商场内：简单根据名称/类型包含“商场/广场/购物中心”等关键词推断
    in_mall: /商场|广场|购物中心|mall|plaza/i.test(
      `${c.type || ''} ${c.name || ''} ${c.address || ''}`
    ),
    // 简单的价格或评分信息（如有）
    rating: c.biz_ext?.rating || c.rating || null,
  }))
}

/**
 * 构造 DeepSeek Prompt
 */
function buildAiPrompt({
  weather,
  mood,
  selectionAnalysis,
  viewAnalysis,
  candidates,
  groupPreferences = null,
  hasHistory = true,
  selectedFoods = [],
}) {
  const weatherBrief = {
    text: weather?.text || '未知',
    category: weather?.category || 'unknown',
    temp: weather?.temp,
  }

  const payload = {
    weather: weatherBrief,
    mood: mood || null,
    selection_analysis: hasHistory
      ? {
          recent: selectionAnalysis.recent,
          category_count: selectionAnalysis.categoryCount,
          repeated_category: selectionAnalysis.repeatedCategory,
        }
      : null,
    view_analysis: hasHistory && viewAnalysis?.dislikedCategories?.length > 0
      ? {
          disliked_categories: viewAnalysis.dislikedCategories.map((d) => ({
            category: d.category,
            rejection_rate: d.rejectionRate,
            view_count: d.viewCount,
            select_count: d.selectCount,
          })),
        }
      : null,
    group_preferences: groupPreferences,
    candidates: candidates,
  }

  const userJson = JSON.stringify(payload, null, 2)

  const system = `你是一名资深的美食点评家兼营养顾问，需要在一组候选餐厅中，基于"今天的天气、用户心情、最近饮食记录（是否重油重盐/是否连吃同类）、用户看了但没选的类型（推断用户不喜欢的）以及多人偏好交集（如有）"，给出"今天最适合吃哪家"的专业判断。

请严格返回可解析的 JSON，不要输出 Markdown 或多余文本。`

  const historyNote = hasHistory
    ? `- 若用户最近连续 3 次选择同一 category（selection_analysis.repeated_category 不为空）：
  - 在保证体验的前提下，适当降低这一类的权重，多给一点"换口味/更清爽"的建议。
- **重要**：若 view_analysis.disliked_categories 不为空，说明用户经常看这些类型的餐厅但从未选择或很少选择：
  - 这些类型在候选列表中应该被**显著降低权重**或**直接避开**（除非没有其他更好的选择）。
  - 例如：如果用户看了 5 次"火锅"但一次都没选，说明用户可能不喜欢火锅，应该优先推荐其他类型。`
    : `- 注意：这是一个新用户（没有历史饮食记录），请完全基于当前天气、心情和餐厅本身的素质（距离、评分、类型）进行推荐。`

  const user = `下面是今天的上下文信息（JSON 格式）。请基于这些信息，在 candidates 中选择"今天最推荐的一家餐厅"，并解释一句原因。

${selectedFoods && selectedFoods.length > 0 ? `**重要**：用户明确选择了以下菜品类型：${selectedFoods.join('、')}。你必须从匹配这些菜品类型的餐厅中选择，不能选择其他类型的餐厅。` : ''}

返回严格 JSON：
{
  "best_restaurant_id": "候选列表中的 id 或 name",
  "best_restaurant_name": "名称",
  "decision_reason": "一句简短中文理由（20字以内，解释为什么今天适合 TA）"
}

特别规则：
- 若天气为雨天（category = "rainy"），优先考虑：
  - in_mall = true 的商场内餐厅；
  - 或适合外卖/路程较近的选项（distance 较小）。
- 若天气为炎热（category = "hot"），优先考虑：
  - 清淡/轻食/冷饮类选项（可通过 category/名称中包含"轻食/沙拉/凉菜/冷饮/奶茶/咖啡"等判断）。
${historyNote}
- 若存在 group_preferences（多人偏好），在保证以上规则的前提下，优先满足大家都能接受的交集。
${selectedFoods && selectedFoods.length > 0 ? `- **必须遵守**：只能从匹配用户选择菜品（${selectedFoods.join('、')}）的餐厅中选择。` : ''}

以下是上下文 JSON：
${userJson}`

  return { system, user }
}

/**
 * 调用 DeepSeek 获取加权推荐结果（带 8 秒超时）
 */
async function callDeepseekForRecommendation(prompt) {
  if (!DEEPSEEK_API_KEY) {
    return {
      data: null,
      error: 'DeepSeek API Key 未配置（VITE_DEEPSEEK_API_KEY）',
    }
  }

  const timeoutMs = 8000 // 8 秒超时

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(DEEPSEEK_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`DeepSeek API 错误: ${res.status}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''

    // 尝试从内容中提取 JSON
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) {
      return { data: null, error: 'AI 返回内容无法解析为 JSON' }
    }

    const parsed = JSON.parse(match[0])
    return { data: parsed, error: null }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[RecommendationEngine] DeepSeek API 超时（8秒），切换到本地 Fallback')
      return { data: null, error: 'TIMEOUT' }
    }
    console.error('[RecommendationEngine] 调用 DeepSeek 失败', error)
    return { data: null, error: error.message || '调用 DeepSeek 失败' }
  }
}

/**
 * 简单 fallback：在没有 AI 的情况下，按距离 + 评分选一个
 * @param {Array} candidates - 候选餐厅列表
 * @param {Array} dislikedCategories - 用户不喜欢的类型列表（可选）
 */
function pickBySimpleRules(candidates = [], dislikedCategories = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null

  const dislikedSet = new Set(
    dislikedCategories.map((d) => (d.category || d).toLowerCase())
  )

  // 优先过滤掉用户不喜欢的类型（如果还有其他选择）
  let filtered = candidates
  const nonDisliked = candidates.filter(
    (c) => !dislikedSet.has((c.category || '').toLowerCase())
  )
  if (nonDisliked.length > 0) {
    filtered = nonDisliked
  }

  const sorted = [...filtered].sort((a, b) => {
    const da = a.distance != null ? Number(a.distance) : Infinity
    const db = b.distance != null ? Number(b.distance) : Infinity
    const ra = a.rating != null ? Number(a.rating) : 0
    const rb = b.rating != null ? Number(b.rating) : 0

    // 先按距离，再按评分
    if (da !== db) return da - db
    return rb - ra
  })

  return sorted[0]
}

/**
 * 主入口：获取加权推荐结果
 * @param {{
 *  userId: string | null,
 *  location: { latitude: number, longitude: number } | null,
 *  mood?: string | string[],
 *  candidates: any[],
 *  groupPreferences?: any,
 *  selectedFoods?: string[]
 * }} params
 */
export async function getWeightedRecommendation({
  userId,
  location,
  mood,
  candidates,
  groupPreferences = null,
  selectedFoods = [],
}) {
  // 如果没有候选，直接返回空
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return {
      bestRestaurantId: null,
      bestRestaurantName: '',
      decision_reason: '',
      rankedCandidates: [],
      error: '没有候选餐厅',
    }
  }

  // 如果用户选择了特定菜品，先过滤候选列表，确保只包含匹配的餐厅
  let filteredCandidates = candidates
  if (selectedFoods && selectedFoods.length > 0) {
    filteredCandidates = candidates.filter((candidate) =>
      matchesSelectedFoods(candidate, selectedFoods)
    )
    
    // 如果过滤后没有候选，返回空
    if (filteredCandidates.length === 0) {
      return {
        bestRestaurantId: null,
        bestRestaurantName: '',
        decision_reason: '',
        rankedCandidates: [],
        error: '没有匹配所选菜品的餐厅',
      }
    }
  }

  // 并行获取天气、选择历史和浏览历史
  const [weather, selectionHistoryRes, viewHistoryRes] = await Promise.all([
    location ? getCurrentWeather(location) : Promise.resolve({ category: 'unknown' }),
    userId ? databaseService.getUserSelectionHistory(userId, 10) : Promise.resolve({ data: [] }),
    userId ? databaseService.getUserViewHistory(userId, 30) : Promise.resolve({ data: [] }),
  ])

  const selectionHistory = selectionHistoryRes.data || []
  const viewHistory = viewHistoryRes.data || []
  const hasHistory =
    (Array.isArray(selectionHistory) && selectionHistory.length > 0) ||
    (Array.isArray(viewHistory) && viewHistory.length > 0)

  const selectionAnalysis = analyzeSelectionHistory(selectionHistory)
  const viewAnalysis = analyzeViewButNotSelected(viewHistory, selectionHistory)
  const aiCandidates = mapCandidatesForAi(filteredCandidates) // 使用过滤后的候选列表

  // 如果用户有明确不喜欢的类型，在本地也过滤一下候选列表（作为辅助，AI 也会考虑）
  let finalCandidates = aiCandidates
  if (viewAnalysis.dislikedCategories.length > 0) {
    const dislikedCategorySet = new Set(
      viewAnalysis.dislikedCategories.map((d) => d.category.toLowerCase())
    )
    // 不直接过滤，而是标记，让 AI 做最终决策
    finalCandidates = aiCandidates.map((c) => ({
      ...c,
      is_disliked_category: dislikedCategorySet.has((c.category || '').toLowerCase()),
    }))
  }

  const prompt = buildAiPrompt({
    weather,
    mood,
    selectionAnalysis,
    viewAnalysis,
    candidates: finalCandidates,
    groupPreferences,
    hasHistory,
    selectedFoods, // 传递用户选择的菜品
  })

  const { data: aiResult, error: aiError } = await callDeepseekForRecommendation(prompt)

  let best = null
  let decisionReason = ''

  if (!aiError && aiResult) {
    const targetId = aiResult.best_restaurant_id || aiResult.best_restaurant_name
    decisionReason = aiResult.decision_reason || ''

    if (targetId) {
      best =
        aiCandidates.find((c) => c.id === targetId || c.name === targetId) ||
        aiCandidates[0] ||
        null
    }
  }

  if (!best) {
    // fallback 简单规则（也考虑用户不喜欢的类型和选择的菜品）
    best = pickBySimpleRules(
      aiCandidates.filter((c) => {
        // 确保fallback也匹配用户选择的菜品
        if (selectedFoods && selectedFoods.length > 0) {
          return matchesSelectedFoods(c, selectedFoods)
        }
        return true
      }),
      viewAnalysis.dislikedCategories.map((d) => d.category)
    )
    if (!decisionReason) {
      if (aiError === 'TIMEOUT') {
        decisionReason = 'AI 思考太久，根据距离和评分帮你选了一家。'
      } else {
        decisionReason =
          weather?.category === 'rainy'
            ? '今天下雨，帮你选了近一点、走路轻松的。'
            : '综合距离和评分，帮你挑了一个相对稳妥的选择。'
      }
    }
  }

  return {
    bestRestaurantId: best?.id || best?.name || null,
    bestRestaurantName: best?.name || '',
    decision_reason: decisionReason,
    rankedCandidates: aiCandidates,
    error: aiError || null,
  }
}

