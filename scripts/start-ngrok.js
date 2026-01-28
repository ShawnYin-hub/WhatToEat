#!/usr/bin/env node

/**
 * 使用 ngrok 启动内网穿透
 */

const { spawn } = require('child_process');
const args = process.argv.slice(2);
const isPreview = args.includes('--preview');
const port = isPreview ? 4173 : 5173;

console.log('🌐 使用 ngrok 启动内网穿透\n');
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
        startNgrok();
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
        startNgrok();
      }, 1000);
    } else {
      console.error('❌ 构建失败');
      process.exit(1);
    }
  });
}

function startNgrok() {
  console.log('🚀 启动 ngrok...\n');
  const ngrok = spawn('ngrok', ['http', port.toString()], {
    shell: true,
    stdio: 'inherit'
  });

  ngrok.on('error', (err) => {
    console.error('\n❌ ngrok 启动失败:', err.message);
    console.log('\n💡 请安装 ngrok:');
    console.log('   1. 访问 https://ngrok.com/download');
    console.log('   2. 下载 Windows 版本 (ngrok.exe)');
    console.log('   3. 解压并将 ngrok.exe 添加到系统 PATH');
    console.log('   4. 或直接放在项目根目录');
    console.log('\n📝 注册账号（可选，免费版有使用限制）:');
    console.log('   访问 https://dashboard.ngrok.com/signup');
    console.log('   获取 authtoken 后运行: ngrok config add-authtoken YOUR_TOKEN');
    console.log('\n💡 或者使用 Cloudflare Tunnel (无需注册):');
    console.log('   运行: npm run dev:cloudflare');
    process.exit(1);
  });

  console.log('\n✅ ngrok 已启动！');
  console.log('📱 请在 ngrok 输出中找到 "Forwarding" 后面的 URL');
  console.log('   格式: https://xxxx-xx-xx-xx-xx.ngrok-free.app');
  console.log('\n💡 提示:');
  console.log('   - 将这个 URL 在 iPhone 浏览器中打开即可访问');
  console.log('   - 无需在同一 Wi-Fi 网络');
  console.log('   - 按 Ctrl+C 停止服务\n');
}
