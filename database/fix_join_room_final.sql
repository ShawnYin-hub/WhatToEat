-- =====================================================
-- 修复加入房间时的权限问题（最终方案）
-- 问题：用户需要查看房间才能加入，但策略要求必须是成员才能查看
-- 解决方案：允许所有认证用户查看房间（code 是公开的，用于加入）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除现有的 SELECT 策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;

-- 2. 创建新的 SELECT 策略
-- 允许所有认证用户查看房间（因为 code 是公开的，用于加入流程）
-- 这样用户可以：
--   1. 通过 code 查询房间（加入流程）
--   2. 查看自己作为 host 的房间
--   3. 查看自己作为成员的房间
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 允许所有认证用户查看（code 是公开的，用于加入）
    -- 这样用户可以通过 code 查询房间来加入
    auth.uid() IS NOT NULL
  );

-- 3. 验证策略
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY policyname;
