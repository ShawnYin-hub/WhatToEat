# Mac + Xcode 完整操作指南

## 📋 前置检查清单

在开始之前，请确保你的 Mac 已安装以下工具：

### ✅ 必需工具检查

1. **Xcode**
   ```bash
   # 检查 Xcode 是否已安装
   xcode-select -p
   
   # 如果未安装，从 App Store 安装 Xcode（免费，但体积较大，约 10GB+）
   # 安装后运行：
   sudo xcodebuild -license accept
   ```

2. **Xcode Command Line Tools**
   ```bash
   # 安装命令行工具
   xcode-select --install
   ```

3. **Node.js** (推荐 v18+)
   ```bash
   # 检查 Node.js 版本
   node -v
   
   # 如果未安装，使用 Homebrew 安装：
   brew install node
   # 或从官网下载：https://nodejs.org/
   ```

4. **CocoaPods** (iOS 依赖管理)
   ```bash
   # 检查是否已安装
   pod --version
   
   # 如果未安装，安装 CocoaPods：
   sudo gem install cocoapods
   ```

5. **npm 或 yarn**
   ```bash
   # 检查 npm
   npm -v
   ```

---

## 🚀 第一步：准备项目

### 1.1 将项目传输到 Mac

如果你是从 Windows 传输项目到 Mac，可以使用以下方式：

- **方式 A：使用 Git**（推荐）
  ```bash
  # 在 Mac 上克隆项目
  git clone <你的仓库地址>
  cd what-to-eat-today
  ```

- **方式 B：使用 U盘/移动硬盘**
  - 将整个项目文件夹复制到 Mac

- **方式 C：使用云盘**
  - 上传到 iCloud、Dropbox 等，然后在 Mac 下载

### 1.2 安装项目依赖

```bash
# 进入项目目录
cd what-to-eat-today

# 安装 Node.js 依赖
npm install
```

---

## 🔨 第二步：构建 Web 资源

在同步到 iOS 之前，需要先构建 Web 资源：

```bash
# 构建生产版本（用于打包）
npm run build

# 或者如果你想在开发模式下预览，可以跳过这一步，直接进入下一步
```

---

## 📱 第三步：同步到 iOS 项目

```bash
# 同步 Web 资源到 iOS 项目
npm run cap:sync:ios

# 或者使用完整命令：
npm run build && npx cap sync ios
```

这一步会：
- 将 `dist/` 目录中的 Web 资源复制到 iOS 项目
- 更新 iOS 项目的配置文件
- 确保所有依赖都已同步

---

## 🍎 第四步：安装 iOS 依赖（CocoaPods）

```bash
# 进入 iOS 目录
cd ios/App

# 安装 CocoaPods 依赖
pod install

# 如果遇到权限问题，使用：
sudo pod install
```

**注意：** 如果这是第一次运行 `pod install`，可能需要等待较长时间下载依赖。

---

## 🎯 第五步：在 Xcode 中打开项目

### 5.1 打开项目

```bash
# 在项目根目录运行
npm run cap:open:ios

# 或者手动打开：
open ios/App/App.xcworkspace
# ⚠️ 注意：必须打开 .xcworkspace 文件，不是 .xcodeproj
```

### 5.2 Xcode 界面说明

打开后，你会看到：
- **左侧导航栏**：项目文件结构
- **中间编辑区**：代码编辑器
- **右侧属性栏**：文件属性
- **顶部工具栏**：运行/停止按钮、设备选择器

---

## ⚙️ 第六步：配置项目设置

### 6.1 选择项目文件

1. 在左侧导航栏，点击最顶部的 **"App"** 项目（蓝色图标）
2. 在中间区域，选择 **"App"** target（不是项目，是 target）

### 6.2 配置签名（Signing & Capabilities）

1. 选择 **"Signing & Capabilities"** 标签页
2. 勾选 **"Automatically manage signing"**
3. 在 **"Team"** 下拉菜单中选择：
   - **如果有 Apple Developer 账号**：选择你的团队
   - **如果没有账号**：选择 "Add an Account..." 登录，或选择 "Personal Team"（免费，但有限制）

**重要说明：**
- **Personal Team（免费）**：
  - ✅ 可以在真机上测试（需要连接 iPhone）
  - ✅ 可以构建应用
  - ❌ 不能上架 App Store
  - ⚠️ 应用有效期 7 天，之后需要重新安装
  - ⚠️ 需要 Apple ID 登录

- **Apple Developer Program（$99/年）**：
  - ✅ 可以上架 App Store
  - ✅ 应用永久有效
  - ✅ 可以使用 TestFlight 测试
  - ✅ 可以使用推送通知等高级功能

### 6.3 检查 Bundle Identifier

确保 Bundle Identifier 为：`com.whattoeat.today`

如果显示红色错误，点击它，Xcode 会自动修复。

### 6.4 检查版本号

在 **"General"** 标签页中：
- **Version**：应用版本号（如：1.0.0）
- **Build**：构建号（如：1，每次构建递增）

---

## 🎮 第七步：预览和测试

### 7.1 在模拟器中运行（最简单）

1. **选择模拟器**
   - 在 Xcode 顶部工具栏，点击设备选择器（显示 "Any iOS Device" 的地方）
   - 选择一个 iPhone 模拟器（如：iPhone 15 Pro）

2. **运行应用**
   - 点击左上角的 **▶️ 运行按钮**（或按 `Cmd + R`）
   - 等待编译完成（首次编译可能需要几分钟）

3. **查看结果**
   - 模拟器会自动启动
   - 应用会自动安装并运行

### 7.2 在真机上运行（需要 iPhone）

1. **连接 iPhone**
   - 使用 USB 线连接 iPhone 到 Mac
   - 在 iPhone 上点击"信任此电脑"

