-- =====================================================
-- 完整修复 rooms 表的 RLS 策略（解决 403/406 错误）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除所有旧的策略和函数
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;
DROP FUNCTION IF EXISTS check_user_in_room(UUID, UUID);

-- 2. 创建辅助函数（避免递归，使用 SECURITY DEFINER）
CREATE OR REPLACE FUNCTION check_user_in_room(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_host BOOLEAN;
  is_member BOOLEAN;
BEGIN
  -- 检查是否是 host
  SELECT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = p_room_id AND r.host_id = p_user_id
  ) INTO is_host;
  
  IF is_host THEN
    RETURN TRUE;
  END IF;
  
  -- 检查是否是成员（使用表别名避免递归）
  SELECT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id AND rm.user_id = p_user_id
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- 3. 授予执行权限
GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO anon;

-- 4. 创建 SELECT 策略：用户可以查看自己参与的房间
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT 
  USING (check_user_in_room(id, auth.uid()));

-- 5. 创建 INSERT 策略：用户可以创建房间（作为host）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- 6. 创建 UPDATE 策略：Host 可以更新自己的房间
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 7. 验证策略
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'rooms'
-- ORDER BY policyname;
