#!/bin/bash

# Mac iOS 项目一键准备脚本
# 用于在 Mac 上快速准备项目，然后打开 Xcode

set -e  # 遇到错误立即退出

echo "🚀 开始准备 iOS 项目..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    echo "   安装方法：brew install node"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js 已安装: $NODE_VERSION${NC}"
echo ""

# 检查 npm
echo "📦 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm 已安装: $NPM_VERSION${NC}"
echo ""

# 检查 Xcode
echo "🍎 检查 Xcode..."
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${YELLOW}⚠️  Xcode 未安装或未配置${NC}"
    echo "   请从 App Store 安装 Xcode，然后运行: sudo xcodebuild -license accept"
    exit 1
fi
XCODE_VERSION=$(xcodebuild -version | head -n 1)
echo -e "${GREEN}✅ Xcode 已安装: $XCODE_VERSION${NC}"
echo ""

# 检查 CocoaPods
echo "📱 检查 CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods 未安装，正在安装...${NC}"
    sudo gem install cocoapods
else
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✅ CocoaPods 已安装: $POD_VERSION${NC}"
fi
echo ""

# 安装 npm 依赖
echo "📥 安装 npm 依赖..."
if [ ! -d "node_modules" ]; then
    echo "   首次安装，可能需要几分钟..."
    npm install
else
    echo "   检查依赖更新..."
    npm install
fi
echo -e "${GREEN}✅ npm 依赖安装完成${NC}"
echo ""

# 构建 Web 资源
echo "🔨 构建 Web 资源..."
npm run build
echo -e "${GREEN}✅ Web 资源构建完成${NC}"
echo ""

# 同步到 iOS
echo "🔄 同步到 iOS 项目..."
npx cap sync ios
echo -e "${GREEN}✅ iOS 项目同步完成${NC}"
echo ""

# 安装 CocoaPods 依赖
echo "📦 安装 CocoaPods 依赖..."
cd ios/App

if [ ! -d "Pods" ]; then
    echo "   首次安装 Pods，可能需要较长时间..."
    pod install
else
    echo "   更新 Pods..."
    pod install
fi

cd ../..
echo -e "${GREEN}✅ CocoaPods 依赖安装完成${NC}"
echo ""

# 完成
echo -e "${GREEN}🎉 所有准备工作完成！${NC}"
echo ""
echo "下一步操作："
echo "1. 运行以下命令打开 Xcode："
echo "   ${YELLOW}npm run cap:open:ios${NC}"
echo ""
echo "2. 或者在 Xcode 中手动打开："
echo "   ${YELLOW}open ios/App/App.xcworkspace${NC}"
echo ""
echo "3. 在 Xcode 中："
echo "   - 选择项目 → App target → Signing & Capabilities"
echo "   - 勾选 'Automatically manage signing'"
echo "   - 选择你的 Team（如果没有，选择 'Add an Account...'）"
echo "   - 选择设备（模拟器或真机）"
echo "   - 点击运行按钮（▶️）或按 Cmd+R"
echo ""
