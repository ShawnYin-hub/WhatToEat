# 基于用户习惯的推荐引擎优化

## 改进目标

利用用户"看了但没选"的数据，更准确地推断用户品味，避免推荐用户不喜欢的餐厅类型。

## 数据来源

### 1. `view_history` 表（看了但没选的）
- 记录用户通过老虎机抽取出来查看，但最终没有选择的餐厅
- 字段：`restaurant_name`, `category`, `address`, `rating`, `distance`, `viewed_at`

### 2. `selection_results` 表（选了的）
- 记录用户最终确认选择的餐厅（点击"就吃这家"或"带我导航"）
- 字段：`restaurant_name`, `category`, `address`, `timestamp`

## 分析逻辑

### `analyzeViewButNotSelected` 函数

**核心算法：**
1. 统计每个 `category` 在 `view_history` 中出现的次数（`viewCount`）
2. 统计每个 `category` 在 `selection_results` 中出现的次数（`selectCount`）
3. 计算"拒绝率"：`rejectionRate = viewCount / (viewCount + selectCount)`

**判断用户不喜欢的标准：**
- **标准 1**：看了 3 次以上但一次都没选 → 明确不喜欢
- **标准 2**：拒绝率 > 70% 且看了至少 2 次 → 很可能不喜欢

**输出：**
- `dislikedCategories`: 按拒绝率降序排列的前 5 个类型
- 每个类型包含：`category`, `viewCount`, `selectCount`, `rejectionRate`

## AI Prompt 增强

### 新增信息字段

在发送给 DeepSeek 的 JSON 中，新增 `view_analysis` 字段：

```json
{
  "view_analysis": {
    "disliked_categories": [
      {
        "category": "火锅",
        "rejection_rate": 100,
        "view_count": 5,
        "select_count": 0
      },
      {
        "category": "日料",
        "rejection_rate": 75,
        "view_count": 4,
        "select_count": 1
      }
    ]
  }
}
```

### AI 决策规则

在 Prompt 中明确告诉 AI：
- 如果 `view_analysis.disliked_categories` 不为空，这些类型应该被**显著降低权重**或**直接避开**
- 除非没有其他更好的选择，否则优先推荐其他类型
- 例如：用户看了 5 次"火锅"但一次都没选，说明用户可能不喜欢火锅

## 代码改动

### 1. `src/services/recommendationEngine.js`

**新增函数：**
- `analyzeViewButNotSelected(viewHistory, selectionHistory)` - 分析"看了但没选"的模式

**修改函数：**
- `buildAiPrompt()` - 增加 `viewAnalysis` 参数，在 Prompt 中加入用户不喜欢的类型信息
- `getWeightedRecommendation()` - 同时拉取 `view_history` 和 `selection_results`，进行综合分析

**关键改动：**
```javascript
// 并行获取选择历史和浏览历史
const [selectionHistoryRes, viewHistoryRes] = await Promise.all([
  databaseService.getUserSelectionHistory(userId, 10),
  databaseService.getUserViewHistory(userId, 30),
])

// 分析"看了但没选"的模式
const viewAnalysis = analyzeViewButNotSelected(viewHistory, selectionHistory)

// 在 Prompt 中告诉 AI 用户不喜欢的类型
const prompt = buildAiPrompt({
  // ...
  viewAnalysis, // 新增
  // ...
})
```

## 使用示例

### 场景 1：用户明确不喜欢某类型

**数据：**
- `view_history`: 用户看了 5 次"火锅"类餐厅
- `selection_results`: 用户从未选择过"火锅"

**分析结果：**
```javascript
{
  dislikedCategories: [
    {
      category: "火锅",
      viewCount: 5,
      selectCount: 0,
      rejectionRate: 100
    }
  ]
}
```

**AI 行为：**
- 在候选列表中，如果出现"火锅"类餐厅，会被显著降低权重
- 优先推荐其他类型的餐厅

### 场景 2：用户对某类型犹豫不决

**数据：**
- `view_history`: 用户看了 4 次"日料"
- `selection_results`: 用户只选了 1 次"日料"

**分析结果：**
```javascript
{
  dislikedCategories: [
    {
      category: "日料",
      viewCount: 4,
      selectCount: 1,
      rejectionRate: 80
    }
  ]
}
```

**AI 行为：**
- 虽然用户偶尔会选择日料，但拒绝率较高（80%）
- 在推荐时会降低日料的权重，优先推荐用户更常选择的类型

## 优势

1. **更精准的推荐**：避免推荐用户明确不喜欢的类型
2. **数据驱动**：基于真实用户行为，而非猜测
3. **渐进式学习**：随着用户使用次数增加，推荐越来越精准
4. **尊重用户选择**：不会因为用户"看了"就认为用户喜欢

## 注意事项

1. **数据量要求**：需要用户有一定使用历史（至少看过几次餐厅）才能有效分析
2. **新用户处理**：如果用户没有历史数据，会回退到基于天气、距离、评分的推荐
3. **动态调整**：随着用户行为变化，不喜欢的类型列表会动态更新

## 后续优化方向

1. **时间衰减**：更久远的历史数据权重降低
2. **上下文考虑**：区分不同场景下的选择（例如：工作日 vs 周末）
3. **相似度分析**：不仅看 category，还看餐厅名称、地址等特征的相似度
4. **用户反馈**：允许用户手动标记"不喜欢"，直接加入黑名单
