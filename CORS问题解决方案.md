# CORS 问题解决方案

## 问题描述

在浏览器预览时（`http://localhost:4173`），Supabase API 请求被 CORS 策略阻止，因为 Supabase 只允许 `http://localhost:8081`。

## 解决方案

### 方案 1：在 Supabase Dashboard 添加允许的源（推荐）

1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Settings → API**
4. 在 **CORS** 部分，添加以下允许的源：
   - `http://localhost:4173`
   - `http://localhost:5173`
   - `http://localhost:8081`
   - `capacitor://localhost`（用于 iOS 应用）
   - `ionic://localhost`（如果使用 Ionic）

5. 保存设置

### 方案 2：使用开发服务器（支持代理）

开发服务器已经配置了 Supabase 代理，可以避免 CORS 问题：

```bash
# 停止预览服务器（如果正在运行）
# 然后启动开发服务器
npm run dev
```

访问：`http://localhost:5173`

**注意：** 开发服务器会使用代理，所有 Supabase 请求会通过 `/api/supabase` 代理，避免 CORS 问题。

### 方案 3：修改预览服务器端口为 8081

修改 `package.json`：

```json
{
  "scripts": {
    "preview": "vite preview --host 0.0.0.0 --port 8081"
  }
}
```

然后运行：

```bash
npm run preview
```

访问：`http://localhost:8081`

### 方案 4：iOS 应用不需要担心 CORS

**重要：** 在 iOS 应用中（通过 Capacitor），CORS 问题不会出现，因为：
- Capacitor 应用运行在原生 WebView 中
- WebView 不受浏览器 CORS 限制
- 可以直接访问 Supabase API

所以，如果只是为了在 iOS 上测试，可以忽略浏览器的 CORS 错误，直接同步到 iOS 项目即可。

---

## 当前代码状态

代码已经配置了：
1. ✅ Vite 开发服务器支持 Supabase 代理（`/api/supabase`）
2. ✅ Supabase 客户端在开发环境中自动使用代理
3. ✅ iOS 应用可以直接访问 Supabase（不受 CORS 限制）

## 推荐操作

**对于浏览器预览：**
- **推荐：** 使用方案 2（开发服务器 `npm run dev`），它支持代理，可以避免 CORS 问题
- **备选：** 使用方案 1（在 Supabase Dashboard 添加允许的源 `http://localhost:4173`）

**对于 iOS 应用：**
- 直接同步到 iOS 项目，不需要担心 CORS 问题（iOS 应用不受浏览器 CORS 限制）

## 当前代码配置

代码已经配置为：
- ✅ 开发服务器（端口 5173）：自动使用代理 `/api/supabase`，避免 CORS
- ✅ 预览服务器（端口 4173）：直接使用原始 Supabase URL（需要在 Supabase Dashboard 添加允许的源）
- ✅ iOS 应用：直接使用原始 Supabase URL（不受 CORS 限制）
