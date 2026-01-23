@echo off
REM Android 应用构建脚本 (Windows)
REM 自动化构建Web应用并同步到Android

echo.
echo ========================================
echo    Android 应用自动构建脚本
echo ========================================
echo.

echo [1/4] 清理dist目录...
if exist dist rmdir /s /q dist
echo 完成！
echo.

echo [2/4] 构建Web应用...
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！请检查错误信息。
    pause
    exit /b 1
)
echo 完成！
echo.

echo [3/4] 同步到Android项目...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 同步失败！请检查错误信息。
    pause
    exit /b 1
)
echo 完成！
echo.

echo [4/4] 构建Android APK (Debug)...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo APK构建失败！请检查错误信息。
    cd ..
    pause
    exit /b 1
)
cd ..
echo 完成！
echo.

echo ========================================
echo    构建成功！
echo ========================================
echo.
echo Debug APK位置：
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 如需构建发布版，请运行：
echo cd android ^&^& gradlew assembleRelease
echo.
pause
