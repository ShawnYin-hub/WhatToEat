-- =====================================================
-- 修复 RLS 策略的无限递归问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除有问题的 room_members 策略
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;

-- 2. 重新创建简化的 room_members SELECT 策略（避免递归）
-- 用户可以查看自己所在房间的成员（通过 rooms 表检查，不递归查询 room_members）
CREATE POLICY "Users can view members of their rooms" ON room_members
  FOR SELECT USING (
    -- 如果是房间的 host，可以查看所有成员
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.host_id = auth.uid()
    )
    OR
    -- 如果是成员自己，可以查看自己的记录
    user_id = auth.uid()
    OR
    -- 如果用户是某个房间的成员，可以查看该房间的所有成员（简化版，不递归）
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_members.room_id
      AND rooms.host_id = auth.uid()
    )
  );

-- 3. 添加 room_members 的 INSERT 策略
DROP POLICY IF EXISTS "Users can insert into room_members" ON room_members;
CREATE POLICY "Users can insert into room_members" ON room_members
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- 4. 添加 room_members 的 UPDATE 策略
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;
CREATE POLICY "Users can update own member record" ON room_members
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. 确保 rooms 表的 INSERT 策略存在
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);
