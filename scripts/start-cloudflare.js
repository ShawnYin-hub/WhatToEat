#!/usr/bin/env node

/**
 * 使用 Cloudflare Tunnel 启动内网穿透
 * 免费且无需注册账号
 */

const { spawn } = require('child_process');
const args = process.argv.slice(2);
const isPreview = args.includes('--preview');
const port = isPreview ? 4173 : 5173;

console.log('🌐 使用 Cloudflare Tunnel 启动内网穿透\n');
console.log(`📡 目标端口: ${port} (${isPreview ? '预览模式' : '开发模式'})\n`);

// 先启动 Vite 服务器（如果不是预览模式）
if (!isPreview) {
  console.log('⚡ 启动 Vite 开发服务器...\n');
  const vite = spawn('npm', ['run', 'dev:network'], {
    shell: true,
    stdio: 'pipe'
  });

  vite.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    // 检测服务器启动完成
    if (output.includes('ready in') || output.includes('Local:')) {
      setTimeout(() => {
        startCloudflare();
      }, 2000);
    }
  });

  vite.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  vite.on('error', (err) => {
    console.error('❌ Vite 启动失败:', err.message);
    process.exit(1);
  });
} else {
  // 预览模式
  console.log('📦 构建生产版本...\n');
  const build = spawn('npm', ['run', 'build'], {
    shell: true,
    stdio: 'inherit'
  });

  build.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 构建完成！\n');
      setTimeout(() => {
        startCloudflare();
      }, 1000);
    } else {
      console.error('❌ 构建失败');
      process.exit(1);
    }
  });
}

function startCloudflare() {
  console.log('🚀 启动 Cloudflare Tunnel...\n');
  console.log('💡 首次运行会自动下载 cloudflared，请稍候...\n');
  
  // 使用 npx 运行 cloudflared（无需安装）
  const cloudflared = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`], {
    shell: true,
    stdio: 'inherit'
  });

  cloudflared.on('error', (err) => {
    console.error('\n❌ Cloudflare Tunnel 启动失败:', err.message);
    console.log('\n💡 请检查网络连接或尝试手动安装:');
    console.log('   访问: https://github.com/cloudflare/cloudflared/releases');
    console.log('   下载 Windows 版本并添加到 PATH');
    process.exit(1);
  });

  console.log('\n✅ Cloudflare Tunnel 已启动！');
  console.log('📱 请在输出中找到 "https://xxxx.trycloudflare.com" 格式的 URL');
  console.log('\n💡 提示:');
  console.log('   - 将这个 URL 在 iPhone 浏览器中打开即可访问');
  console.log('   - 无需在同一 Wi-Fi 网络');
  console.log('   - 无需注册账号，完全免费');
  console.log('   - 按 Ctrl+C 停止服务\n');
}
