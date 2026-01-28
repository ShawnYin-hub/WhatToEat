import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './i18n'
import './index.css'

// 调试：确认脚本已加载
console.log('🚀 main.jsx: 脚本已加载')
console.log('🚀 main.jsx: React 版本', React.version)

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ 未处理的 Promise 拒绝:', event.reason)
  // 阻止默认的错误输出，但我们仍然记录它
  // event.preventDefault()
})

// 捕获全局错误
window.addEventListener('error', (event) => {
  console.error('❌ 全局错误:', event.error)
})

// 检查 root 元素是否存在
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ 错误: 找不到 #root 元素')
} else {
  console.log('✅ main.jsx: 找到 #root 元素')
  
  // 创建 React 根
  const root = ReactDOM.createRoot(rootElement)
  console.log('✅ main.jsx: React 根已创建')
  
  // 渲染应用
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('✅ main.jsx: 应用已渲染')
}
