# Supabase 数据库设置检查清单

## 📋 需要执行的 SQL 文件

### ✅ 第一步：基础表结构（必须执行）

**文件：** `database/schema.sql`

**包含的表：**
- `user_profiles` - 用户资料
- `search_history` - 搜索历史
- `view_history` - 浏览记录（看了但没选）
- `selection_results` - 选择结果（选了的）

**执行步骤：**
1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 复制 `database/schema.sql` 的**全部内容**
6. 粘贴到 SQL Editor
7. 点击 **Run** 执行

**检查是否已执行：**
- 在 Supabase Dashboard 左侧菜单点击 **Table Editor**
- 查看是否有以下表：
  - `user_profiles`
  - `search_history`
  - `view_history`
  - `selection_results`

如果这些表已经存在，说明你已经执行过了，**不需要重复执行**。

---

### ✅ 第二步：多人联机功能表（可选，如果要用"一起选"功能）

**文件：** `database/multiplayer_schema.sql`

**包含的表：**
- `rooms` - 房间表
- `room_members` - 房间成员表

**执行步骤：**
1. 在 Supabase Dashboard 的 **SQL Editor** 中
2. 复制 `database/multiplayer_schema.sql` 的**全部内容**
3. 粘贴并执行

**检查是否已执行：**
- 在 **Table Editor** 中查看是否有 `rooms` 和 `room_members` 表

---

## 🔍 验证数据库设置

### 检查表是否存在

在 Supabase Dashboard 的 **SQL Editor** 中执行以下查询：

```sql
-- 检查基础表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'search_history', 'view_history', 'selection_results')
ORDER BY table_name;

-- 检查多人联机表（可选）
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('rooms', 'room_members')
ORDER BY table_name;
```

### 检查 RLS 策略

```sql
-- 检查 selection_results 表的策略
SELECT * FROM pg_policies WHERE tablename = 'selection_results';

-- 检查 view_history 表的策略
SELECT * FROM pg_policies WHERE tablename = 'view_history';
```

---

## ⚠️ 常见问题

### 问题 1：保存选择结果失败

**可能原因：**
- `selection_results` 表不存在
- RLS 策略未正确设置
- 用户未登录

**解决方法：**
1. 确认已执行 `database/schema.sql`
2. 检查 RLS 策略是否正确（应该允许用户插入自己的记录）
3. 在浏览器控制台查看错误信息

### 问题 2：历史记录显示不正确

**可能原因：**
- 数据已保存，但去重逻辑有问题
- 表结构不匹配

**解决方法：**
1. 在 Supabase Dashboard 的 **Table Editor** 中查看 `selection_results` 表
2. 确认是否有新记录
3. 检查 `restaurant_name` 字段是否正确

---

## 📝 快速检查清单

- [ ] 已执行 `database/schema.sql`
- [ ] 在 Table Editor 中能看到 `selection_results` 表
- [ ] 在 Table Editor 中能看到 `view_history` 表
- [ ] 如果要用"一起选"功能，已执行 `database/multiplayer_schema.sql`
- [ ] 测试保存选择结果功能，在 Supabase 中能看到新记录

---

## 🚀 执行建议

**如果你不确定是否已执行：**

1. **最安全的方法：** 直接执行 `database/schema.sql`
   - 使用了 `CREATE TABLE IF NOT EXISTS`，不会重复创建
   - 使用了 `DROP POLICY IF EXISTS`，不会报错
   - 可以安全地重复执行

2. **检查现有表：**
   - 在 Supabase Dashboard 的 **Table Editor** 中查看
   - 如果表已存在，说明已经执行过了

3. **如果表已存在但功能不工作：**
   - 可能是 RLS 策略问题
   - 重新执行 `database/schema.sql` 中的策略部分即可
