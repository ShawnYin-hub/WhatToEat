#!/usr/bin/env node

/**
 * 部署到 Cloudflare Tunnel
 * 构建项目并创建公网可访问的临时 URL
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 开始部署到 Cloudflare Tunnel...\n');

// 步骤1: 构建项目
console.log('📦 步骤 1/3: 构建项目...\n');
const build = spawn('npm', ['run', 'build'], {
  shell: true,
  stdio: 'inherit'
});

build.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ 构建失败');
    process.exit(1);
  }
  
  console.log('\n✅ 构建完成！\n');
  
  // 步骤2: 启动预览服务器
  console.log('🌐 步骤 2/3: 启动预览服务器...\n');
  const preview = spawn('npm', ['run', 'preview'], {
    shell: true,
    stdio: 'pipe',
    detached: true
  });
  
  // 等待服务器启动
  let serverReady = false;
  preview.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    if ((output.includes('Local:') || output.includes('localhost:4173')) && !serverReady) {
      serverReady = true;
      setTimeout(() => {
        startTunnel();
      }, 2000);
    }
  });
  
  preview.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  preview.on('error', (err) => {
    console.error('❌ 预览服务器启动失败:', err.message);
    process.exit(1);
  });
  
  // 确保子进程在父进程退出时继续运行
  preview.unref();
});

function startTunnel() {
  console.log('\n🚀 步骤 3/3: 启动 Cloudflare Tunnel...\n');
  console.log('💡 正在创建公网访问链接，请稍候...\n');
  
  const cloudflared = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:4173'], {
    shell: true,
    stdio: 'pipe'
  });
  
  let urlFound = false;
  
  cloudflared.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // 提取 URL
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
    if (urlMatch && !urlFound) {
      urlFound = true;
      const url = urlMatch[0];
      console.log('\n' + '='.repeat(60));
      console.log('✅ 部署成功！');
      console.log('='.repeat(60));
      console.log('\n🌐 访问地址:');
      console.log(`   ${url}`);
      console.log('\n💡 提示:');
      console.log('   - 将此 URL 复制到浏览器即可访问');
      console.log('   - 可以在任何网络环境下访问');
      console.log('   - 按 Ctrl+C 停止服务');
      console.log('='.repeat(60) + '\n');
    }
  });
  
  cloudflared.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    
    // 也从 stderr 中提取 URL（cloudflared 有时会把 URL 输出到 stderr）
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
    if (urlMatch && !urlFound) {
      urlFound = true;
      const url = urlMatch[0];
      console.log('\n' + '='.repeat(60));
      console.log('✅ 部署成功！');
      console.log('='.repeat(60));
      console.log('\n🌐 访问地址:');
      console.log(`   ${url}`);
      console.log('\n💡 提示:');
      console.log('   - 将此 URL 复制到浏览器即可访问');
      console.log('   - 可以在任何网络环境下访问');
      console.log('   - 按 Ctrl+C 停止服务');
      console.log('='.repeat(60) + '\n');
    }
  });
  
  cloudflared.on('error', (err) => {
    console.error('\n❌ Cloudflare Tunnel 启动失败:', err.message);
    console.log('\n💡 请检查网络连接');
    process.exit(1);
  });
  
  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n\n正在停止服务...');
    cloudflared.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    cloudflared.kill();
    process.exit(0);
  });
}
