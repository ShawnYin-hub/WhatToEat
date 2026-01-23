-- =====================================================
-- 紧急修复：解决 rooms 表查询 500 错误
-- 问题：成员无法查看房间（RLS 策略冲突）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除所有可能冲突的 SELECT 策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;

-- 2. 创建简化的 SELECT 策略（避免递归，直接查询）
-- 这个策略允许 host 和成员都能查看房间
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 如果是 host，可以查看
    host_id = auth.uid()
    OR
    -- 如果是成员，也可以查看（直接查询 room_members，避免递归）
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
      AND rm.user_id = auth.uid()
    )
  );

-- 3. 确保其他策略也存在
-- INSERT 策略
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- UPDATE 策略（只有 host 可以更新）
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());
