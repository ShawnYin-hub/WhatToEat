# 🚀 Android 应用快速启动指南

## 前提条件

1. ✅ 已安装 Node.js (v16+)
2. ✅ 已安装 Android Studio
3. ✅ 已安装 Android SDK

## 三步快速启动

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 构建并同步
```bash
npm run android:build
```

这个命令会：
- 构建 Web 应用 (`npm run build`)
- 同步到 Android 项目 (`npx cap sync android`)

### 3️⃣ 打开 Android Studio
```bash
npm run android:open
```

或者在 Android Studio 中手动打开 `android` 文件夹。

## 📱 在 Android Studio 中运行

1. 等待 Gradle 同步完成
2. 连接设备或启动模拟器
3. 点击绿色运行按钮 ▶️

## 🔄 修改代码后的流程

### 修改 Web 代码（React/Vite）
```bash
npm run android:build  # 构建并同步
npm run android:open   # 在 Android Studio 中重新运行
```

### 修改 Android 原生代码
- 直接在 Android Studio 中修改
- 点击运行即可，无需额外步骤

## 📦 生成发布版本

### 方法 1：Android Studio（推荐）
1. `Build` → `Generate Signed Bundle / APK`
2. 选择 `Android App Bundle`
3. 配置签名密钥
4. 完成构建

### 方法 2：命令行
```bash
cd android
./gradlew assembleRelease  # Windows: gradlew.bat assembleRelease
```

生成的文件位置：
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔐 首次发布需要

### 1. 生成签名密钥
```bash
keytool -genkey -v -keystore what-to-eat-release.keystore -alias what-to-eat -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置签名
1. 复制 `android/keystore.properties.example` → `android/keystore.properties`
2. 填写密钥库信息
3. 按照 `ANDROID_STUDIO_GUIDE.md` 配置 `build.gradle`

## 📚 更多帮助

- 详细上架指南：查看 [ANDROID_STUDIO_GUIDE.md](./ANDROID_STUDIO_GUIDE.md)
- Android 开发说明：查看 [README_ANDROID.md](./README_ANDROID.md)

## ⚠️ 常见问题

**Q: Gradle 同步失败？**  
A: 检查网络连接，Android Studio 会自动下载所需依赖

**Q: 找不到设备？**  
A: 确保已启用 USB 调试（设置 → 开发者选项）

**Q: 应用崩溃？**  
A: 查看 Android Studio 的 Logcat 日志排查问题

---

💡 **提示**：第一次打开项目时，Gradle 同步可能需要 5-10 分钟，请耐心等待。
