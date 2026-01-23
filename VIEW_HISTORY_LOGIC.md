# "看了但没选"的判断条件说明

## 数据来源

### 1. `view_history` 表（看了但没选）
**记录时机：**
- 用户通过老虎机抽取到餐厅后，在 `ResultModal` 中**查看了餐厅信息**
- 但最终**没有点击"就吃这家"或"带我导航"**（即没有确认选择）
- 此时会调用 `databaseService.saveViewHistory()` 记录到 `view_history` 表

**字段：**
- `restaurant_name`: 餐厅名称
- `category`: 餐厅分类（如"火锅"、"日料"等）
- `address`: 地址
- `rating`: 评分
- `distance`: 距离
- `viewed_at`: 查看时间

### 2. `selection_results` 表（选了的）
**记录时机：**
- 用户在 `ResultModal` 中点击了**"就吃这家"**或**"带我导航"**按钮
- 此时会调用 `databaseService.saveSelectionResult()` 记录到 `selection_results` 表

**字段：**
- `restaurant_name`: 餐厅名称
- `category`: 餐厅分类
- `address`: 地址
- `timestamp`: 选择时间

## 判断逻辑（`analyzeViewButNotSelected` 函数）

### 核心算法

1. **统计每个 `category` 的出现次数**
   - `viewCount`: 该类型在 `view_history` 中出现的次数（看了但没选）
   - `selectCount`: 该类型在 `selection_results` 中出现的次数（选了的）

2. **计算"拒绝率"**
   ```
   拒绝率 = viewCount / (viewCount + selectCount)
   ```
   - 例如：看了 5 次"火锅"，选了 0 次 → 拒绝率 = 5/(5+0) = 100%
   - 例如：看了 4 次"日料"，选了 1 次 → 拒绝率 = 4/(4+1) = 80%

3. **判断用户不喜欢的标准**

   **标准 1：明确不喜欢**
   ```
   条件：viewCount >= 3 且 selectCount === 0
   说明：用户看了 3 次以上但一次都没选，明确表示不喜欢
   ```

   **标准 2：很可能不喜欢**
   ```
   条件：拒绝率 > 70% 且 viewCount >= 2
   说明：虽然偶尔会选，但大部分时候都跳过了，很可能不喜欢
   ```

### 示例场景

#### 场景 1：明确不喜欢
```
view_history: 5 次"火锅"
selection_results: 0 次"火锅"

分析结果：
- viewCount = 5
- selectCount = 0
- 拒绝率 = 100%
- 符合标准 1：viewCount >= 3 且 selectCount === 0
- 结论：用户明确不喜欢"火锅"
```

#### 场景 2：很可能不喜欢
```
view_history: 4 次"日料"
selection_results: 1 次"日料"

分析结果：
- viewCount = 4
- selectCount = 1
- 拒绝率 = 80% (> 70%)
- 符合标准 2：拒绝率 > 70% 且 viewCount >= 2
- 结论：用户很可能不喜欢"日料"（虽然偶尔会选）
```

#### 场景 3：正常偏好
```
view_history: 3 次"西餐"
selection_results: 5 次"西餐"

分析结果：
- viewCount = 3
- selectCount = 5
- 拒绝率 = 37.5% (< 70%)
- 不符合任何标准
- 结论：用户喜欢"西餐"（选的多，看的少）
```

## 在推荐引擎中的应用

### 1. 数据拉取
```javascript
// 同时拉取两种历史记录
const [selectionHistoryRes, viewHistoryRes] = await Promise.all([
  databaseService.getUserSelectionHistory(userId, 10),  // 最近 10 条选择
  databaseService.getUserViewHistory(userId, 30),       // 最近 30 条浏览
])
```

### 2. 分析处理
```javascript
const viewAnalysis = analyzeViewButNotSelected(viewHistory, selectionHistory)
// 返回：
// {
//   dislikedCategories: [
//     { category: "火锅", viewCount: 5, selectCount: 0, rejectionRate: 100 },
//     { category: "日料", viewCount: 4, selectCount: 1, rejectionRate: 80 }
//   ],
//   ...
// }
```

### 3. 传给 AI
在发送给 DeepSeek 的 Prompt 中，会包含：
```json
{
  "view_analysis": {
    "disliked_categories": [
      {
        "category": "火锅",
        "rejection_rate": 100,
        "view_count": 5,
        "select_count": 0
      }
    ]
  }
}
```

### 4. AI 决策规则
AI 会被告知：
- 如果 `view_analysis.disliked_categories` 不为空，这些类型应该被**显著降低权重**或**直接避开**
- 除非没有其他更好的选择，否则优先推荐其他类型

## 注意事项

1. **数据量要求**
   - 需要用户有一定使用历史才能有效分析
   - 至少要有几次"看了但没选"的记录

2. **时间范围**
   - 目前分析的是最近 30 条浏览记录和最近 10 条选择记录
   - 可以根据需要调整时间窗口

3. **分类粒度**
   - 目前基于 `category` 字段（如"火锅"、"日料"）
   - 如果分类不够细，可能无法准确识别用户偏好

4. **误判可能性**
   - 用户可能因为其他原因跳过（如价格、距离、时间等），而非不喜欢该类型
   - 但随着数据量增加，误判率会降低

## 后续优化方向

1. **时间衰减**：更久远的历史数据权重降低
2. **上下文考虑**：区分不同场景（工作日 vs 周末、午餐 vs 晚餐）
3. **多维度分析**：不仅看 category，还看价格、距离、评分等
4. **用户反馈**：允许用户手动标记"不喜欢"，直接加入黑名单
