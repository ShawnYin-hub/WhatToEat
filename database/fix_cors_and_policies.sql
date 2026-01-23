-- =====================================================
-- 修复 CORS 和 RLS 策略问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- =====================================================
-- 1. 确保 rooms 表的所有策略都正确
-- =====================================================

-- 删除所有旧的 rooms 策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- SELECT 策略
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (host_id = auth.uid());

-- INSERT 策略
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- UPDATE 策略（关键：确保 USING 和 WITH CHECK 都正确）
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- =====================================================
-- 2. 确保 room_members 表的策略正确
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can insert into room_members" ON room_members;
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;

CREATE POLICY "Users can view members of their rooms" ON room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.host_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert into room_members" ON room_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own member record" ON room_members
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. 验证策略
-- =====================================================
-- 执行以下查询来验证策略是否正确创建：
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('rooms', 'room_members')
-- ORDER BY tablename, policyname;
