# 🌍 OpenStreetMap + Vercel 代理方案

## ✅ 已实现

应用现在支持使用 OpenStreetMap 作为免费的海外地图服务，通过 Vercel Serverless Functions 作为代理，完全免费且不需要绑卡。

## 📁 文件结构

```
what-to-eat-today/
├── api/                          # Vercel Serverless Functions
│   ├── nominatim.js              # Nominatim API 代理（地点搜索）
│   └── overpass.js               # Overpass API 代理（餐厅搜索）
├── src/
│   └── services/
│       └── osmApi.js             # OpenStreetMap API 客户端
├── vercel.json                   # Vercel 配置
└── DEPLOY_VERCEL.md              # 部署文档
```

## 🚀 如何使用

### 开发环境

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **使用 Vite 代理**
   - Vite 配置已设置代理到 `/api/nominatim` 和 `/api/overpass`
   - 开发环境会自动使用代理
   - 无需额外配置

### 生产环境（Vercel）

1. **部署到 Vercel**
   - 参考 `DEPLOY_VERCEL.md` 文档
   - 使用 Vercel CLI 或 GitHub 连接

2. **自动使用 Serverless Functions**
   - Vercel 会自动识别 `api/` 目录
   - Serverless Functions 作为代理处理请求
   - 完全免费（在免费套餐限制内）

## 🔧 API 端点

### `/api/nominatim`
- **用途**：地点搜索（地理编码）
- **方法**：GET
- **参数**：`query` (查询关键词)
- **返回**：地点列表（JSON）

### `/api/overpass`
- **用途**：餐厅搜索（POI查询）
- **方法**：POST
- **参数**：`query` (Overpass QL 查询语句)
- **返回**：餐厅列表（JSON）

## ✨ 优势

- ✅ **完全免费**：Vercel 免费套餐 + OpenStreetMap 免费 API
- ✅ **无需绑卡**：Vercel 免费套餐不需要信用卡
- ✅ **全球可用**：OpenStreetMap 覆盖全球
- ✅ **自动部署**：连接 GitHub 后自动部署
- ✅ **CORS 解决**：通过代理解决跨域问题

## 📝 注意事项

1. **API 限制**
   - Nominatim：建议每秒不超过 1 次请求
   - Overpass：有查询复杂度限制
   - 应用已实现防抖，避免过度请求

2. **Vercel 免费套餐限制**
   - 带宽：100GB/月
   - Serverless Functions：100GB-hours/月
   - 对于个人项目通常足够

3. **开发 vs 生产**
   - 开发环境：使用 Vite 代理
   - 生产环境：使用 Vercel Serverless Functions
   - 代码自动适配

## 🎯 使用场景

- ✅ 海外用户（推荐使用 OpenStreetMap）
- ✅ 不想绑卡的用户
- ✅ 需要全球地图数据的项目
- ✅ 个人项目和学习项目

## 🔄 更新和维护

1. **更新代码**：推送到 GitHub，Vercel 自动部署
2. **查看日志**：Vercel Dashboard > Functions > Logs
3. **监控使用**：Vercel Dashboard > Analytics

---

**快速开始：**
1. 参考 `DEPLOY_VERCEL.md` 部署到 Vercel
2. 在应用中选择 "OpenStreetMap" 地图服务
3. 开始使用免费的地图服务！
