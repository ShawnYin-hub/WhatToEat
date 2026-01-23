-- =====================================================
-- 调试 INSERT 策略问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 检查当前用户（如果已登录）
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- 2. 查看 INSERT 策略的详细条件
SELECT 
  policyname, 
  cmd, 
  permissive,
  roles,
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms' 
  AND cmd = 'INSERT';

-- 3. 测试策略条件（手动测试）
-- 注意：需要替换为实际的用户ID
-- SELECT 
--   auth.uid() IS NOT NULL as check1,
--   auth.uid() = 'e343e309-2305-4493-9438-5b8a96715078'::uuid as check2;

-- 4. 检查 rooms 表的结构
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rooms'
ORDER BY ordinal_position;

-- 5. 尝试手动插入测试（需要替换用户ID）
-- 注意：这个操作会失败，但可以看到具体错误
-- INSERT INTO rooms (code, host_id, status)
-- VALUES ('TEST01', 'e343e309-2305-4493-9438-5b8a96715078'::uuid, 'waiting');
