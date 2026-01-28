import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：完全禁用 host 检查（用于内网穿透工具）
    {
      name: 'disable-host-check',
      configureServer(server) {
        // 在服务器配置后，移除 host 检查中间件
        const originalUse = server.middlewares.use.bind(server.middlewares)
        server.middlewares.use = function(...args) {
          // 如果是 host 检查相关的中间件，跳过
          const middleware = args[0]
          if (middleware && typeof middleware === 'function') {
            const middlewareStr = middleware.toString()
            if (middlewareStr.includes('isHostAllowed') || 
                middlewareStr.includes('viteHostCheckMiddleware') ||
                middlewareStr.includes('Blocked request')) {
              return server.middlewares
            }
          }
          return originalUse(...args)
        }
        
        // 直接移除已存在的 host 检查中间件
        if (server.middlewares.stack) {
          server.middlewares.stack = server.middlewares.stack.filter((layer) => {
            if (layer && layer.handle) {
              const handleStr = layer.handle.toString()
              return !(
                handleStr.includes('isHostAllowed') ||
                handleStr.includes('viteHostCheckMiddleware') ||
                handleStr.includes('Blocked request')
              )
            }
            return true
          })
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    strictPort: false,
    // 不设置 allowedHosts，通过插件完全禁用检查
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap/, ''),
        secure: true,
        // 确保代理在 Cloudflare Tunnel 环境下正常工作
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 移除可能导致问题的头部
            proxyReq.removeHeader('referer')
            proxyReq.removeHeader('origin')
            // 确保正确的 Host 头
            proxyReq.setHeader('Host', 'restapi.amap.com')
          })
          proxy.on('error', (err, req, res) => {
            console.error('代理错误:', err)
          })
        },
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
      // DeepSeek API 代理（解决 CORS 问题）
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 确保正确的 Content-Type
            if (req.method === 'POST') {
              proxyReq.setHeader('Content-Type', 'application/json')
            }
          })
        },
      },
    },
  },
  // 确保环境变量在构建时可用
  define: {
    // 如果环境变量不存在，使用默认值（仅用于演示）
    'import.meta.env.VITE_AMAP_KEY': JSON.stringify(
      process.env.VITE_AMAP_KEY || process.env.VITE_AMAP_API_KEY || '59db828f842e5c5666d401e86911ce1d'
    ),
    // Google Maps API Key（可选）
    'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(
      process.env.VITE_GOOGLE_MAPS_API_KEY || ''
    ),
  },
})
