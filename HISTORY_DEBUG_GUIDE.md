# 历史记录调试指南 🔍

## 问题描述

历史记录功能不工作，可能导致：
- AI推荐无法正常工作
- 用户画像无法生成
- 统计数据不准确

## 快速诊断

### 方法1：使用浏览器控制台（推荐）

1. **启动开发服务器**
```bash
npm run dev
```

2. **打开浏览器**
访问 http://localhost:5173/

3. **打开开发者工具**
- Windows: 按 `F12` 或 `Ctrl+Shift+I`
- Mac: 按 `Cmd+Option+I`

4. **切换到Console标签**

5. **运行诊断命令**
```javascript
// 完整诊断
await window.historyDebug.runFullDiagnostic()
```

### 诊断结果解读

#### ✅ 全部成功
```
🔍 检查Supabase连接...
✅ Supabase 配置正常
🔍 检查用户登录状态...
✅ 用户已登录: your@email.com
🔍 检查数据库表...
✅ search_history 表存在
✅ view_history 表存在
✅ selection_results 表存在
🔍 测试保存搜索历史...
✅ 保存搜索历史成功
🔍 测试保存选择结果...
✅ 保存选择结果成功
📊 搜索历史数量: 5
📊 选择结果数量: 3
✅ 诊断完成！
```

#### ❌ Supabase未配置
```
❌ Supabase URL 未配置！
❌ 诊断失败：Supabase 未正确配置
请创建 .env 文件并配置：
VITE_SUPABASE_URL=你的Supabase URL
VITE_SUPABASE_ANON_KEY=你的Supabase ANON KEY
```

**解决方案**：配置Supabase（见下方）

#### ⚠️ 用户未登录
```
⚠️ 诊断警告：用户未登录
历史记录功能需要用户登录。请：
1. 注册账号
2. 登录
3. 重新测试
```

**解决方案**：注册并登录账号

#### ❌ 数据库表不存在
```
❌ search_history 表不存在或无权访问
❌ view_history 表不存在或无权访问
❌ selection_results 表不存在或无权访问
```

**解决方案**：执行数据库SQL（见下方）

---

## 完整解决方案

### 步骤1：配置Supabase

#### 1.1 获取Supabase凭据

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目（或创建新项目）
3. 点击左侧 **Settings** > **API**
4. 复制以下信息：
   - **Project URL**（例如：https://xxxxx.supabase.co）
   - **anon public** key

#### 1.2 创建环境变量文件

在项目根目录创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **注意**：
- 将 `https://xxxxx.supabase.co` 替换为你的实际URL
- 将 `eyJhbGci...` 替换为你的实际key
- `.env` 文件已在 `.gitignore` 中，不会被提交

#### 1.3 重启开发服务器

```bash
# 停止服务器（Ctrl+C）
# 重新启动
npm run dev
```

---

### 步骤2：执行数据库SQL

#### 2.1 打开SQL Editor

1. 在Supabase Dashboard中
2. 点击左侧 **SQL Editor**
3. 点击 **New query**

#### 2.2 执行完整SQL

复制并执行 `database/schema.sql` 中的完整SQL，或使用以下快捷版本：

```sql
-- =====================================================
-- 创建历史记录表
-- =====================================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_criteria JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 浏览记录表（抽取出来但未确认）
CREATE TABLE IF NOT EXISTS view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  rating TEXT,
  distance INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 选择结果表（已确认）
CREATE TABLE IF NOT EXISTS selection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_view_history_user_id ON view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_view_history_timestamp ON view_history(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_selection_results_user_id ON selection_results(user_id);
CREATE INDEX IF NOT EXISTS idx_selection_results_timestamp ON selection_results(timestamp DESC);

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE selection_results ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
DROP POLICY IF EXISTS "Users can view own view history" ON view_history;
DROP POLICY IF EXISTS "Users can insert own view history" ON view_history;
DROP POLICY IF EXISTS "Users can view own selection results" ON selection_results;
DROP POLICY IF EXISTS "Users can insert own selection results" ON selection_results;

-- 创建策略
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own search history" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own search history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own view history" ON view_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own view history" ON view_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own selection results" ON selection_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own selection results" ON selection_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3 验证表创建

在SQL Editor中执行：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'search_history', 'view_history', 'selection_results');
```

应该看到4个表。

---

### 步骤3：注册并登录

1. 在应用中点击 **注册**
2. 输入邮箱和密码
3. 登录成功

---

### 步骤4：测试历史记录

1. **测试搜索和浏览**
   - 选择位置
   - 选择菜系
   - 点击"帮我选"
   - 查看抽取的餐厅（这会保存到浏览记录）

2. **测试确认选择**
   - 点击"就吃这家"（保存到选择结果）
   - 或点击"带我导航"（也保存到选择结果）

3. **查看历史记录**
   - 进入个人中心
   - 点击"历史记录"
   - 应该看到：
     - ✅ **已确认**：点击了"就吃这家"或"带我导航"的餐厅（绿色）
     - 👀 **浏览过**：抽取出来但未确认的餐厅（灰色）

