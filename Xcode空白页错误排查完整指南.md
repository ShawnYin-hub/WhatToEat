# Xcode 空白页错误排查完整指南

## 问题现象
- ✅ 浏览器（http://localhost:5173）正常显示
- ❌ iOS 应用（Xcode 运行）显示空白页

这说明代码没问题，问题在 iOS 项目的同步或配置。

---

## 方法 1：查看 Xcode 控制台（最基础）

### 步骤：

1. **在 Xcode 中运行应用**
   - 点击运行按钮 ▶
   - 等待应用安装到设备

2. **查看底部控制台**
   - 在 Xcode 底部找到 **"Debug Area"**（如果没有显示，按 `Cmd + Shift + Y`）
   - 查看控制台输出

3. **查找错误信息**
   - 红色文字 = 错误
   - 黄色文字 = 警告
   - 查找包含以下关键词的错误：
     - `Failed to load`
     - `404`
     - `CORS`
     - `Error`
     - `Exception`
     - `undefined`

### 常见错误示例：

```
❌ Failed to load resource: the server responded with a status of 404
❌ TypeError: Cannot read property 'xxx' of undefined
❌ CORS policy: No 'Access-Control-Allow-Origin' header
```

**记录下完整的错误信息！**

---

## 方法 2：使用 Safari Web Inspector（最有效）

这是调试 iOS WebView 应用最强大的方法。

### 步骤：

#### 2.1 在 Mac 上启用 Safari 开发者工具

1. 打开 Safari
2. 菜单：`Safari → 偏好设置` (或 `Safari → Settings`)
3. 点击 **"高级"** (Advanced) 标签
4. 勾选 **"在菜单栏中显示"开发"菜单"** (Show Develop menu in menu bar)
5. 关闭设置窗口

#### 2.2 在 iPhone 上启用 Web Inspector

1. 在 iPhone 上：`设置 → Safari → 高级`
2. 开启 **"Web 检查器"** (Web Inspector)

#### 2.3 连接设备并调试

1. **用 USB 线连接 iPhone 到 Mac**
2. **在 iPhone 上运行应用**（通过 Xcode 运行）
3. **在 Mac Safari 中：**
   - 菜单：`开发 → [你的 iPhone 名称] → [你的应用名称]`
   - 例如：`开发 → iPhone 15 Pro → 今天吃什么`

4. **Safari 会打开开发者工具窗口**

#### 2.4 查看错误信息

在开发者工具中：

**A. Console 标签页（最重要）**
- 查看所有 JavaScript 错误
- 红色文字 = 错误
- 黄色文字 = 警告
- 点击错误可以查看详细堆栈信息

**B. Network 标签页**
- 查看所有网络请求
- 红色请求 = 失败（404, 500 等）
- 检查以下资源是否加载成功：
  - `index.html`
  - `/assets/index-xxx.js`（JavaScript 文件）
  - `/assets/index-xxx.css`（CSS 文件）
  - Supabase API 请求

**C. Elements 标签页**
- 查看 HTML DOM 结构
- 检查 `<div id="root">` 是否有内容
- 如果 `#root` 是空的，说明 React 没有渲染

#### 2.5 常见问题诊断

**问题 1：JavaScript 文件 404**
- 在 Network 标签页中，看到 `/assets/index-xxx.js` 返回 404
- **原因：** 文件没有正确同步到 iOS 项目
- **解决：** 重新执行 `npx cap sync ios`

**问题 2：JavaScript 执行错误**
- 在 Console 标签页中看到红色错误
- **原因：** 代码错误或环境变量问题
- **解决：** 根据错误信息修复代码

**问题 3：CORS 错误**
- 在 Console 中看到 CORS 相关错误
- **原因：** iOS 应用不应该有 CORS 问题，可能是配置错误
- **解决：** 检查 Supabase 配置

**问题 4：空白页面但无错误**
- Console 和 Network 都没有错误
- **原因：** React 没有渲染或 CSS 问题
- **解决：** 检查 Elements 标签页，看 `#root` 是否有内容

---

## 方法 3：检查文件是否正确同步

### 步骤：

在 Mac 终端中执行：

```bash
cd ~/Desktop/WhatToEat  # 或你的实际路径

# 1. 检查 dist 目录中的文件
ls -la dist/
ls -la dist/assets/

# 2. 检查 iOS 项目中的文件
ls -la ios/App/App/public/
ls -la ios/App/App/public/assets/

# 3. 检查 index.html 中的文件引用
cat ios/App/App/public/index.html

# 4. 对比文件名是否匹配
# dist/assets/ 中的文件名应该和 index.html 中引用的文件名一致
```

### 验证方法：

```bash
# 获取 index.html 中引用的 JS 文件名
grep "index-" ios/App/App/public/index.html | grep "\.js"

# 检查该文件是否存在
ls ios/App/App/public/assets/ | grep "index-.*\.js"
```

**如果文件名不匹配，说明同步有问题！**

