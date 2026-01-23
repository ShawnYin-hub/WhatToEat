-- =====================================================
-- 修复 rooms 表的 RLS 策略无限递归问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 删除所有旧的 rooms 策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 1. 创建简化的 SELECT 策略（避免递归）
-- 用户可以查看自己作为 host 的房间，或者通过 room_members 表查看（但不递归查询）
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 如果是 host，直接可以查看
    host_id = auth.uid()
    -- 注意：不在这里查询 room_members，避免循环
    -- 成员查看房间的权限通过 room_members 表的策略间接控制
  );

-- 2. 创建 INSERT 策略
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- 3. 创建 UPDATE 策略
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 4. 确保 room_members 的策略也是简化的（避免循环）
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can insert into room_members" ON room_members;
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;

-- room_members SELECT: 只通过 rooms.host_id 判断，不递归
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
  );

-- room_members INSERT
CREATE POLICY "Users can insert into room_members" ON room_members
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- room_members UPDATE
CREATE POLICY "Users can update own member record" ON room_members
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
