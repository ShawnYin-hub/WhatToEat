# Android 应用构建说明

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 构建 Web 应用
```bash
npm run build
```

### 3. 同步到 Android
```bash
npx cap sync android
```

### 4. 在 Android Studio 中打开
```bash
npx cap open android
```

或者在 Android Studio 中直接打开 `android` 文件夹。

## 📱 开发工作流程

### 修改 Web 代码后
1. 重新构建：`npm run build`
2. 同步到 Android：`npx cap sync android`
3. 在 Android Studio 中运行

### 修改 Android 原生代码后
1. 直接构建并运行即可
2. Web 资源会自动同步

## 🔐 生成签名密钥（用于发布）

### Windows
```bash
keytool -genkey -v -keystore what-to-eat-release.keystore -alias what-to-eat -keyalg RSA -keysize 2048 -validity 10000
```

### 配置签名
1. 复制 `android/keystore.properties.example` 为 `android/keystore.properties`
2. 填写密钥库信息
3. 编辑 `android/app/build.gradle` 添加签名配置（参考 `ANDROID_STUDIO_GUIDE.md`）

## 📦 构建发布版本

### 方法 1：Android Studio
1. `Build > Generate Signed Bundle / APK`
2. 选择 `Android App Bundle` 或 `APK`
3. 完成签名配置
4. 等待构建完成

### 方法 2：命令行
```bash
cd android
./gradlew assembleRelease
```

APK 位置：`android/app/build/outputs/apk/release/app-release.apk`

## 📚 详细文档

查看 [ANDROID_STUDIO_GUIDE.md](./ANDROID_STUDIO_GUIDE.md) 获取完整的上架指南。

## ⚙️ 配置说明

- **应用 ID**: `com.whattoeat.today`
- **最低 Android 版本**: Android 5.0 (API 21)
- **目标 Android 版本**: Android 13 (API 33)

## 🔧 权限说明

应用需要以下权限：
- `INTERNET` - 访问网络服务
- `ACCESS_FINE_LOCATION` - 获取精确位置
- `ACCESS_COARSE_LOCATION` - 获取大致位置
- `ACCESS_NETWORK_STATE` - 检查网络状态

## 💡 提示

- 第一次打开项目时，Gradle 同步可能需要较长时间
- 确保已安装 Android SDK 和 JDK 17+
- 推荐使用 Android Studio Arctic Fox 或更高版本
