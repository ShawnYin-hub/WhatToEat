# 🔧 修复 Overpass API 问题

## ⚠️ 问题

选择餐厅时出错，控制台显示：
- `POST https://overpass-api.de/api/interpreter 400 (Bad Request)`
- 错误：`parse error: Unknown type "{"`

**原因：**
1. 代码还在直接调用 `overpass-api.de`，而不是使用 `/api/overpass` 代理
2. Overpass API 代理函数需要正确处理数据格式

## ✅ 已修复

已更新 `api/overpass.js`，现在可以正确处理查询字符串。

## 📤 需要重新部署

修复后需要重新提交和部署：

### 步骤

1. **提交更改**
   - 使用 GitHub Desktop
   - 在 "Summary" 输入：`Fix: Overpass API proxy data format`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - Vercel 会自动检测更新并重新部署
   - 等待 1-2 分钟

3. **验证**
   - 访问网站
   - 测试选择餐厅功能
   - 应该可以正常工作了

## 🔍 技术说明

**问题原因：**
- Overpass API 需要纯文本的 Overpass QL 查询语句
- 前端发送 JSON 格式 `{query: "..."}` 给代理
- 代理需要提取 query 字段，然后作为纯文本发送给 Overpass API

**修复内容：**
- 更新了 `api/overpass.js`
- 正确处理 JSON 输入
- 提取 query 字段并作为纯文本发送
