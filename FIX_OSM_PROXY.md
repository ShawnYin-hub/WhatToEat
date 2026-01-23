# 🔧 修复 OpenStreetMap 代理问题

## ⚠️ 问题

部署到 Vercel 后，OpenStreetMap 仍然报错 "fail to fetch" 和 CORS 错误。

**原因**：代码在生产环境中直接调用了 `nominatim.openstreetmap.org`，而不是使用 Vercel Serverless Functions 代理。

## ✅ 已修复

代码已更新，现在开发环境和生产环境都使用代理：

- `NOMINATIM_BASE_URL = '/api/nominatim'`
- `OVERPASS_API_URL = '/api/overpass'`

这样，请求会通过 Vercel Serverless Functions 代理，而不是直接从浏览器调用 OpenStreetMap API。

## 📤 下一步：重新部署

修复后，需要重新部署到 Vercel：

### 方法一：通过 GitHub（推荐）

1. **提交更改**
   - 使用 GitHub Desktop 或命令行提交代码
   ```bash
   git add .
   git commit -m "Fix: Use proxy for OpenStreetMap API"
   git push
   ```

2. **自动部署**
   - Vercel 会自动检测 GitHub 更新
   - 自动重新部署（通常 1-2 分钟）

3. **验证**
   - 访问您的 Vercel URL
   - 测试 OpenStreetMap 功能
   - 应该可以正常工作了

### 方法二：通过 Vercel CLI

```bash
cd C:\Users\30449\what-to-eat-today
vercel --prod
```

## ✅ 修复内容

- 修改了 `src/services/osmApi.js`
- 统一使用 `/api/nominatim` 和 `/api/overpass` 代理
- 开发环境和生产环境都使用相同的代理路径

## 🔍 验证

部署后，打开浏览器开发者工具，检查：

1. **网络请求**
   - 应该看到请求到 `/api/nominatim`（不是 `nominatim.openstreetmap.org`）
   - 应该看到请求到 `/api/overpass`（不是 `overpass-api.de`）

2. **功能测试**
   - 选择 OpenStreetMap
   - 搜索地点（如 "New York"）
   - 应该能正常显示结果

## 💡 技术说明

**之前的问题：**
- 开发环境：使用 `/api/nominatim`（Vite 代理）✅
- 生产环境：直接调用 `nominatim.openstreetmap.org` ❌（CORS 错误）

**修复后：**
- 开发环境：使用 `/api/nominatim`（Vite 代理）✅
- 生产环境：使用 `/api/nominatim`（Vercel Serverless Functions）✅

这样，所有环境都通过代理，避免了 CORS 问题。
