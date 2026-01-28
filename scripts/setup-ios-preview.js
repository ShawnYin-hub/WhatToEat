#!/usr/bin/env node

/**
 * iOS 预览设置脚本
 * 帮助配置 Capacitor 以连接到本地开发服务器
 */

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部（即 127.0.0.1）和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function updateCapacitorConfig(ip) {
  const configPath = path.join(__dirname, '..', 'capacitor.config.ts');
  let config = fs.readFileSync(configPath, 'utf8');
  
  // 检查是否已经配置了开发服务器
  if (config.includes(`url: 'http://${ip}:5173'`)) {
    console.log('✅ Capacitor 配置已包含开发服务器地址');
    return;
  }
  
  // 替换或添加开发服务器配置
  const serverConfig = `  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // 开发模式：连接到本地开发服务器
    url: 'http://${ip}:5173',
    cleartext: true
  },`;
  
  if (config.includes('server: {')) {
    // 替换现有的 server 配置
    config = config.replace(
      /server:\s*\{[^}]*\},/s,
      serverConfig
    );
  } else {
    // 在 android 配置前添加 server 配置
    config = config.replace(
      /(\s+)(android:)/,
      `$1${serverConfig}\n$1$2`
    );
  }
  
  fs.writeFileSync(configPath, config, 'utf8');
  console.log(`✅ 已更新 Capacitor 配置，开发服务器地址: http://${ip}:5173`);
}

function main() {
  console.log('📱 iOS 预览设置工具\n');
  
  const localIP = getLocalIP();
  console.log(`📍 检测到本地 IP 地址: ${localIP}\n`);
  
  if (localIP === 'localhost') {
    console.log('⚠️  警告: 无法检测到局域网 IP，将使用 localhost');
    console.log('   如果 iPhone 和电脑不在同一网络，请手动配置 IP 地址\n');
  }
  
  // 更新 Capacitor 配置
  updateCapacitorConfig(localIP);
  
  console.log('\n📋 下一步操作:');
  console.log('1. 确保 iPhone 和电脑连接到同一个 Wi-Fi 网络');
  console.log('2. 运行: npm run dev:network');
  console.log('3. 在 iPhone 上打开已安装的 App（需要先通过 Xcode 安装）');
  console.log(`4. 或者直接在 iPhone Safari 中访问: http://${localIP}:5173`);
  console.log('\n💡 提示: 如果 IP 地址变化，重新运行此脚本更新配置');
}

main();