2. **在 iPhone 上启用开发者模式**
   - 设置 → 隐私与安全性 → 开发者模式 → 开启
   - 重启 iPhone

3. **选择设备**
   - 在 Xcode 设备选择器中选择你的 iPhone

4. **运行应用**
   - 点击运行按钮
   - 首次运行时，需要在 iPhone 上：
     - 设置 → 通用 → VPN与设备管理
     - 信任你的开发者证书

5. **查看结果**
   - 应用会安装到 iPhone 并自动运行

---

## 📦 第八步：打包应用

### 8.1 准备打包

在打包之前，确保：

1. **构建生产版本**
   ```bash
   # 在项目根目录
   npm run build
   npm run cap:sync:ios
   ```

2. **在 Xcode 中检查配置**
   - 确保选择了正确的 Team
   - 确保 Bundle Identifier 正确
   - 确保版本号和构建号已更新

### 8.2 创建 Archive（归档）

1. **选择目标设备**
   - 在设备选择器中选择 **"Any iOS Device"**（不是模拟器）

2. **创建 Archive**
   - 菜单栏：**Product → Archive**
   - 等待构建完成（可能需要几分钟）

3. **Organizer 窗口**
   - Archive 完成后，会自动打开 **Organizer** 窗口
   - 如果没有自动打开：**Window → Organizer**

### 8.3 导出应用

在 Organizer 窗口中：

1. **选择 Archive**
   - 选择刚创建的 Archive（最新的一个）

2. **点击 "Distribute App"**

3. **选择分发方式**：

   **选项 A：App Store Connect（用于上架）**
   - 选择 "App Store Connect"
   - 点击 "Next"
   - 选择 "Upload"（上传到 App Store Connect）
   - 点击 "Next"
   - 选择分发选项（通常保持默认）
   - 点击 "Next"
   - 检查信息，点击 "Upload"
   - 等待上传完成

   **选项 B：Ad Hoc（用于测试设备）**
   - 选择 "Ad Hoc"
   - 适用于：分发给特定测试设备（需要注册设备 UDID）
   - 会生成 .ipa 文件

   **选项 C：Development（开发版本）**
   - 选择 "Development"
   - 适用于：开发测试
   - 会生成 .ipa 文件

   **选项 D：Enterprise（企业版，需要企业账号）**
   - 需要 Apple Enterprise Program 账号（$299/年）

4. **保存文件**
   - 如果选择了 Ad Hoc 或 Development，会提示保存 .ipa 文件
   - 选择保存位置

### 8.4 安装到设备（如果是 .ipa 文件）

如果导出了 .ipa 文件：

**方式 A：使用 Xcode**
1. 连接 iPhone 到 Mac
2. 在 Xcode 中：**Window → Devices and Simulators**
3. 选择你的 iPhone
4. 点击 "+" 添加 .ipa 文件
5. 应用会安装到 iPhone

**方式 B：使用 Apple Configurator 2**
1. 从 App Store 安装 Apple Configurator 2
2. 连接 iPhone
3. 拖拽 .ipa 文件到设备

**方式 C：使用第三方工具**
- 3uTools、爱思助手等（Windows 上也可用）

---

## 🔍 常见问题排查

### 问题 1：Xcode 提示 "No signing certificate found"

**解决方案：**
1. 确保已登录 Apple ID（Xcode → Preferences → Accounts）
2. 确保选择了正确的 Team
3. 如果使用 Personal Team，确保已启用"Automatically manage signing"

### 问题 2：构建失败，提示 "Module not found"

**解决方案：**
```bash
# 重新安装依赖
cd ios/App
pod deintegrate
pod install
```

### 问题 3：真机运行时提示 "Untrusted Developer"

**解决方案：**
1. iPhone：设置 → 通用 → VPN与设备管理
2. 找到你的开发者证书
3. 点击"信任"

### 问题 4：Archive 时提示 "No devices selected"

**解决方案：**
- 确保在设备选择器中选择 "Any iOS Device"，而不是模拟器

### 问题 5：pod install 失败

**解决方案：**
```bash
# 更新 CocoaPods
sudo gem install cocoapods

# 更新 repo
pod repo update

# 清理并重新安装
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

### 问题 6：应用在真机上无法运行（Personal Team）

**解决方案：**
- Personal Team 的应用有效期只有 7 天
- 7 天后需要重新安装
- 如果要长期使用，需要注册 Apple Developer Program

---

## 📝 快速命令参考

```bash
# 1. 安装依赖
npm install

# 2. 构建 Web 资源
npm run build

# 3. 同步到 iOS
npm run cap:sync:ios

# 4. 安装 CocoaPods 依赖
cd ios/App && pod install && cd ../..

# 5. 打开 Xcode
npm run cap:open:ios

# 或者一行命令完成所有步骤：
npm install && npm run build && npm run cap:sync:ios && cd ios/App && pod install && cd ../.. && npm run cap:open:ios
```

---

## ✅ 完整操作流程总结

1. ✅ **环境检查**：确保 Xcode、Node.js、CocoaPods 已安装
2. ✅ **安装依赖**：`npm install`
3. ✅ **构建资源**：`npm run build`
4. ✅ **同步 iOS**：`npm run cap:sync:ios`
5. ✅ **安装 Pods**：`cd ios/App && pod install`
6. ✅ **打开 Xcode**：`npm run cap:open:ios`
7. ✅ **配置签名**：选择 Team，启用自动签名
8. ✅ **运行预览**：选择设备，点击运行
9. ✅ **打包**：Product → Archive → Distribute App

---

## 🎯 下一步

- **测试应用**：在模拟器和真机上充分测试
- **准备上架材料**：截图、描述、隐私政策等
- **提交审核**：在 App Store Connect 中提交应用

**祝你打包顺利！🎉**
