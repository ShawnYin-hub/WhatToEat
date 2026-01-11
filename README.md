# 今天吃什么

一个解决选择困难症的 Web 应用，帮助你决定今天吃什么。

## 技术栈

- React 18
- Tailwind CSS
- Framer Motion
- Vite

## 安装依赖

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 预览构建结果

```bash
npm run preview
```

## 功能特性

- 🎯 优雅的 Apple 极简主义设计
- 📍 地理位置获取
- 🏷️ 多选食物类型标签
- 📏 可调节搜索范围（500m - 5km）
- ✨ 流畅的动画效果
- 🗺️ 高德地图 API 集成
- 🎲 随机餐厅选择算法

## 环境变量配置

### 1. 创建环境变量文件

在项目根目录下创建 `.env.local` 文件（此文件已创建，API Key 已配置）。

如果文件不存在，可以复制 `.env.example` 文件：

```bash
cp .env.example .env.local
```

### 2. 配置 API Key

在 `.env.local` 文件中填入您的高德地图 API Key：

```
VITE_AMAP_API_KEY=your_api_key_here
```

**重要提示：**
- `.env.local` 文件包含敏感信息，已在 `.gitignore` 中排除，不会被提交到 Git
- 环境变量必须以 `VITE_` 开头才能在 Vite 项目中使用
- 修改环境变量后需要重启开发服务器

### 3. 获取高德地图 API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 进入控制台 → 应用管理 → 创建新应用
4. 添加 Key，选择 "Web 服务" 类型
5. 将生成的 Key 填入 `.env.local` 文件

## 设计规范

- 背景色: `#F5F5F7` (浅灰色)
- 文字色: `#1D1D1F` (深灰色)
- 卡片圆角: `24px`
- 卡片背景: 纯白

## API 使用说明

项目使用高德地图 Web 服务 API 的 `v3/place/around` 接口：

- **接口地址**: `https://restapi.amap.com/v3/place/around`
- **服务类型**: 餐饮服务 (types: 050000)
- **搜索范围**: 根据用户设置的半径（500m - 5km）
- **关键词**: 用户选择的菜系（火锅、快餐、日料、川菜、奶茶）
- **随机算法**: 从返回的餐厅列表中随机抽取一个结果
