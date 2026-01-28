#!/usr/bin/env node

/**
 * 自动选择并启动内网穿透服务
 * 支持 ngrok 和 cloudflared (Cloudflare Tunnel)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isPreview = args.includes('--preview');
const port = isPreview ? 4173 : 5173;

// 检查工具是否安装
function checkTool(tool) {
  return new Promise((resolve) => {
    const check = spawn(tool, ['--version'], { shell: true, stdio: 'ignore' });
    check.on('close', (code) => {
      resolve(code === 0);
    });
    check.on('error', () => {
      resolve(false);
    });
  });
}

// 启动 ngrok
function startNgrok() {
  console.log('🚀 启动 ngrok...\n');
  const ngrok = spawn('ngrok', ['http', port.toString()], {
    shell: true,
    stdio: 'inherit'
  });

  ngrok.on('error', (err) => {
    console.error('❌ ngrok 启动失败:', err.message);
    console.log('\n💡 请安装 ngrok:');
    console.log('   1. 访问 https://ngrok.com/download');
    console.log('   2. 下载并解压 ngrok.exe');
    console.log('   3. 将 ngrok.exe 添加到系统 PATH');
    console.log('   4. 或运行: npm run dev:cloudflare (使用 Cloudflare Tunnel)');
    process.exit(1);
  });

  console.log('\n✅ ngrok 已启动！');
  console.log('📱 请在 ngrok 输出中找到 "Forwarding" 后面的 URL');
  console.log('   例如: https://xxxx-xx-xx-xx-xx.ngrok-free.app');
  console.log('\n💡 提示: 将这个 URL 在 iPhone 浏览器中打开即可访问');
  console.log('   按 Ctrl+C 停止服务\n');
}

// 启动 Cloudflare Tunnel
function startCloudflare() {
  console.log('🚀 启动 Cloudflare Tunnel...\n');
  
  // 检查 cloudflared 是否安装
  checkTool('cloudflared').then((installed) => {
    if (!installed) {
      console.log('📦 正在安装 cloudflared...');
      console.log('   这可能需要几分钟，请稍候...\n');
      
      // 尝试使用 npx 运行
      const cloudflared = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`], {
        shell: true,
        stdio: 'inherit'
      });

      cloudflared.on('error', (err) => {
        console.error('❌ Cloudflare Tunnel 启动失败:', err.message);
        console.log('\n💡 请手动安装 cloudflared:');
        console.log('   访问: https://github.com/cloudflare/cloudflared/releases');
        console.log('   或使用: npm run dev:ngrok (需要先安装 ngrok)');
        process.exit(1);
      });

      console.log('\n✅ Cloudflare Tunnel 已启动！');
      console.log('📱 请在输出中找到 "https://xxxx.trycloudflare.com" 格式的 URL');
      console.log('\n💡 提示: 将这个 URL 在 iPhone 浏览器中打开即可访问');
      console.log('   按 Ctrl+C 停止服务\n');
    } else {
      const cloudflared = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
        shell: true,
        stdio: 'inherit'
      });

      cloudflared.on('error', (err) => {
        console.error('❌ Cloudflare Tunnel 启动失败:', err.message);
        process.exit(1);
      });

      console.log('\n✅ Cloudflare Tunnel 已启动！');
      console.log('📱 请在输出中找到 "https://xxxx.trycloudflare.com" 格式的 URL');
      console.log('\n💡 提示: 将这个 URL 在 iPhone 浏览器中打开即可访问');
      console.log('   按 Ctrl+C 停止服务\n');
    }
  });
}

// 主函数
async function main() {
  console.log('🌐 内网穿透预览工具\n');
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
          startTunnel();
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
    // 预览模式，先构建
    console.log('📦 构建生产版本...\n');
    const build = spawn('npm', ['run', 'build'], {
      shell: true,
      stdio: 'inherit'
    });

    build.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ 构建完成！\n');
        setTimeout(() => {
          startTunnel();
        }, 1000);
      } else {
        console.error('❌ 构建失败');
        process.exit(1);
      }
    });
  }

  function startTunnel() {
    // 优先尝试 cloudflared（免费且无需注册）
    checkTool('cloudflared').then((hasCloudflare) => {
      if (hasCloudflare) {
        startCloudflare();
      } else {
        // 尝试 ngrok
        checkTool('ngrok').then((hasNgrok) => {
          if (hasNgrok) {
            startNgrok();
          } else {
            console.log('❌ 未找到内网穿透工具\n');
            console.log('📦 请安装以下工具之一：\n');
            console.log('方案 1: Cloudflare Tunnel (推荐，免费且无需注册)');
            console.log('   运行: npm run dev:cloudflare');
            console.log('   或访问: https://github.com/cloudflare/cloudflared/releases\n');
            console.log('方案 2: ngrok (需要注册账号)');
            console.log('   1. 访问: https://ngrok.com/download');
            console.log('   2. 下载 ngrok.exe');
            console.log('   3. 添加到 PATH 或放在项目目录');
            console.log('   4. 运行: npm run dev:ngrok\n');
            process.exit(1);
          }
        });
      }
    });
  }
}

main();
