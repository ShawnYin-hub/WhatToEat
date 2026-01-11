# 🔧 修复 Overpass API 504 超时错误

## ⚠️ 问题

Overpass API 返回 504 Gateway Timeout 错误，说明查询超时了。

## ✅ 已完成的修复

### 1. 增加查询超时时间
- **查询语句超时**：从 30 秒增加到 **60 秒**
- 给 Overpass API 服务器更多时间处理查询

### 2. 增加服务器端超时
- **Vercel Function 超时**：从 35 秒增加到 **70 秒**
- 比查询超时稍长，确保有足够时间等待响应

### 3. 优化查询性能
- **限制返回数量**：从 100 个减少到 **50 个**
- 减少数据传输量，提高查询速度

### 4. 改进错误提示
- 如果返回 504 错误，显示更友好的提示
- 建议用户缩小搜索范围

## 📤 需要重新部署

### 步骤

1. **提交更改（GitHub Desktop）**
   - 打开 GitHub Desktop
   - 应该能看到以下文件显示为已修改：
     - `src/services/osmApi.js` - 增加查询超时和优化查询
     - `api/overpass.js` - 增加服务器超时
   - 在 "Summary (required)" 输入：`Fix: Increase Overpass API timeout to prevent 504 errors`
   - 点击 "Commit to main"
   - 点击 "Push origin"

2. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 查看部署进度（等待 1-2 分钟）

3. **测试**
   - 清除浏览器缓存（`Ctrl + Shift + R`）
   - 使用 OpenStreetMap 搜索餐厅
   - 应该不会再出现 504 错误

## 💡 如果还是超时

如果修复后还是超时，可以：

1. **缩小搜索范围**
   - 默认范围是 5000m（5km）
   - 尝试缩小到 3000m 或更小

2. **查看 Vercel Functions 日志**
   - Vercel Dashboard > 项目 > Functions > api/overpass > Logs
   - 查看详细的错误信息

---

**修复后，Overpass API 查询应该不会再超时了！**
