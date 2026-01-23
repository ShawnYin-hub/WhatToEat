# 今天吃什么 - 完整项目文档

> 本文档包含项目的完整信息，可直接提供给AI助手（如Gemini）理解整个项目

## 📋 项目概述

**项目名称**: 今天吃什么 (What To Eat Today)  
**项目描述**: 一个帮助用户解决"选择困难症"的Web应用，根据用户位置和偏好随机推荐附近的餐厅  
**项目类型**: React单页应用 (SPA)  
**技术栈**: React 18 + Vite + Tailwind CSS + Framer Motion

## 🛠️ 技术栈

### 核心框架
- **React 18.2.0**: UI框架
- **Vite 5.0.0**: 构建工具和开发服务器
- **Framer Motion 10.4.4**: 动画库

### 样式
- **Tailwind CSS 3.3.5**: 实用优先的CSS框架
- **PostCSS + Autoprefixer**: CSS后处理

### 地图服务支持
- **高德地图 (Amap)**: 中国大陆主要使用
- **Google Maps**: 海外地区可选
- **OpenStreetMap (OSM)**: 完全免费，全球可用（使用Nominatim + Overpass API）

### 部署
- **Vercel**: 主要部署平台，使用Serverless Functions作为API代理

## 📁 项目结构

```
what-to-eat-today/
├── src/                          # 源代码目录
│   ├── App.jsx                   # 主应用组件
│   ├── main.jsx                  # 应用入口
│   ├── index.css                 # 全局样式
│   ├── components/               # React组件
│   │   ├── EmptyState.jsx       # 空状态组件（无搜索结果时显示）
│   │   ├── ErrorBoundary.jsx    # 错误边界组件
│   │   ├── FoodChips.jsx        # 食物类型选择标签
│   │   ├── LocationButton.jsx   # 位置按钮组件
│   │   ├── LocationSelector.jsx # 位置选择器组件（自动定位+手动搜索）
│   │   ├── MapServiceSelector.jsx # 地图服务选择器
│   │   ├── RangeSlider.jsx      # 搜索范围滑块
│   │   ├── ResultModal.jsx      # 结果弹窗组件
│   │   ├── SelectButton.jsx     # 主操作按钮（"帮我选"）
│   │   └── SlotMachine.jsx      # 老虎机动画组件
│   ├── services/                 # API服务层
│   │   ├── locationService.js   # 统一位置服务接口（根据地图服务类型路由）
│   │   ├── amapApi.js           # 高德地图API调用
│   │   ├── amapApiJsonp.js      # 高德地图JSONP备用方案
│   │   ├── googleMapsApi.js     # Google Maps API调用
│   │   ├── osmApi.js            # OpenStreetMap API调用
│   │   ├── poiSearchApi.js      # POI搜索API
│   │   └── geocodeApi.js        # 地理编码API
│   └── utils/                    # 工具函数
│       └── navigation.js        # 导航URL生成
├── api/                          # Vercel Serverless Functions
│   ├── nominatim.js             # Nominatim API代理（解决CORS）
│   └── overpass.js              # Overpass API代理（解决CORS）
├── dist/                         # 构建输出目录
├── public/                       # 静态资源
├── package.json                  # 项目依赖和脚本
├── vite.config.js               # Vite配置文件
├── tailwind.config.js           # Tailwind CSS配置
├── vercel.json                  # Vercel部署配置
└── README.md                    # 项目说明文档
```

## 🔑 核心功能

### 1. 地图服务选择
用户可以选择使用哪种地图服务：
- **高德地图** (amap): 默认，适合中国大陆
- **OpenStreetMap** (osm): 完全免费，适合全球
- **Google Maps** (google): 可选，需要API Key

### 2. 位置获取
两种方式获取位置：
- **自动定位**: 使用浏览器Geolocation API获取当前位置
- **手动搜索**: 输入地址关键词，调用相应地图服务的搜索API

### 3. 食物类型选择
支持多选食物类型标签：
- 火锅、快餐、日料、川菜、奶茶等
- 可以同时选择多个类型

### 4. 搜索范围设置
可调节的搜索半径：
- 范围：500m - 5km
- 默认：2km
- 使用滑块UI控制