---

## 高级诊断

### 单独检查各项

```javascript
// 检查Supabase连接
await window.historyDebug.checkConnection()

// 检查用户登录
await window.historyDebug.checkUserAuth()

// 检查数据库表
await window.historyDebug.checkTables()

// 查看历史记录数量
const user = await window.historyDebug.checkUserAuth()
if (user) {
  await window.historyDebug.checkHistoryCounts(user.id)
}
```

### 直接查询数据库

在Supabase SQL Editor中：

```sql
-- 查看最近的搜索历史
SELECT * FROM search_history 
ORDER BY timestamp DESC 
LIMIT 10;

-- 查看最近的浏览记录
SELECT * FROM view_history 
ORDER BY viewed_at DESC 
LIMIT 10;

-- 查看最近的选择结果
SELECT * FROM selection_results 
ORDER BY timestamp DESC 
LIMIT 10;

-- 查看特定用户的历史记录数量
SELECT 
  (SELECT COUNT(*) FROM search_history WHERE user_id = 'your-user-id') as search_count,
  (SELECT COUNT(*) FROM view_history WHERE user_id = 'your-user-id') as view_count,
  (SELECT COUNT(*) FROM selection_results WHERE user_id = 'your-user-id') as selection_count;
```

---

## 历史记录功能说明

### 两种历史记录

#### 1. 浏览记录（view_history）👀
- **触发时机**：老虎机抽取完成，显示餐厅时
- **保存内容**：餐厅名称、分类、地址、评分、距离
- **特点**：
  - 所有抽取的餐厅都会记录
  - 包括"换一家"抽取的餐厅
  - 灰色标记显示
  - 帮助AI了解你看过哪些选项

#### 2. 选择结果（selection_results）✅
- **触发时机**：
  - 点击"就吃这家"按钮
  - 点击"带我导航"按钮
- **保存内容**：餐厅名称、分类、地址
- **特点**：
  - 只记录最终确认的选择
  - 绿色标记显示
  - 用于生成AI画像和统计

### 历史记录在个人中心的展示

```
历史记录
├── ✅ 已确认 (3)
│   ├── 🟢 川味火锅店 - 川湘菜
│   ├── 🟢 星巴克咖啡 - 咖啡
│   └── 🟢 麦当劳 - 汉堡
└── 👀 浏览过 (8)
    ├── ⚪ 海底捞 - 火锅 ⭐4.5 · 500m
    ├── ⚪ 肯德基 - 汉堡 ⭐4.2 · 300m
    └── ...
```

---

## 常见问题

### Q1: 控制台显示"historyDebug is not defined"

**原因**：诊断工具只在开发环境加载

**解决**：
```bash
# 确保使用开发模式
npm run dev
```

### Q2: 历史记录一直是空的

**可能原因**：
1. ❌ Supabase未配置
2. ❌ 用户未登录
3. ❌ 数据库表未创建
4. ❌ RLS策略未正确设置

**解决**：运行完整诊断
```javascript
await window.historyDebug.runFullDiagnostic()
```

### Q3: 保存历史记录时报错

查看浏览器控制台错误信息：

- `"relation view_history does not exist"` → 数据库表未创建，执行SQL
- `"row-level security policy"` → RLS策略问题，重新执行策略SQL
- `"Failed to fetch"` → Supabase连接问题，检查网络和配置

### Q4: AI推荐/画像无法生成

**原因**：需要至少10条选择记录

**解决**：
1. 多使用几次"帮我选"功能
2. 点击"就吃这家"或"带我导航"确认选择
3. 累积10-20条记录后再试

---

## 检查清单

部署前检查：

- [ ] `.env` 文件已创建并配置
- [ ] Supabase连接测试成功
- [ ] 数据库表已创建（4个表）
- [ ] RLS策略已配置
- [ ] 用户可以注册和登录
- [ ] 搜索历史正常保存
- [ ] 浏览记录正常保存
- [ ] 选择结果正常保存
- [ ] 个人中心能显示历史记录
- [ ] AI画像可以生成

---

## 技术细节

### 数据流程

```
用户操作
    ↓
点击"帮我选"
    ↓
搜索餐厅 → 保存搜索历史(search_history)
    ↓
老虎机抽取完成
    ↓
显示餐厅 → 保存浏览记录(view_history)
    ↓
用户选择操作
    ├→ 点击"换一家" → 重新抽取 → 保存新的浏览记录
    ├→ 点击"就吃这家" → 保存选择结果(selection_results)
    └→ 点击"带我导航" → 保存选择结果(selection_results)
```

### 代码位置

- 诊断工具：`src/utils/historyDebug.js`
- 数据库服务：`src/services/databaseService.js`
- 选择按钮：`src/components/SelectButton.jsx`
- 结果弹窗：`src/components/ResultModal.jsx`
- 个人中心：`src/components/ProfilePage.jsx`

---

**祝你调试顺利！** 🎉

如有任何问题，请查看浏览器控制台的详细错误信息。
