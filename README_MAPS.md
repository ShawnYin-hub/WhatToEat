# 多地图服务支持说明

## 🌍 支持的地图服务

应用现在支持两种地图服务，用户可以根据所在地区选择：

### 1. 高德地图（默认）🇨🇳
- **适用地区**：中国内地
- **API Key**：已内置，可直接使用
- **功能**：完整支持所有功能

### 2. Google Maps 🌍
- **适用地区**：海外地区
- **API Key**：需要自行配置（可选）
- **功能**：完整支持所有功能

## 🎯 使用方式

1. 打开应用
2. 在"地图服务"区域选择：
   - **高德地图** - 如果您在中国内地
   - **Google Maps** - 如果您在海外
3. 选择服务后，所有功能将使用对应的API

## ⚙️ Google Maps 配置（可选）

如果您想使用 Google Maps：

1. **获取 API Key**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建项目并启用 Places API (New)
   - 创建 API Key

2. **配置环境变量**
   - 在 `.env.local` 文件中添加：
     ```env
     VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
     ```

3. **详细说明**
   - 查看 `GOOGLE_MAPS_SETUP.md` 获取完整配置指南

## 💡 建议

- **中国内地用户**：使用高德地图（默认，无需配置）
- **海外用户**：使用 Google Maps（需要配置 API Key）

## 🔄 切换地图服务

切换地图服务时：
- 已选择的位置会被清除
- 需要重新设置搜索位置
- 搜索的餐厅数据会来自对应的服务

## 📝 注意事项

- 高德地图 API Key 已内置，无需配置
- Google Maps API Key 需要用户自行获取和配置
- 两个服务的数据格式已统一，使用体验一致
