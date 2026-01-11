# Google Maps API 配置说明

## 📋 概述

应用现在支持两种地图服务：
- **高德地图**（默认）：适用于中国内地用户
- **Google Maps**：适用于海外用户

## 🔑 获取 Google Maps API Key

### 1. 访问 Google Cloud Console
- 打开 [Google Cloud Console](https://console.cloud.google.com/)
- 登录您的 Google 账户

### 2. 创建项目（如果还没有）
- 点击项目选择器
- 点击"新建项目"
- 输入项目名称，点击"创建"

### 3. 启用 API
- 在左侧菜单选择"API 和服务" > "库"
- 搜索并启用以下 API：
  - **Places API (New)** - 用于搜索地点和餐厅
  - （可选）**Maps JavaScript API** - 如果将来需要显示地图

### 4. 创建 API Key
- 转到"API 和服务" > "凭据"
- 点击"创建凭据" > "API 密钥"
- 复制生成的 API Key

### 5. 限制 API Key（推荐）
- 点击刚创建的 API Key 进行编辑
- **应用限制**：选择"HTTP 引荐来源网址（网站）"
  - 添加您的网站域名（如：`https://your-site.pages.dev/*`）
- **API 限制**：选择"限制密钥"
  - 只选择已启用的 API（Places API (New)）

## ⚙️ 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 💰 费用说明

Google Maps API 有免费额度：
- **Places API (New)**: 
  - 每月 $200 免费额度
  - Text Search: $17 per 1000 requests
  - Nearby Search: $32 per 1000 requests
  - 免费额度约等于每月 11,764 次 Text Search 或 6,250 次 Nearby Search

对于个人项目，免费额度通常足够使用。

## 🚀 使用方式

1. 在应用中点击"地图服务"选择器
2. 选择"Google Maps"选项
3. 如果未配置 API Key，会显示提示信息
4. 配置 API Key 后即可使用

## ⚠️ 注意事项

1. **API Key 安全**：
   - 不要在公开仓库中提交 API Key
   - 使用环境变量存储
   - 在 Cloudflare Pages 部署时通过环境变量配置

2. **CORS 配置**：
   - Google Maps API 支持 CORS
   - 无需额外配置代理

3. **配额管理**：
   - 在 Google Cloud Console 中设置配额限制
   - 监控 API 使用情况

## 🔧 故障排查

### 问题：API Key 无效
- 检查 API Key 是否正确
- 确认已启用必要的 API
- 检查 API 限制设置

### 问题：CORS 错误
- Google Maps API 通常不需要处理 CORS
- 如果遇到问题，检查 API Key 的域名限制

### 问题：配额超限
- 检查 Google Cloud Console 的使用情况
- 考虑升级付费计划或等待下月重置
