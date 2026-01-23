-- =====================================================
-- 测试并修复 rooms 表的 RLS 策略
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 检查当前策略
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY cmd, policyname;

-- 2. 删除所有旧策略（如果需要）
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 3. 重新创建 INSERT 策略（最简单版本）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = host_id
  );

-- 4. 重新创建 SELECT 策略（使用函数）
DROP FUNCTION IF EXISTS check_user_in_room(UUID, UUID);

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
  
  -- 检查是否是成员
  SELECT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id AND rm.user_id = p_user_id
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO anon;

CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT 
  USING (check_user_in_room(id, auth.uid()));

-- 5. 创建 UPDATE 策略
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 6. 再次检查策略
SELECT 
  policyname, 
  cmd, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY cmd, policyname;
