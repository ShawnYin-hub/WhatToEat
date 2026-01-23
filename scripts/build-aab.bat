@echo off
REM Android App Bundle 构建脚本 (Windows)
REM 构建AAB格式（Google Play推荐）

echo.
echo ========================================
echo    Android App Bundle 构建脚本
echo ========================================
echo.

REM 检查签名配置
if not exist "android\keystore.properties" (
    echo 错误：未找到签名配置文件！
    echo 请先配置签名密钥。
    pause
    exit /b 1
)

if not exist "my-release-key.jks" (
    echo 错误：未找到签名密钥文件！
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

echo [4/4] 构建Android App Bundle...
cd android
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo AAB构建失败！
    cd ..
    pause
    exit /b 1
)
cd ..
echo 完成！
echo.

echo ========================================
echo    AAB构建成功！
echo ========================================
echo.
echo AAB文件位置：
echo android\app\build\outputs\bundle\release\app-release.aab
echo.
echo 文件大小：
for %%A in ("android\app\build\outputs\bundle\release\app-release.aab") do echo %%~zA 字节
echo.
echo ✨ AAB优势：
echo - 文件更小
echo - Google Play自动优化
echo - 2021年8月起新应用强制要求
echo.
echo 下一步：
echo 1. 登录 Google Play Console
echo 2. 上传 app-release.aab
echo 3. 填写版本说明
echo 4. 提交审核
echo.
pause
