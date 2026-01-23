-- =====================================================
-- 简单修复 rooms 表的 INSERT 策略（解决 403 错误）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 删除旧的 INSERT 策略（如果存在）
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;

-- 创建 INSERT 策略：用户可以创建房间（作为host）
-- 简单直接的条件，确保能正常工作
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = host_id
  );

-- 验证策略是否存在
-- SELECT policyname, cmd, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'rooms' AND cmd = 'INSERT';
