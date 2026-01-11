# 🚀 部署到 Vercel（免费后端代理）

## 📋 概述

使用 Vercel 部署应用，可以免费使用 Serverless Functions 作为 OpenStreetMap API 的代理，完全免费且不需要绑卡。

## ✨ 优势

- ✅ **完全免费**：Vercel 免费套餐足够使用
- ✅ **无需绑卡**：Vercel 免费套餐不需要信用卡
- ✅ **自动 HTTPS**：自动配置 SSL 证书
- ✅ **全球 CDN**：快速访问
- ✅ **Serverless Functions**：自动处理 API 代理

## 📦 部署步骤

### 方法一：通过 Vercel CLI（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```
   - 使用 GitHub、GitLab 或 Bitbucket 账户登录

3. **在项目目录中部署**
   ```bash
   cd C:\Users\30449\what-to-eat-today
   vercel
   ```

4. **按照提示操作**
   - 是否要部署到现有项目？选择 `N`（新建项目）
   - 项目名称：`what-to-eat-today`（或任意名称）
   - 是否覆盖设置？选择 `Y`

5. **完成部署**
   - Vercel 会自动构建和部署
   - 完成后会提供一个 `*.vercel.app` 的免费域名

### 方法二：通过 GitHub 连接（自动部署）

1. **将项目推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # 在 GitHub 创建新仓库，然后：
   git remote add origin https://github.com/your-username/what-to-eat-today.git
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New..." > "Project"
   - 选择 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **环境变量（可选）**
   - 如果使用 Google Maps，添加 `VITE_GOOGLE_MAPS_API_KEY`
   - 如果使用高德地图，API Key 已内置

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成

## 📁 项目结构

部署后，Vercel 会自动识别：

```
what-to-eat-today/
├── api/                    # Serverless Functions
│   ├── nominatim.js        # Nominatim API 代理
│   └── overpass.js         # Overpass API 代理
├── src/                    # 前端代码
├── dist/                   # 构建输出
├── vercel.json             # Vercel 配置
└── package.json
```

## 🔧 配置说明

### vercel.json
- 配置 Serverless Functions 超时时间
- 配置路由重写规则

### API 代理函数

**api/nominatim.js**
- 代理 Nominatim 地理编码 API
- 解决 CORS 问题
- 设置 User-Agent

**api/overpass.js**
- 代理 Overpass API
- 用于搜索附近餐厅
- 处理 POST 请求

## ✅ 部署后验证

部署完成后，访问您的 Vercel URL（例如：`https://what-to-eat-today.vercel.app`）

测试：
1. ✅ 选择 OpenStreetMap 地图服务
2. ✅ 搜索地点（如 "New York"）
3. ✅ 自动定位功能
4. ✅ 搜索附近餐厅

## 📊 Vercel 免费套餐限制

- **带宽**：100GB/月
- **Serverless Functions**：100GB-hours/月
- **请求数**：无限制（合理使用）

对于个人项目，这些限制通常足够使用。

## 🔄 更新部署

### 使用 CLI
```bash
vercel --prod
```

### 使用 GitHub
- 推送到 GitHub
- Vercel 自动检测并重新部署

## 🌐 自定义域名（可选）

1. 在 Vercel 项目设置中
2. 点击 "Domains"
3. 添加您的域名
4. 按照提示配置 DNS

## 📝 注意事项

1. **API 限制**
   - Nominatim API 建议每秒不超过 1 次请求
   - Overpass API 有查询复杂度限制
   - 应用已实现防抖，避免过度请求

2. **环境变量**
   - 高德地图 API Key 已内置
   - 如需使用 Google Maps，在 Vercel 环境变量中配置

3. **构建优化**
   - Vercel 会自动优化构建
   - 静态文件使用 CDN 加速

## 🎉 完成！

部署完成后，您就有了一个完全免费的地图应用：
- ✅ 高德地图（中国用户）
- ✅ OpenStreetMap（全球用户，通过 Vercel 代理）
- ✅ Google Maps（可选，需要 API Key）

所有服务都可以正常使用，完全免费，无需绑卡！

---

**快速命令参考：**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```