---

## 方法 4：检查网络请求（Network 标签页）

### 步骤：

1. 在 Safari Web Inspector 中打开 **Network** 标签页
2. 刷新应用（在 iPhone 上重新打开应用）
3. 查看所有请求的状态

### 需要检查的请求：

#### ✅ 应该成功的请求：
- `index.html` → 状态码 200
- `/assets/index-xxx.js` → 状态码 200
- `/assets/index-xxx.css` → 状态码 200
- `/assets/manifest-xxx.json` → 状态码 200

#### ❌ 可能失败的请求：
- 任何 404 错误 → 文件不存在
- 任何 500 错误 → 服务器错误
- CORS 错误 → 配置问题

### 诊断：

**如果看到 404：**
- 记录下失败的 URL
- 检查该文件是否存在于 `ios/App/App/public/` 目录中
- 如果不存在，重新执行 `npx cap sync ios`

**如果看到 CORS 错误：**
- iOS 应用不应该有 CORS 问题
- 检查是否是 Supabase 请求
- 检查 `src/services/supabase.js` 中的配置

---

## 方法 5：检查 JavaScript 执行

### 步骤：

1. 在 Safari Web Inspector 的 **Console** 标签页中
2. 手动执行以下命令：

```javascript
// 检查 React 是否加载
console.log(window.React)

// 检查应用是否挂载
console.log(document.getElementById('root'))

// 检查是否有全局错误
window.onerror = function(msg, url, line) {
  console.error('Global error:', msg, url, line)
}
```

### 常见问题：

**问题：`window.React` 是 undefined**
- **原因：** React 没有加载
- **解决：** 检查 JS 文件是否正确加载

**问题：`document.getElementById('root')` 是 null**
- **原因：** HTML 结构有问题
- **解决：** 检查 `index.html`

---

## 方法 6：检查 Capacitor 配置

### 步骤：

在 Mac 终端中：

```bash
cd ~/Desktop/WhatToEat

# 检查 Capacitor 配置
cat capacitor.config.ts

# 检查 iOS 项目中的配置
cat ios/App/App/capacitor.config.json
```

### 需要检查的配置：

1. **webDir** 应该是 `"dist"`
2. **appId** 应该是 `"com.whattoeat.today"`
3. **server** 配置（如果有）不应该指向开发服务器

---

## 方法 7：清理并重新构建

### 完整清理步骤：

```bash
cd ~/Desktop/WhatToEat

# 1. 清理 dist
rm -rf dist

# 2. 清理 iOS 项目中的旧文件
rm -rf ios/App/App/public/assets
rm -rf ios/App/App/public/locales

# 3. 重新构建
npm run build

# 4. 同步到 iOS
npx cap sync ios

# 5. 在 Xcode 中清理
# Product → Clean Build Folder (Shift + Cmd + K)
```

---

## 快速诊断流程

### 第一步：查看 Xcode 控制台
- 如果有明显错误，直接修复
- 如果没有错误，继续下一步

### 第二步：使用 Safari Web Inspector
- 打开 Console 标签页，查看 JavaScript 错误
- 打开 Network 标签页，查看资源加载情况

### 第三步：检查文件同步
- 验证文件是否存在
- 验证文件名是否匹配

### 第四步：根据错误信息修复
- 文件 404 → 重新同步
- JavaScript 错误 → 修复代码
- CORS 错误 → 检查配置

---

## 常见错误和解决方案

### 错误 1：`Failed to load resource: 404`

**原因：** 文件没有同步到 iOS 项目

**解决：**
```bash
npm run build
npx cap sync ios
```

### 错误 2：`TypeError: Cannot read property 'xxx' of undefined`

**原因：** JavaScript 代码错误

**解决：** 查看错误堆栈，找到具体文件和行号，修复代码

### 错误 3：空白页但无错误

**原因：** React 没有渲染或 CSS 隐藏了内容

**解决：**
1. 在 Elements 标签页检查 `#root` 是否有内容
2. 检查 CSS 是否有 `display: none` 或 `opacity: 0`

### 错误 4：CORS 错误

**原因：** iOS 应用不应该有 CORS 问题，可能是配置错误

**解决：** 检查 `src/services/supabase.js`，确保在 iOS 中不使用代理

---

## 需要提供的信息

如果以上方法都无法解决，请提供：

1. **Xcode 控制台的完整输出**（复制所有文本）
2. **Safari Web Inspector Console 的错误信息**（截图或复制）
3. **Network 标签页中失败的请求**（截图）
4. **文件列表**：
   ```bash
   ls -la ios/App/App/public/assets/
   cat ios/App/App/public/index.html
   ```

---

## 推荐操作顺序

1. ✅ **先查看 Xcode 控制台**（最快）
2. ✅ **使用 Safari Web Inspector**（最详细）
3. ✅ **检查文件同步**（验证基础问题）
4. ✅ **根据错误信息修复**

按照这个顺序，99% 的问题都能找到原因！