### 5. 餐厅搜索与随机选择
- 根据位置、范围、食物类型搜索附近餐厅
- 显示老虎机动画增加趣味性
- 从搜索结果中随机选择一个餐厅
- 支持"换一家"功能，可重新随机选择

### 6. 结果展示
显示选中的餐厅信息：
- 餐厅名称
- 地址
- 距离
- 评分（如果有）
- 电话（如果有）
- 导航链接（根据地图服务生成）

## 📄 核心代码文件

### package.json

```json
{
  "name": "what-to-eat-today",
  "version": "1.0.0",
  "description": "今天吃什么 - 解决选择困难症",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.4.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^5.0.0"
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/amap/, ''),
        secure: true,
      },
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('User-Agent', 'WhatToEatToday/1.0')
            proxyReq.removeHeader('referer')
            proxyReq.removeHeader('origin')
          })
        },
      },
      '/api/overpass': {
        target: 'https://overpass-api.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/overpass/, ''),
        secure: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_AMAP_API_KEY': JSON.stringify(
      process.env.VITE_AMAP_API_KEY || '59db828f842e5c5666d401e86911ce1d'
    ),
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ''
    ),
  },
})
```

### src/App.jsx

主应用组件，负责整体布局和状态管理：

```javascript
import { useState } from 'react'
import { motion } from 'framer-motion'
import LocationSelector from './components/LocationSelector'
import MapServiceSelector from './components/MapServiceSelector'
import FoodChips from './components/FoodChips'
import RangeSlider from './components/RangeSlider'
import SelectButton from './components/SelectButton'

function App() {
  const [mapService, setMapService] = useState('amap') // 'amap', 'osm', 'google'
  const [selectedFoods, setSelectedFoods] = useState([])
  const [range, setRange] = useState(2000) // 默认 2km
  const [location, setLocation] = useState(null)

  return (
    <div className="min-h-screen bg-apple-bg flex flex-col relative overflow-hidden">
      {/* 背景渐变动效 */}
      {/* 顶部标题区域 */}
      {/* 中间配置区域卡片 */}
      {/* 底部按钮 */}
    </div>
  )
}

export default App
```

**主要状态**:
- `mapService`: 当前选择的地图服务
- `selectedFoods`: 选中的食物类型数组
- `range`: 搜索范围（米）
- `location`: 当前位置对象 `{latitude, longitude, formatted_address}`

### src/services/locationService.js

统一的位置服务接口，根据地图服务类型路由到不同的API实现：

```javascript
import { searchPOI, searchPOIJsonp } from './poiSearchApi'
import { fetchRestaurants } from './amapApi'
import { fetchRestaurantsJsonp } from './amapApiJsonp'
import { searchGooglePlaces, fetchGoogleRestaurants } from './googleMapsApi'
import { searchOSMLocation, fetchOSMRestaurants } from './osmApi'

// 搜索地点（统一接口）
export async function searchLocation(keyword, serviceType = 'amap') {
  if (serviceType === 'google') {
    return await searchGooglePlaces(keyword)
  } else if (serviceType === 'osm') {
    return await searchOSMLocation(keyword)
  } else {
    // 高德地图
    try {
      return await searchPOI(keyword)
    } catch (error) {
      console.warn('Fetch 请求失败，尝试 JSONP:', error)
      return await searchPOIJsonp(keyword)
    }
  }
}

// 搜索附近餐厅（统一接口）
export async function searchRestaurants({ location, radius, keywords = [] }, serviceType = 'amap') {
  if (serviceType === 'google') {
    return await fetchGoogleRestaurants({ location, radius, keywords })
  } else if (serviceType === 'osm') {
    return await fetchOSMRestaurants({ location, radius, keywords })
  } else {
    // 高德地图
    try {
      return await fetchRestaurants({ location, radius, keywords })
    } catch (error) {
      console.warn('Fetch 请求失败，尝试 JSONP:', error)
      return await fetchRestaurantsJsonp({ location, radius, keywords })
    }
  }
}
```

### src/services/amapApi.js

高德地图API调用：

