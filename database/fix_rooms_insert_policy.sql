-- =====================================================
-- 修复 rooms 表的 INSERT 权限问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can insert own rooms" ON rooms;

-- 创建策略：用户可以创建房间（作为host）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- 如果需要，也可以允许用户插入自己的房间记录
-- 这个策略确保只有认证用户才能创建房间，且host_id必须是自己的uid
