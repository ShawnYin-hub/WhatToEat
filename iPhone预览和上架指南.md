# iPhone 预览和 App Store 上架完整指南

## 📱 第一部分：在 iPhone 上预览应用

由于你目前只有 Windows 环境，我们提供两种预览方案：

---

### 🎯 方案 A：Web 版本预览（最简单，推荐先试这个）

**优点：** 无需 Mac，立即可以预览  
**缺点：** 无法测试原生功能（如位置服务、推送通知等）

#### 步骤：

1. **启动开发服务器**
   ```bash
   npm run dev:network
   ```
   服务器会在 `http://0.0.0.0:5173` 启动

2. **获取你的电脑 IP 地址**
   - 打开 PowerShell，运行：
   ```powershell
   ipconfig
   ```
   - 找到 "IPv4 地址"，例如：`192.168.1.100`

3. **在 iPhone 上访问**
   - 确保 iPhone 和电脑连接到**同一个 Wi-Fi 网络**
   - 在 iPhone Safari 浏览器中输入：
   ```
   http://你的IP地址:5173
   例如：http://192.168.1.100:5173
   ```

4. **添加到主屏幕（模拟 App 体验）**
   - 在 Safari 中打开应用后
   - 点击底部的分享按钮
   - 选择"添加到主屏幕"
   - 这样可以在主屏幕上像 App 一样打开

---

### 🎯 方案 B：真机预览（需要 Mac 或云构建）

**优点：** 可以测试所有原生功能  
**缺点：** 需要 Mac 环境或使用云构建服务

#### 如果你有 Mac 或可以借用 Mac：

1. **配置开发服务器连接**
   ```bash
   npm run ios:preview:setup
   ```
   这会自动检测你的 IP 并更新 Capacitor 配置

2. **手动配置（如果需要）**
   - 打开 `capacitor.config.ts`
   - 找到 `server` 配置，取消注释并修改：
   ```typescript
   server: {
     url: 'http://你的IP地址:5173',  // 例如: http://192.168.1.100:5173
     cleartext: true
   },
   ```

3. **启动开发服务器**
   ```bash
   npm run dev:network
   ```

4. **在 Mac 上构建并安装到 iPhone**
   ```bash
   # 同步代码到 iOS 项目
   npm run ios:build
   
   # 打开 Xcode
   npm run cap:open:ios
   
   # 在 Xcode 中：
   # 1. 连接 iPhone 到 Mac
   # 2. 选择你的 iPhone 作为运行目标
   # 3. 点击运行按钮（或按 Cmd+R）
   ```

#### 如果你没有 Mac（使用云构建）：

参考 `项目分析报告.md` 中的云构建方案（GitHub Actions 或 Codemagic）

---

## 🚀 第二部分：准备 App Store 上架

### 前置准备清单

#### 1. **Apple Developer 账号** ⚠️ 必需
- 访问：https://developer.apple.com/programs/
- 注册费用：$99/年（约 ¥688/年）
- 注册时间：通常 1-2 个工作日
- **立即开始注册，这是最耗时的步骤**

#### 2. **应用信息准备**

##### 应用名称和描述
- **应用名称**：今天吃什么（已在 `Info.plist` 中配置）
- **副标题**：解决选择困难症
- **关键词**：餐厅, 美食, 推荐, 选择困难, 随机, 附近
- **描述**：准备一段详细的应用描述（至少 100 字）

##### 应用截图（必需）
需要准备以下尺寸的截图：

**iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)**
- 尺寸：1290 x 2796 像素
- 数量：至少 3 张，最多 10 张

**iPhone 6.5" (iPhone 11 Pro Max, XS Max)**
- 尺寸：1242 x 2688 像素
- 数量：至少 3 张，最多 10 张

**iPhone 5.5" (iPhone 8 Plus)**
- 尺寸：1242 x 2208 像素
- 数量：至少 3 张，最多 10 张

**iPad Pro 12.9"（如果支持 iPad）**
- 尺寸：2048 x 2732 像素
- 数量：至少 3 张

**截图工具推荐：**
- 在 iPhone 上运行应用后，使用 Xcode 的截图功能
- 或使用在线工具生成模拟截图

##### 应用图标
- **尺寸**：1024 x 1024 像素
- **格式**：PNG（无透明度）
- **位置**：`ios/App/App/Assets.xcassets/AppIcon.appiconset/`

##### 隐私政策 URL ⚠️ 必需
- App Store 要求所有应用必须有隐私政策
- 可以托管在 GitHub Pages、Vercel 或其他免费平台
- 示例内容模板已创建在 `隐私政策模板.md`