```javascript
const AMAP_API_BASE_URL = import.meta.env.DEV
  ? '/api/amap/v3/place/around'
  : 'https://restapi.amap.com/v3/place/around'
const AMAP_API_KEY = import.meta.env.VITE_AMAP_API_KEY

export async function fetchRestaurants({ location, radius, keywords = [] }) {
  // 验证参数
  if (!location || !location.latitude || !location.longitude) {
    throw new Error('位置信息不完整')
  }

  // 构建请求参数
  const params = new URLSearchParams({
    key: AMAP_API_KEY,
    location: `${location.longitude},${location.latitude}`, // 注意：高德API要求经度在前
    types: '050000', // 餐饮服务分类码
    radius: radius.toString(),
    offset: '50',
    page: '1',
    output: 'json',
  })

  if (keywords.length > 0) {
    params.append('keywords', keywords.join('|'))
  }

  const response = await fetch(`${AMAP_API_BASE_URL}?${params.toString()}`)
  const data = await response.json()

  if (data.status !== '1') {
    throw new Error(`API 返回错误: ${data.info || data.infocode || '未知错误'}`)
  }

  return {
    pois: data.pois || [],
    count: parseInt(data.count || '0', 10),
  }
}

export function getRandomRestaurant(restaurants) {
  if (!restaurants || restaurants.length === 0) {
    return null
  }
  const randomIndex = Math.floor(Math.random() * restaurants.length)
  return restaurants[randomIndex]
}
```

### src/services/osmApi.js

OpenStreetMap API调用（使用Nominatim进行地理编码，Overpass进行POI查询）：

**Nominatim地理编码**:
```javascript
const NOMINATIM_BASE_URL = '/api/nominatim'
const OVERPASS_API_URL = '/api/overpass'

export async function searchOSMLocation(query) {
  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    addressdetails: '1',
    limit: '20',
    'accept-language': 'zh,en',
  })

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`)
  const data = await response.json()

  return data.map((item) => ({
    id: item.place_id.toString(),
    name: item.display_name.split(',')[0] || item.display_name,
    address: item.display_name,
    location: {
      longitude: parseFloat(item.lon),
      latitude: parseFloat(item.lat),
    },
    formatted_address: item.display_name,
  }))
}
```

**Overpass POI查询**:
```javascript
export async function fetchOSMRestaurants({ location, radius, keywords = [] }) {
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
      way["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream)$"](around:${radius},${location.latitude},${location.longitude});
    );
    out center limit 50;
  `.trim()

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query }),
  })

  const data = await response.json()
  // 格式化返回结果...
}
```

### api/nominatim.js

Vercel Serverless Function - Nominatim API代理（解决CORS问题）：

```javascript
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const queryParam = req.query.q || req.query.query
  if (!queryParam) {
    return res.status(400).json({ error: 'Query parameter "q" is required' })
  }

  const params = new URLSearchParams({
    q: queryParam,
    format: 'json',
    addressdetails: '1',
    limit: '20',
    'accept-language': 'zh,en',
  })

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WhatToEatToday/1.0; +https://what-to-eat-today.vercel.app)',
      'Accept': 'application/json',
    },
  })

  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Content-Type', 'application/json')

  return res.status(200).json(data)
}
```

### api/overpass.js

Vercel Serverless Function - Overpass API代理：

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const queryString = req.body?.query || req.body

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 70000)

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'Mozilla/5.0 (compatible; WhatToEatToday/1.0; +https://what-to-eat-today.vercel.app)',
    },
    body: queryString,
    signal: controller.signal,
  })

  clearTimeout(timeoutId)
  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Content-Type', 'application/json')

  return res.status(200).json(data)
}
```

### src/components/SelectButton.jsx

核心交互组件，处理餐厅搜索和随机选择逻辑：

主要功能：
1. 验证位置是否已设置
2. 调用`searchRestaurants`搜索附近餐厅
3. 如果找到餐厅，触发老虎机动画
4. 动画完成后随机选择一个餐厅
5. 显示结果弹窗
6. 支持"换一家"功能

关键状态：
- `isLoading`: API请求中
- `isSpinning`: 老虎机动画中
- `allRestaurants`: 所有搜索结果
- `selectedRestaurant`: 当前选中的餐厅
- `showModal`: 是否显示结果弹窗

### src/components/LocationSelector.jsx

位置选择组件，支持两种模式：

1. **自动定位模式**:
   - 使用浏览器Geolocation API
   - 获取用户当前位置

2. **手动搜索模式**:
   - 输入关键词
   - 调用`searchLocation`搜索地点
   - 显示搜索结果下拉列表
   - 选择后设置位置

### vercel.json

Vercel部署配置：

```json
{
  "functions": {
    "api/nominatim.js": {
      "maxDuration": 10
    },
    "api/overpass.js": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/nominatim",
      "destination": "/api/nominatim"
    },
    {
      "source": "/api/overpass",
      "destination": "/api/overpass"
    }
  ]
}
```

## 🎨 设计规范

### 颜色
- 背景色: `#F5F5F7` (apple-bg)
- 文字色: `#1D1D1F` (apple-text)
- 卡片背景: 纯白
- 卡片圆角: `24px` (apple)

