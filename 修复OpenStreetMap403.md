# 🔧 修复 OpenStreetMap 403 错误

## ⚠️ 问题

Nominatim API 返回 403 Forbidden，说明 API 拒绝了请求。

## ✅ 已完成的修复

1. **移除了 Google Maps 选项**
   - 只保留高德地图和 OpenStreetMap

2. **优化 User-Agent**
   - 使用更标准的 User-Agent 格式
   - 添加应用 URL 信息

3. **添加详细的错误日志**
   - 记录错误详情
   - 方便调试

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到以下文件显示为已修改：
     - `src/components/MapServiceSelector.jsx` - 移除 Google Maps
     - `api/nominatim.js` - 优化 User-Agent
   - 在 "Summary (required)" 输入：`Remove Google Maps, fix OpenStreetMap 403`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **清除浏览器缓存并测试**
   - 按 `Ctrl + Shift + R` 强制刷新
   - 测试 OpenStreetMap 功能

## 🔍 如果还是 403

如果修复后还是 403，可能需要：

1. **查看详细的错误日志**
   - Vercel Functions > api/nominatim > Logs
   - 查看错误详情

2. **考虑使用其他 Nominatim 实例**
   - 某些公共 Nominatim 实例可能限制较少

3. **添加请求延迟**
   - 避免请求过于频繁
   - 遵守使用政策

## 💡 当前配置

- ✅ **高德地图** - 适用于中国用户
- ✅ **OpenStreetMap** - 适用于海外用户
- ❌ **Google Maps** - 已移除

---

**修复后，请测试 OpenStreetMap 功能，如果还有问题，查看 Vercel Functions 日志！**
