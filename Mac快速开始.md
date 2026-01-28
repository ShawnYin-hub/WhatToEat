# Mac 快速开始指南

## ⚡ 一键准备（推荐）

在终端中运行：

```bash
# 给脚本添加执行权限（只需运行一次）
chmod +x setup-ios-mac.sh

# 运行准备脚本
./setup-ios-mac.sh
```

脚本会自动完成：
- ✅ 检查环境（Node.js、Xcode、CocoaPods）
- ✅ 安装 npm 依赖
- ✅ 构建 Web 资源
- ✅ 同步到 iOS 项目
- ✅ 安装 CocoaPods 依赖

完成后，运行：

```bash
# 打开 Xcode
npm run cap:open:ios
```

---

## 📋 手动步骤（如果脚本失败）

### 1. 检查环境

```bash
# 检查 Node.js
node -v  # 应该显示 v18 或更高

# 检查 Xcode
xcodebuild -version

# 检查 CocoaPods
pod --version
```

如果缺少任何工具，参考 `Mac-Xcode完整操作指南.md` 安装。

### 2. 安装依赖

```bash
# 安装 npm 依赖
npm install

# 构建 Web 资源
npm run build

# 同步到 iOS
npm run cap:sync:ios

# 安装 CocoaPods 依赖
cd ios/App
pod install
cd ../..
```

### 3. 打开 Xcode

```bash
npm run cap:open:ios
```

---

## 🎯 在 Xcode 中的操作

### 第一步：配置签名

1. 点击左侧的 **"App"** 项目（蓝色图标）
2. 选择 **"App"** target
3. 选择 **"Signing & Capabilities"** 标签
4. 勾选 **"Automatically manage signing"**
5. 在 **"Team"** 中选择：
   - 如果有 Apple Developer 账号：选择你的团队
   - 如果没有：选择 **"Add an Account..."** 登录 Apple ID（免费，但应用有效期 7 天）

### 第二步：选择设备

在顶部工具栏的设备选择器中选择：
- **模拟器**：iPhone 15 Pro（推荐首次测试）
- **真机**：你的 iPhone（需要连接 USB）

### 第三步：运行

点击左上角的 **▶️ 运行按钮**（或按 `Cmd + R`）

---

## 📦 打包应用

### 1. 确保已构建最新版本

```bash
npm run build
npm run cap:sync:ios
```

### 2. 在 Xcode 中打包

1. 选择设备为 **"Any iOS Device"**（不是模拟器）
2. 菜单：**Product → Archive**
3. 等待构建完成
4. 在 Organizer 窗口中点击 **"Distribute App"**
5. 选择分发方式：
   - **App Store Connect**：用于上架
   - **Ad Hoc**：用于测试设备
   - **Development**：开发版本

---

## ❓ 遇到问题？

查看详细指南：`Mac-Xcode完整操作指南.md`

常见问题：
- **签名错误**：确保已登录 Apple ID 并选择了 Team
- **构建失败**：运行 `cd ios/App && pod install`
- **真机无法运行**：在 iPhone 设置中信任开发者证书

---

## 📚 相关文档

- `Mac-Xcode完整操作指南.md` - 完整详细的操作步骤
- `iPhone预览和上架指南.md` - 上架 App Store 指南
- `项目分析报告.md` - 项目架构说明
