# Supabase 设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目 URL 和 Anon Key

## 2. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-app.vercel.app  # 可选，用于 Android 打包
```

## 3. 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行 `database/schema.sql` 文件中的 SQL 语句。

## 4. 配置 Row Level Security (RLS)

SQL 文件中已包含 RLS 策略，执行后会自动启用。

## 5. 测试

启动开发服务器：

```bash
npm run dev
```

访问应用，测试登录/注册功能。

## 注意事项

- 确保 Supabase 项目已启用 Email 认证
- 在生产环境中，建议配置 Email 模板
- API_BASE_URL 用于 Android 打包，确保使用完整的 HTTPS URL
