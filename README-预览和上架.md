# 📱 预览和上架 - 完整操作指南

## ✅ 已完成的配置

我已经为你完成了以下配置：

1. ✅ **Vite 开发服务器** - 已配置支持局域网访问
2. ✅ **Capacitor 配置** - 已更新支持开发模式
3. ✅ **npm 脚本** - 已添加预览相关命令
4. ✅ **iOS 权限配置** - 已添加位置服务权限说明
5. ✅ **预览脚本** - 已创建自动配置工具

---

## 🚀 立即开始：在 iPhone 上预览

### 最简单的方法（推荐）

1. **打开 PowerShell，进入项目目录：**
   ```powershell
   cd D:\APP\what-to-eat-today
   ```

2. **启动开发服务器：**
   ```powershell
   npm run dev:network
   ```

3. **获取你的 IP 地址：**
   ```powershell
   ipconfig
   ```
   找到 "IPv4 地址"，例如：`192.168.1.100`

4. **在 iPhone Safari 中输入：**
   ```
   http://你的IP:5173
   ```
   例如：`http://192.168.1.100:5173`

5. **（可选）添加到主屏幕：**
   - Safari → 分享按钮 → "添加到主屏幕"

**详细步骤请查看：`快速开始-预览应用.md`**

---

## 📋 完整指南文档

我已经为你创建了以下文档：

### 1. **快速开始-预览应用.md**
   - 最简单的预览方法
   - 5 分钟快速上手
   - 常见问题解决

### 2. **iPhone预览和上架指南.md**
   - 详细的预览方案（Web 和真机）
   - App Store 上架完整流程
   - 所有必需步骤和检查清单

### 3. **隐私政策模板.md**
   - App Store 要求的隐私政策模板
   - 根据你的应用功能修改

### 4. **项目分析报告.md**
   - 项目架构分析
   - 技术栈说明
   - 云构建方案

---

## 🎯 下一步操作清单

### 立即可以做的（今天）：

- [ ] **预览应用**
  1. 运行 `npm run dev:network`
  2. 在 iPhone Safari 中访问应用
  3. 测试所有功能，确认体验良好

- [ ] **注册 Apple Developer 账号**
  - 访问：https://developer.apple.com/programs/
  - 费用：$99/年
  - ⚠️ **这是最耗时的步骤，建议立即开始**

### 本周完成：

- [ ] **准备应用素材**
  - 应用截图（至少 3 张，不同尺寸）
  - 应用图标（1024x1024 PNG）
  - 应用描述和关键词

- [ ] **准备隐私政策**
  - 使用 `隐私政策模板.md`
  - 托管到 GitHub Pages 或 Vercel
  - 获取 URL 地址

### 准备上架时：

- [ ] **选择构建方案**
  - 方案 A：借用/使用 Mac + Xcode
  - 方案 B：GitHub Actions 云构建
  - 方案 C：Codemagic 等第三方服务

- [ ] **构建和提交**
  - 构建 iOS 应用
  - 上传到 App Store Connect
  - 提交审核

---

## 📝 新增的 npm 命令

```bash
# 开发预览
npm run dev:network          # 启动开发服务器（支持局域网访问）

# 构建
npm run build                 # 构建 Web 资源
npm run ios:build            # 构建并同步到 iOS
npm run android:build        # 构建并同步到 Android

# 预览设置
npm run ios:preview:setup    # 自动配置 iOS 预览（检测 IP 并更新配置）

# Capacitor 命令
npm run cap:sync             # 同步所有平台
npm run cap:sync:ios         # 仅同步 iOS
npm run cap:open:ios        # 在 Xcode 中打开（需要 Mac）
```

---

## 🔍 配置文件说明

### 已修改的文件：

1. **`vite.config.js`**
   - 添加了 `host: '0.0.0.0'` 支持局域网访问
   - 配置了 HMR（热更新）端口

2. **`capacitor.config.ts`**
   - 更新了开发服务器配置说明
   - 添加了 iOS scheme 配置

3. **`package.json`**
   - 添加了 `dev:network` 命令
   - 添加了 `ios:build` 和 `ios:preview:setup` 命令

4. **`ios/App/App/Info.plist`**
   - 添加了位置服务权限说明（App Store 要求）
   - 配置了 App Transport Security

### 新创建的文件：

1. **`scripts/setup-ios-preview.js`**
   - 自动检测 IP 地址
   - 自动更新 Capacitor 配置

2. **`快速开始-预览应用.md`**
   - 快速预览指南

3. **`iPhone预览和上架指南.md`**
   - 完整的上架流程

4. **`隐私政策模板.md`**
   - 隐私政策模板

---

## ⚠️ 重要提示

### 关于预览：

1. **Web 预览 vs 真机预览**
   - Web 预览（Safari）：可以测试大部分功能，但某些原生功能可能受限
   - 真机预览（通过 Xcode）：可以测试所有功能，但需要 Mac

2. **位置服务**
   - Web 版本的位置服务可能不如原生 App 精确
   - 这是正常的，完整功能需要在真机 App 中测试

### 关于上架：

1. **Apple Developer 账号**
   - 注册需要 1-2 个工作日
   - 建议立即开始注册

2. **构建环境**
   - iOS 应用必须在 macOS 上构建
   - 如果没有 Mac，必须使用云构建服务

3. **审核时间**
   - 通常 1-3 个工作日
   - 首次提交可能需要更长时间

---

## 🆘 遇到问题？

### 预览问题：
- 查看 `快速开始-预览应用.md` 中的"常见问题"部分
- 检查防火墙设置
- 确认 iPhone 和电脑在同一 Wi-Fi

### 上架问题：
- 查看 `iPhone预览和上架指南.md`
- 参考 Apple 官方文档
- 检查 App Store Connect 中的错误提示

---

## 🎉 开始吧！

**第一步：立即预览应用**
```bash
npm run dev:network
```

然后在 iPhone Safari 中访问显示的 Network 地址即可！

**第二步：查看详细指南**
- 预览：`快速开始-预览应用.md`
- 上架：`iPhone预览和上架指南.md`

**祝你应用顺利上架！** 🚀
