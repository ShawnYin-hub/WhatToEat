# Android Studio 打开和上架指南

本指南将帮助您使用 Android Studio 打开项目并准备上架到 Google Play Store。

## 📋 前置要求

### 1. 安装 Android Studio
- 下载并安装 [Android Studio](https://developer.android.com/studio)
- 安装 Android SDK（建议使用 Android SDK 33 或更高版本）
- 安装 JDK 17 或更高版本

### 2. 安装 Gradle
Android Studio 会自动下载 Gradle，但确保已安装最新版本。

## 🚀 打开项目

### 方法 1：通过 Android Studio 打开
1. 启动 Android Studio
2. 选择 `Open` 或 `File > Open`
3. 导航到项目目录下的 `android` 文件夹
4. 选择 `android` 文件夹并点击 `OK`
5. 等待 Gradle 同步完成（可能需要几分钟）

### 方法 2：使用命令行打开
```bash
npx cap open android
```

## 🔧 项目配置

### 应用信息
- **应用 ID**: `com.whattoeat.today`
- **应用名称**: `今天吃什么`
- **包名**: `com.whattoeat.today`

### 修改应用信息
如需修改应用信息，请编辑以下文件：

1. **应用名称**: `android/app/src/main/res/values/strings.xml`
2. **应用 ID**: `capacitor.config.ts` 中的 `appId`
3. **应用图标**: 替换 `android/app/src/main/res/mipmap-*` 目录下的图标文件

## 📱 运行应用

### 在模拟器上运行
1. 在 Android Studio 中，点击工具栏的 `Device Manager`
2. 创建一个新的虚拟设备（AVD）
3. 选择设备并点击运行按钮（绿色播放图标）

### 在真实设备上运行
1. 启用设备的开发者选项和 USB 调试
2. 通过 USB 连接设备到电脑
3. 在 Android Studio 中选择设备并点击运行

## 🔐 生成签名密钥（上架必需）

### 1. 创建密钥库
```bash
keytool -genkey -v -keystore what-to-eat-release.keystore -alias what-to-eat -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置签名
创建 `android/keystore.properties` 文件：
```properties
storePassword=你的密钥库密码
keyPassword=你的密钥密码
keyAlias=what-to-eat
storeFile=../what-to-eat-release.keystore
```

### 3. 修改 build.gradle
编辑 `android/app/build.gradle`，在 `android` 块中添加：

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... 现有配置 ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 📦 构建发布版本

### 在 Android Studio 中构建
1. 选择 `Build > Generate Signed Bundle / APK`
2. 选择 `Android App Bundle`（推荐）或 `APK`
3. 选择密钥库文件并输入密码
4. 选择 `release` 构建类型
5. 点击 `Finish`

### 使用命令行构建
```bash
cd android
./gradlew assembleRelease
```

生成的 APK 位于：`android/app/build/outputs/apk/release/app-release.apk`

## 🎯 Google Play Store 上架准备

### 1. 准备应用素材
- **应用图标**: 512x512 PNG（透明背景）
- **功能截图**: 至少 2 张，推荐 4-8 张
- **应用描述**: 中文和英文版本
- **隐私政策链接**: 必需的（如果应用收集用户数据）

### 2. 创建 Google Play Console 账户
- 访问 [Google Play Console](https://play.google.com/console)
- 支付一次性注册费（$25）
- 创建开发者账户

### 3. 创建新应用
1. 在 Google Play Console 中点击"创建应用"
2. 填写应用详情：
   - 应用名称：今天吃什么
   - 默认语言：中文（简体）
   - 应用或游戏：应用
   - 免费或付费：免费

### 4. 填写商店信息
- **简短描述**: 解决选择困难症，随机推荐附近美食
- **完整描述**: 详细介绍应用功能
- **应用类别**: 生活方式 / 工具
- **内容分级**: 完成内容分级问卷

### 5. 上传应用
1. 进入"版本" > "生产环境"
2. 创建新版本
3. 上传 Android App Bundle（.aab 文件）
4. 填写版本说明

### 6. 设置定价和分发
- 选择"免费"
- 选择分发国家/地区
- 设置隐私政策链接

### 7. 提交审核
- 检查所有必填信息
- 点击"提交审核"
- 等待审核（通常 1-3 个工作日）

## 🔄 更新工作流程

每次更新应用时：

1. **更新 Web 代码**
   ```bash
   npm run build
   ```

2. **同步到 Android**
   ```bash
   npx cap sync android
   ```

3. **在 Android Studio 中打开**
   ```bash
   npx cap open android
   ```

4. **构建新版本**
   - 更新版本号（在 `android/app/build.gradle` 中）
   - 构建发布版本
   - 上传到 Google Play Console

## ⚠️ 注意事项

1. **权限说明**: 应用需要位置权限来获取用户当前位置，请在隐私政策中说明

2. **API 密钥**: 
   - 高德地图 API 密钥已内置
   - 如需更换，修改 `capacitor.config.ts` 中的相关配置

3. **网络请求**: 
   - 应用需要网络权限访问地图服务和 POI 数据
   - 某些 API 可能需要代理访问

4. **最小 SDK 版本**: 
   - 当前设置为 Android 5.0 (API 21)
   - 可根据需要调整 `android/app/build.gradle` 中的 `minSdkVersion`

5. **ProGuard**: 
   - 发布版本会启用代码混淆
   - 如果遇到运行时错误，可能需要添加 ProGuard 规则

## 🐛 常见问题

### Gradle 同步失败
- 检查网络连接
- 尝试清理缓存：`File > Invalidate Caches / Restart`
- 检查 Android SDK 是否正确安装

### 构建失败
- 确保 JDK 版本正确（需要 JDK 17+）
- 检查 `build.gradle` 文件中的配置
- 查看错误日志并搜索解决方案

### 应用崩溃
- 在 Android Studio 中查看 Logcat 日志
- 检查权限是否正确声明
- 确保 Web 资源已正确同步

## 📚 相关资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发文档](https://developer.android.com/docs)
- [Google Play Console 帮助](https://support.google.com/googleplay/android-developer)

## 📞 获取帮助

如果遇到问题，请：
1. 查看 Android Studio 的 Logcat 输出
2. 检查 Capacitor 官方文档
3. 查看项目的 GitHub Issues（如果有）

祝您上架顺利！🎉
