@echo off
REM Android 发布版构建脚本 (Windows)
REM 构建签名的发布版APK

echo.
echo ========================================
echo    Android 发布版构建脚本
echo ========================================
echo.

REM 检查签名配置是否存在
if not exist "android\keystore.properties" (
    echo 错误：未找到签名配置文件！
    echo.
    echo 请先创建 android\keystore.properties 文件
    echo 并生成签名密钥 my-release-key.jks
    echo.
    echo 详细步骤请查看：ANDROID_DEPLOYMENT_GUIDE.md
    echo.
    pause
    exit /b 1
)

if not exist "my-release-key.jks" (
    echo 错误：未找到签名密钥文件 my-release-key.jks！
    echo.
    echo 请先生成签名密钥：
    echo keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
    echo.
    pause
    exit /b 1
)

echo [1/4] 清理构建...
cd android
call gradlew clean
cd ..
echo 完成！
echo.

echo [2/4] 构建Web应用...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    pause
    exit /b 1
)
echo 完成！
echo.

echo [3/4] 同步到Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 同步失败！
    pause
    exit /b 1
)
echo 完成！
echo.

echo [4/4] 构建签名的发布版APK...
cd android
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo APK构建失败！
    cd ..
    pause
    exit /b 1
)
cd ..
echo 完成！
echo.

echo ========================================
echo    发布版构建成功！
echo ========================================
echo.
echo 发布版APK位置：
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo 文件大小：
for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do echo %%~zA 字节
echo.
echo 下一步：
echo 1. 测试APK：adb install android\app\build\outputs\apk\release\app-release.apk
echo 2. 上传到Google Play Console
echo 3. 填写应用商店信息
echo 4. 提交审核
echo.
pause
