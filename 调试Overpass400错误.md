# 🔍 调试 Overpass API 400 错误

## ⚠️ 问题

Overpass API 返回 400 Bad Request 错误，需要查看详细日志来确定问题。

## ✅ 已完成的修复

### 1. 添加详细的调试日志
- 记录接收到的请求体类型和内容
- 记录解析后的 queryString
- 记录 Overpass API 返回的详细错误信息

### 2. 改进错误处理
- 记录查询预览
- 记录错误详情（限制长度避免日志过大）

## 📤 需要重新部署并查看日志

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到 `api/overpass.js` 显示为已修改
   - 在 "Summary (required)" 输入：`Debug: Add detailed logging for Overpass API 400 errors`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **触发错误并查看日志**
   - 清除浏览器缓存（`Ctrl + Shift + R`）
   - 使用 OpenStreetMap 搜索餐厅（触发错误）
   - 访问 Vercel Dashboard > 项目 > Functions > api/overpass > Logs
   - 查看详细的日志信息

4. **分析日志**
   - 查看 "Overpass API 请求" 日志：确认接收到的请求体格式
   - 查看 "解析后的 queryString" 日志：确认解析是否正确
   - 查看 "Overpass API error" 日志：查看 Overpass API 返回的具体错误

## 💡 可能的问题

根据日志，可能的问题包括：

1. **查询语法错误**
   - Overpass API 返回的 errorText 会显示具体的语法错误
   - 检查查询语句是否符合 Overpass QL 语法

2. **请求体解析问题**
   - 查看 "Overpass API 请求" 日志，确认接收到的格式
   - 查看 "解析后的 queryString" 日志，确认解析结果

3. **Overpass API 服务器问题**
   - 如果 errorText 显示服务器错误，可能是 Overpass API 服务器的问题

---

**部署后，请查看 Vercel Functions 日志，并根据日志信息确定问题！**
