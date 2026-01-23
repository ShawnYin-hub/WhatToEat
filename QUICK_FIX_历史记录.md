# 快速修复历史记录问题 ⚡

## 🎯 问题
历史记录找不到？AI推荐无法生成？

## ⚡ 3步快速修复

### 步骤1️⃣：诊断问题（1分钟）

```bash
# 启动开发服务器
npm run dev
```

打开 http://localhost:5173/，按 **F12** 打开控制台，输入：

```javascript
await window.historyDebug.runFullDiagnostic()
```

查看诊断结果...

---

### 步骤2️⃣：根据诊断结果修复

#### 如果显示：❌ Supabase 未配置

**操作**：创建 `.env` 文件

1. 在项目根目录创建 `.env` 文件
2. 填入以下内容：

```env
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon key
```

3. 从 [Supabase Dashboard](https://app.supabase.com/) → Settings → API 获取这两个值
4. 重启开发服务器（Ctrl+C 然后 `npm run dev`）

---

#### 如果显示：⚠️ 用户未登录

**操作**：注册并登录

1. 在应用中点击"注册"
2. 输入邮箱和密码
3. 登录成功

---

#### 如果显示：❌ 数据库表不存在

**操作**：执行SQL

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 点击左侧 **SQL Editor**
3. 点击 **New query**
4. 复制粘贴 `database/schema.sql` 的全部内容
5. 点击 **RUN**

---

### 步骤3️⃣：测试功能

1. 点击"帮我选"抽取餐厅
2. 点击"就吃这家"或"带我导航"
3. 进入个人中心 → 点击"历史记录"
4. 应该看到：
   - ✅ **已确认** 的餐厅（绿色）
   - 👀 **浏览过** 的餐厅（灰色）

---

## 📚 详细文档

- 完整调试指南：`HISTORY_DEBUG_GUIDE.md`
- 修复总结：`HISTORY_FIX_SUMMARY.md`
- 环境变量配置：`ENV_TEMPLATE.md`

---

## 🆘 还是不行？

在控制台运行单独检查：

```javascript
// 检查Supabase连接
await window.historyDebug.checkConnection()

// 检查用户登录
await window.historyDebug.checkUserAuth()

// 检查数据库表
await window.historyDebug.checkTables()
```

查看具体哪一步出错，然后参考 `HISTORY_DEBUG_GUIDE.md` 解决。

---

**祝你修复顺利！** 🎉
