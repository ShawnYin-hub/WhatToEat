# 🔧 修复 Overpass API 数据格式问题

## ⚠️ 问题

错误信息显示：
- `parse error: Unknown type "{"`
- `';' expected - '"query"' found.`

**原因：**
- Overpass API 收到了 JSON 格式 `{"query":"..."}`
- 但 Overpass API 需要纯文本的 Overpass QL 查询语句
- 代理函数没有正确提取 query 字段

## ✅ 已修复

已更新 `api/overpass.js`，现在可以正确处理各种请求体格式：
- 支持 JSON 对象：`{query: "..."}`
- 支持字符串：`"query string"`
- 自动提取 query 字段并转换为字符串

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到 `api/overpass.js` 显示为已修改
   - 在 "Summary (required)" 输入：`Fix: Overpass API request body parsing`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 找到您的项目
   - 查看部署进度（等待 1-2 分钟）

3. **清除浏览器缓存并测试**
   - 按 `Ctrl + Shift + R` 强制刷新
   - 测试选择餐厅功能
   - 应该可以正常工作了

## 🔍 技术说明

**数据流程：**

1. **前端发送：**
   ```javascript
   fetch('/api/overpass', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ query: "Overpass QL query..." })
   })
   ```

2. **代理函数接收并处理：**
   - 检查请求体格式（字符串或对象）
   - 提取 query 字段
   - 转换为字符串

3. **代理函数发送给 Overpass API：**
   ```javascript
   fetch('https://overpass-api.de/api/interpreter', {
     method: 'POST',
     headers: {'Content-Type': 'text/plain'},
     body: queryString  // 纯文本，不是 JSON
   })
   ```

**关键修复：**
- 支持多种请求体格式
- 正确提取 query 字符串
- 确保发送纯文本给 Overpass API

---

**重要：修复后必须重新部署才能生效！**
