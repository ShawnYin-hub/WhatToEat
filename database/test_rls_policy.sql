-- =====================================================
-- 测试 RLS 策略是否正确
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 检查当前用户（如果已登录）
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. 检查 rooms 表的所有策略
SELECT 
  policyname, 
  cmd, 
  permissive,
  roles,
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY cmd, policyname;

-- 3. 检查是否有 INSERT 策略
SELECT 
  policyname,
  with_check
FROM pg_policies 
WHERE tablename = 'rooms' 
  AND cmd = 'INSERT';

-- 4. 如果 INSERT 策略不存在，会看到空结果
-- 如果存在，应该看到 "Users can create rooms" 策略

-- 5. 检查函数是否存在
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_user_in_room';
