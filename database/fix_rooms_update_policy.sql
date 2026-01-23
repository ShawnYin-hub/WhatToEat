-- =====================================================
-- 修复 rooms 表的 UPDATE 权限问题（解决 CORS PATCH 错误）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 删除旧的 UPDATE 策略
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 重新创建 UPDATE 策略，确保 USING 和 WITH CHECK 都正确
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 验证策略是否正确创建
-- SELECT * FROM pg_policies WHERE tablename = 'rooms';