#### 3. **版本号配置**

检查并更新以下文件中的版本号：

**`ios/App/App/Info.plist`**
- `CFBundleShortVersionString`：应用版本（如：1.0.0）
- `CFBundleVersion`：构建号（如：1）

**`capacitor.config.ts`**
- 确认 `appId` 为：`com.whattoeat.today`

#### 4. **App Store Connect 配置**

1. **登录 App Store Connect**
   - https://appstoreconnect.apple.com
   - 使用 Apple Developer 账号登录

2. **创建新应用**
   - 点击"我的 App"
   - 点击"+"创建新 App
   - 填写信息：
     - **平台**：iOS
     - **名称**：今天吃什么
     - **主要语言**：简体中文
     - **Bundle ID**：选择或创建 `com.whattoeat.today`
     - **SKU**：whattoeattoday-001（唯一标识符）

3. **填写应用信息**
   - 上传应用截图
   - 填写描述、关键词
   - 设置分类：美食、生活
   - 设置年龄分级
   - 添加隐私政策 URL

---

## 📦 第三部分：构建和提交应用

### 构建 iOS 应用（需要 Mac 或云构建）

#### 选项 1：使用 Mac（如果有）

1. **构建生产版本**
   ```bash
   # 构建 Web 资源
   npm run build
   
   # 同步到 iOS
   npm run ios:build
   
   # 打开 Xcode
   npm run cap:open:ios
   ```

2. **在 Xcode 中配置**
   - 选择 "Any iOS Device" 或你的设备
   - 在 Signing & Capabilities 中：
     - 选择你的 Team（Apple Developer 账号）
     - Xcode 会自动管理证书和 Provisioning Profile

3. **Archive（归档）**
   - 菜单：Product → Archive
   - 等待构建完成

4. **上传到 App Store Connect**
   - 在 Organizer 窗口中选择刚创建的 Archive
   - 点击 "Distribute App"
   - 选择 "App Store Connect"
   - 按照向导完成上传

#### 选项 2：使用云构建（无 Mac）

参考 `项目分析报告.md` 中的 GitHub Actions 或 Codemagic 配置

---

## ✅ 第四部分：提交审核

### 提交前检查清单

- [ ] Apple Developer 账号已激活
- [ ] 应用已在 App Store Connect 中创建
- [ ] 所有截图已上传
- [ ] 应用描述和关键词已填写
- [ ] 隐私政策 URL 已配置
- [ ] 版本号已正确设置
- [ ] 应用已通过 TestFlight 测试（推荐）
- [ ] 应用图标已上传（1024x1024）

### 提交审核

1. **在 App Store Connect 中**
   - 进入你的应用
   - 点击"准备提交"
   - 选择构建版本
   - 填写审核信息
   - 提交审核

2. **审核时间**
   - 通常 1-3 个工作日
   - 首次提交可能需要更长时间

3. **审核被拒的常见原因**
   - 缺少隐私政策
   - 功能不完整或崩溃
   - 截图不符合要求
   - 描述与实际功能不符

---

## 🛠️ 第五部分：常用命令速查

```bash
# 开发预览
npm run dev:network          # 启动开发服务器（支持局域网）

# 构建
npm run build                 # 构建 Web 资源
npm run ios:build            # 构建并同步到 iOS
npm run android:build        # 构建并同步到 Android

# 预览设置
npm run ios:preview:setup    # 自动配置 iOS 预览

# Capacitor 命令
npm run cap:sync             # 同步所有平台
npm run cap:sync:ios         # 仅同步 iOS
npm run cap:open:ios         # 在 Xcode 中打开（需要 Mac）
```

---

## 📞 需要帮助？

如果遇到问题：

1. **预览问题**
   - 检查防火墙是否阻止了 5173 端口
   - 确认 iPhone 和电脑在同一 Wi-Fi
   - 尝试使用 `localhost` 在电脑浏览器测试

2. **构建问题**
   - 检查 Node.js 版本（推荐 v18+）
   - 运行 `npm install` 确保依赖完整
   - 查看错误日志

3. **上架问题**
   - 参考 Apple 官方文档
   - 检查 App Store Connect 中的错误提示
   - 确保所有必需信息已填写

---

## 🎯 推荐执行顺序

1. ✅ **立即开始**：注册 Apple Developer 账号
2. ✅ **今天完成**：使用方案 A 在 iPhone Safari 中预览应用
3. ✅ **本周完成**：准备应用截图和描述
4. ✅ **准备上架**：配置云构建或借用 Mac 构建应用
5. ✅ **提交审核**：在 App Store Connect 中提交

**祝你的应用顺利上架！🎉**
