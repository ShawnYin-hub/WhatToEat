# 环境变量配置模板

## 创建 .env 文件

在项目根目录创建 `.env` 文件（与 `package.json` 同级）

```env
# Supabase 配置
# 在 Supabase Dashboard 中获取这些值：https://app.supabase.com/

# 项目 URL（格式：https://xxxxx.supabase.co）
VITE_SUPABASE_URL=YOUR_SUPABASE_URL

# Anon/Public Key（可以在 Settings > API 中找到）
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 获取Supabase凭据

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目（或创建新项目）
3. 点击左侧 **Settings** (齿轮图标)
4. 点击 **API**
5. 复制以下信息：
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 示例

```env
VITE_SUPABASE_URL=https://abcdefghijklmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjM0NTY3ODksImV4cCI6MTkzOTAzMjc4OX0.abcdefghijklmnopqrstuvwxyz1234567890
```

## 注意事项

- ⚠️ `.env` 文件不要提交到Git（已在`.gitignore`中）
- ⚠️ 配置后需要重启开发服务器才能生效
- ⚠️ 不要分享你的 ANON_KEY

## 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

## 验证配置

打开浏览器控制台（F12），输入：

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
```

应该显示你的URL和 `true`
