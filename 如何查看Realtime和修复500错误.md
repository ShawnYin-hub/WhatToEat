# 如何查看 Realtime 和修复 500 错误

## 问题说明

你遇到了 `GET /rest/v1/rooms?select=*&code=eq.44QNES 500 (Internal Server Error)` 错误，这是因为 RLS（Row Level Security）策略冲突导致的。

## 第一步：修复 500 错误

### 在 Supabase 中执行修复脚本

1. **登录 Supabase Dashboard**
   - 打开你的项目：https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单点击 **SQL Editor**
   - 点击 **New query**

3. **执行修复脚本**
   - 打开文件：`database/fix_500_error_rooms.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor 中
   - 点击 **Run** 或按 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **验证执行结果**
   - 应该看到 "Success. No rows returned" 或类似的成功消息
   - 如果有错误，请告诉我具体的错误信息

### 如果还有问题，尝试这个更简单的版本

如果上面的脚本还有问题，可以尝试这个更保守的版本：

```sql
-- 删除所有 rooms 表的策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 重新创建策略（简化版）
-- SELECT: 只允许 host 查看（成员通过其他方式加入）
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (host_id = auth.uid());

-- INSERT
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- UPDATE
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
```

**注意**：这个版本只允许 host 查看房间，成员需要通过加入流程来获取房间信息。如果这个版本可以工作，我们再优化让成员也能查看。

## 第二步：查看 Realtime 是否启用

### 方法 1：通过 Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 打开你的项目

2. **进入 Database > Replication**
   - 左侧菜单点击 **Database**
   - 点击 **Replication**（在 Database 子菜单中）

3. **查看 rooms 表的 Realtime 状态**
   - 在列表中找到 `rooms` 表
   - 查看 **Realtime** 列的状态
   - 如果显示 **Enabled**（绿色），说明已启用
   - 如果显示 **Disabled**（灰色），点击开关启用

### 方法 2：通过 SQL 查询

在 SQL Editor 中执行：

```sql
-- 查看所有表的 Realtime 状态
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'rooms'
    ) THEN 'Enabled'
    ELSE 'Disabled'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'rooms';
```

### 方法 3：通过 API 测试

在浏览器控制台执行：

```javascript
// 测试 Realtime 连接
const { createClient } = supabase;
const supabaseClient = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

const channel = supabaseClient
  .channel('test-room')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rooms'
  }, (payload) => {
    console.log('Realtime 工作正常！', payload);
  })
  .subscribe();

// 如果连接成功，会看到 "SUBSCRIBED" 状态
console.log('Channel status:', channel.state);
```

## 第三步：启用 Realtime（如果需要）

如果 Realtime 未启用：

### 方法 1：通过 Dashboard

1. 进入 **Database > Replication**
2. 找到 `rooms` 表
3. 点击 **Realtime** 列的开关，启用它

### 方法 2：通过 SQL

```sql
-- 启用 rooms 表的 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
```

## 第四步：测试修复

1. **刷新你的应用页面**
2. **尝试加入房间**
   - 输入房间码
   - 点击加入
3. **检查浏览器控制台**
   - 应该不再有 500 错误
   - 如果还有错误，请告诉我具体的错误信息

## 常见问题

### Q: 执行 SQL 后还是 500 错误？

**A:** 可能的原因：
1. 策略缓存问题 - 等待几秒钟后重试
2. 用户权限问题 - 确保用户已登录
3. 表结构问题 - 检查 `rooms` 表是否存在

**解决方案：**
```sql
-- 检查当前策略
SELECT * FROM pg_policies WHERE tablename = 'rooms';

-- 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'rooms';
```

### Q: Realtime 显示 Enabled 但还是不同步？

**A:** 可能的原因：
1. 客户端未正确订阅
2. 网络连接问题
3. 认证问题

**解决方案：**
- 检查浏览器控制台的网络请求
- 确认用户已登录
- 检查 Supabase 项目的 API 密钥是否正确

### Q: 如何查看详细的错误信息？

**A:** 在 Supabase Dashboard 中：
1. 进入 **Logs** > **Postgres Logs**
2. 查看最近的错误日志
3. 或者进入 **Database** > **Logs** 查看数据库日志

## 需要帮助？

如果问题还没解决，请提供：
1. Supabase SQL Editor 执行后的错误信息（如果有）
2. 浏览器控制台的完整错误信息
3. Supabase Dashboard 中 Logs 的相关错误
