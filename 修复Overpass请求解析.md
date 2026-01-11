# 🔧 修复 Overpass API 请求体解析

## ⚠️ 问题

代码中的请求体解析逻辑有问题：
- 如果 `req.body.query` 不存在，代码会使用整个 `req.body` 对象
- 然后尝试将对象转换为字符串，可能变成 `[object Object]`
- 这会导致 Overpass API 返回 400 错误

## ✅ 已完成的修复

### 1. 修复请求体解析逻辑
- **只接受 `req.body.query` 字段**
- 如果 `query` 字段不存在或不是字符串，返回明确的错误
- 移除了可能导致问题的备用逻辑

### 2. 添加详细的错误日志
- 记录接收到的请求体结构
- 记录解析过程
- 记录 Overpass API 返回的详细错误

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到 `api/overpass.js` 显示为已修改
   - 在 "Summary (required)" 输入：`Fix: Improve Overpass API request body parsing logic`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **测试**
   - 清除浏览器缓存（`Ctrl + Shift + R`）
   - 使用 OpenStreetMap 搜索餐厅
   - 应该能正常工作了

## 💡 如果还是有问题

如果修复后还是有问题，请：

1. **提供完整的错误信息**
   - 包括控制台中的完整错误消息
   - 不只是错误堆栈

2. **查看 Vercel Functions 日志**
   - Vercel Dashboard > 项目 > Functions > api/overpass > Logs
   - 查看详细的日志信息

---

**修复后，请求体解析应该更可靠了！**