### 样式特点
- Apple极简主义设计风格
- 流畅的动画效果（Framer Motion）
- 响应式设计（移动端优化）
- 触摸友好的交互元素（最小44px点击区域）

## 🔧 环境变量

项目使用以下环境变量（通过`.env.local`文件配置）：

- `VITE_AMAP_API_KEY`: 高德地图API Key（必需，用于高德地图服务）
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API Key（可选，用于Google Maps服务）

**注意**: 
- 环境变量必须以`VITE_`开头才能在Vite项目中使用
- `.env.local`文件不会被提交到Git（已在.gitignore中）
- OSM服务不需要API Key

## 🚀 开发与部署

### 本地开发
```bash
npm install        # 安装依赖
npm run dev       # 启动开发服务器
```

### 构建
```bash
npm run build     # 构建生产版本
npm run preview   # 预览构建结果
```

### 部署
项目主要部署在Vercel：
- 自动构建和部署（通过Git集成）
- Serverless Functions用于API代理
- 静态资源CDN加速

## 📊 数据流

1. **用户选择配置** → App.jsx状态更新
2. **点击"帮我选"** → SelectButton.jsx调用searchRestaurants
3. **统一服务接口** → locationService.js根据mapService路由
4. **API调用** → 对应地图服务API（amapApi/osmApi/googleMapsApi）
5. **结果处理** → 格式化返回的POI数据
6. **随机选择** → getRandomRestaurant从结果中随机选择
7. **显示结果** → ResultModal显示选中的餐厅信息

## 🔄 API调用流程

### 高德地图流程
```
用户输入 → LocationSelector → searchPOI (poiSearchApi.js)
                ↓
        高德地图搜索API
                ↓
用户点击"帮我选" → SelectButton → searchRestaurants → fetchRestaurants (amapApi.js)
                ↓
        高德地图周边搜索API (v3/place/around)
                ↓
        返回POI列表 → 随机选择 → 显示结果
```

### OpenStreetMap流程
```
用户输入 → LocationSelector → searchOSMLocation (osmApi.js)
                ↓
        /api/nominatim (Vercel Function) → Nominatim API
                ↓
用户点击"帮我选" → SelectButton → searchRestaurants → fetchOSMRestaurants (osmApi.js)
                ↓
        /api/overpass (Vercel Function) → Overpass API
                ↓
        返回餐厅数据 → 随机选择 → 显示结果
```

## 🐛 错误处理

- **ErrorBoundary**: 捕获React组件错误
- **try-catch**: API调用错误处理
- **用户友好提示**: 错误信息展示给用户
- **降级方案**: 高德地图Fetch失败时自动尝试JSONP

## 📝 注意事项

1. **CORS问题**: 
   - 开发环境使用Vite代理
   - 生产环境使用Vercel Serverless Functions作为代理
   - OSM的Nominatim和Overpass API都需要代理

2. **API限制**:
   - 高德地图API需要API Key
   - Nominatim API要求设置User-Agent
   - Overpass API查询有超时限制（60秒）

3. **数据格式差异**:
   - 不同地图服务返回的数据格式不同
   - 需要在各个API文件中进行格式统一处理

4. **移动端优化**:
   - 触摸友好的交互设计
   - 响应式布局
   - 性能优化

## 🎯 未来可能的改进

- 添加用户历史记录
- 支持收藏功能
- 添加更多食物类型
- 优化搜索算法
- 添加评价和点评功能
- 支持分享功能

---

**文档生成时间**: 2024年  
**项目状态**: 生产可用  
**维护状态**: 活跃开发中
