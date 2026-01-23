-- =====================================================
-- 完整修复所有 RLS 策略问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- =====================================================
-- 1. 修复 rooms 表的策略（避免递归）
-- =====================================================

-- 删除所有旧的 rooms 策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- SELECT: 只检查 host_id，避免查询 room_members 造成循环
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    host_id = auth.uid()
  );

-- INSERT: 用户可以创建房间（作为 host）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- UPDATE: Host 可以更新自己的房间
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- =====================================================
-- 2. 修复 room_members 表的策略（避免递归）
-- =====================================================

-- 删除所有旧的 room_members 策略
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can insert into room_members" ON room_members;
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;

-- SELECT: 只通过 rooms.host_id 判断，不递归查询
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

-- INSERT: 用户可以插入自己的成员记录
CREATE POLICY "Users can insert into room_members" ON room_members
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- UPDATE: 用户可以更新自己的成员记录
CREATE POLICY "Users can update own member record" ON room_members
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. 确保 user_profiles 的策略正确（修复 400 错误）
-- =====================================================

-- 检查并修复 user_profiles 的策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
