# 🔧 修复 Overpass API HTML 错误响应

## ⚠️ 问题

Overpass API 返回 HTML 错误页面（而不是 JSON），说明：
1. 查询可能有问题
2. 或者服务器返回了错误页面

错误信息显示：
```
detail: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE html..."
```

这是 HTML/XML 错误页面，不是 JSON 响应。

## ✅ 已完成的修复

### 1. 检测 HTML 错误响应
- 检查响应 Content-Type
- 检查响应内容是否以 `<?xml` 或 `<!DOCTYPE` 开头
- 识别 HTML 错误页面

### 2. 提取错误信息
- 尝试从 HTML 中提取错误消息
- 使用正则表达式提取 `<p>` 或 `<h1>` 标签中的内容
- 提供更友好的错误消息

### 3. 检查响应内容类型
- 在解析 JSON 之前检查 Content-Type
- 如果返回非 JSON 响应，返回明确的错误

### 4. 改进错误日志
- 记录响应 Content-Type
- 记录是否为 HTML 错误
- 记录查询预览

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到 `api/overpass.js` 显示为已修改
   - 在 "Summary (required)" 输入：`Fix: Handle HTML error responses from Overpass API`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **测试并查看日志**
   - 清除浏览器缓存（`Ctrl + Shift + R`）
   - 使用 OpenStreetMap 搜索餐厅
   - 如果还有错误，查看 Vercel Functions 日志
   - 日志中会显示完整的 HTML 错误页面内容

## 💡 下一步

如果修复后还是返回 HTML 错误，请：

1. **查看 Vercel Functions 日志**
   - Vercel Dashboard > 项目 > Functions > api/overpass > Logs
   - 查看 "Overpass API error" 日志
   - 查看完整的 HTML 错误页面内容
   - HTML 中通常包含具体的错误原因

2. **检查查询语法**
   - 查看日志中的 "queryPreview"
   - 确认查询语法是否正确
   - 可能需要调整查询语句

---

**修复后，错误处理更完善了。如果还是有问题，请查看日志中的完整 HTML 错误页面内容！**
