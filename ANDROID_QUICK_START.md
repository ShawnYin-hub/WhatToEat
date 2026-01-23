# Android应用快速开始指南 ⚡

## 📱 三步完成Android打包

### 步骤1️⃣：构建并同步（已完成✅）
```bash
npm run build
npx cap sync android
```

### 步骤2️⃣：在Android Studio测试（当前步骤）
```bash
npx cap open android
```

然后在Android Studio中：
1. 等待Gradle同步完成
2. 点击绿色的 **Run** 按钮（▶️）
3. 选择模拟器或连接的设备
4. 等待应用安装运行

### 步骤3️⃣：生成发布版APK
```bash
cd android
gradlew assembleRelease
```

APK位置：`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 签名配置（首次发布必需）

### 快速生成签名密钥

在项目根目录执行：

```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

按提示填写信息（**务必记住密码！**）

### 配置签名

1. 创建 `android/keystore.properties`：
```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=my-key-alias
storeFile=../my-release-key.jks
```

2. 修改 `android/app/build.gradle`（详见完整指南）

---

## 📦 构建选项

### 选项A：APK（传统格式）
```bash
cd android
gradlew assembleRelease
```
输出：`android/app/build/outputs/apk/release/app-release.apk`

### 选项B：AAB（Google Play推荐）
```bash
cd android
gradlew bundleRelease
```
输出：`android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 上架快速清单

### Google Play（国际）
- [ ] 注册Google Play开发者账号（$25）
- [ ] 准备应用截图（至少2张）
- [ ] 准备功能图片（1024x500）
- [ ] 编写应用描述
- [ ] 上传APK/AAB
- [ ] 提交审核

### 国内应用商店
- [ ] 华为应用市场（需软著或ICP）
- [ ] 小米应用商店
- [ ] OPPO软件商店
- [ ] vivo应用商店
- [ ] 应用宝（腾讯）

---

## 📸 必备资源

### 应用截图
至少需要2张，推荐6张：
1. 主页（地图服务选择）
2. 位置选择界面
3. 菜系选择界面
4. 随机结果展示
5. 个人中心页面
6. 每日推荐页面

### 应用描述（中文）

**简短描述（80字符以内）**：
```
今天吃什么？AI帮你决定！解决选择困难症的美食助手
```

**完整描述**：
```
🍽️ 今天吃什么 - 你的AI美食决策助手

【核心功能】
✨ 智能推荐：基于位置、菜系偏好和距离智能推荐餐厅
🎰 随机抽选：选择困难症？让AI帮你做决定
🗺️ 多地图支持：高德地图（中国）、GreenStreet（全球）
📍 精准定位：自动或手动选择位置
🌏 双语支持：中文/English无缝切换

【特色功能】
💝 暖心饭点：每日AI推荐，午餐/下午茶/晚餐灵感
👤 用户画像：AI分析你的美食偏好
📊 历史记录：记录你的美食足迹

立即下载，让AI帮你决定今天吃什么！
```

---

## 🐛 常见问题

### Q: Android Studio构建失败？
**A**: 
```bash
# 清理并重新构建
cd android
gradlew clean
gradlew build
```

### Q: 签名密钥忘记密码？
**A**: ⚠️ 无法找回！只能重新生成密钥并发布新应用

### Q: 如何减小APK大小？
**A**: 
1. 使用AAB代替APK
2. 启用代码混淆
3. 移除未使用的资源

### Q: 如何测试发布版？
**A**:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 📚 详细文档

- 完整部署指南：`ANDROID_DEPLOYMENT_GUIDE.md`
- Capacitor配置：`capacitor.config.ts`
- Android配置：`android/app/build.gradle`

---

## ⚡ 一键脚本

### 构建并同步
```bash
npm run android:build
```

### 打开Android Studio
```bash
npm run android:open
```

---

## 🎯 当前状态

✅ Web应用已构建  
✅ 已同步到Android项目  
✅ Android Studio已打开  
⬜ 生成签名密钥  
⬜ 构建发布版APK  
⬜ 上架应用商店  

---

**下一步**：在Android Studio中运行应用进行测试！ 🚀
