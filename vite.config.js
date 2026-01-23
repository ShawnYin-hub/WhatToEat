import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap/, ''),
        secure: true,
      },
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
            // Nominatim API 要求设置 User-Agent
            proxyReq.setHeader('User-Agent', 'WhatToEatToday/1.0')
            // 移除可能导致问题的头部
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
  // 确保环境变量在构建时可用
  define: {
    // 如果环境变量不存在，使用默认值（仅用于演示）
    'import.meta.env.VITE_AMAP_API_KEY': JSON.stringify(
      process.env.VITE_AMAP_API_KEY || '59db828f842e5c5666d401e86911ce1d'
    ),
    // Google Maps API Key（可选）
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ''
    ),
  },
})
