-- =====================================================
-- 详细修复 INSERT 策略（解决 42501 错误）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除旧的 INSERT 策略
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;

-- 2. 创建更宽松的 INSERT 策略（用于调试）
-- 先允许所有已登录用户创建房间，看看是否能工作
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 3. 如果上面的策略能工作，再改为更严格的版本：
-- DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
-- CREATE POLICY "Users can create rooms" ON rooms
--   FOR INSERT 
--   WITH CHECK (
--     auth.uid() IS NOT NULL 
--     AND auth.uid() = host_id
--   );

-- 4. 验证策略
SELECT 
  policyname, 
  cmd, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms' 
  AND cmd = 'INSERT';
