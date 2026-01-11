# 🔧 修复 Overpass API 400 Bad Request 错误

## ⚠️ 问题

Overpass API 返回 400 Bad Request 错误，说明请求格式有问题。

## 🔍 问题分析

1. **客户端发送格式**：`{ query: 'Overpass QL query string' }` (JSON)
2. **服务器期望格式**：查询字符串（string）
3. **Vercel Serverless Functions** 会自动解析 JSON body
4. **问题**：请求体解析逻辑需要更健壮

## ✅ 已完成的修复

### 1. 改进请求体解析逻辑
- 支持字符串格式的请求体
- 支持对象格式的请求体（Vercel 自动解析的 JSON）
- 添加了类型检查和转换

### 2. 添加详细的错误日志
- 记录请求体类型和内容
- 方便调试和排查问题

### 3. 更好的错误提示
- 返回详细的错误信息
- 包含接收到的数据类型和内容

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到 `api/overpass.js` 显示为已修改
   - 在 "Summary (required)" 输入：`Fix: Improve Overpass API request body parsing for 400 errors`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **测试**
   - 清除浏览器缓存（`Ctrl + Shift + R`）
   - 使用 OpenStreetMap 搜索餐厅
   - 应该不会再出现 400 错误

## 💡 如果还是 400 错误

如果修复后还是 400 错误，请：

1. **查看 Vercel Functions 日志**
   - Vercel Dashboard > 项目 > Functions > api/overpass > Logs
   - 查看详细的错误日志（现在会显示接收到的数据类型和内容）

2. **检查请求格式**
   - 确认客户端发送的格式是否正确
   - 查看控制台中的请求详情

---

**修复后，Overpass API 应该能正确解析请求体了！**
