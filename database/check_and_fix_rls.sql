-- =====================================================
-- 检查并修复 rooms 表的 RLS 策略（解决 42501 错误）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 步骤 1: 检查当前策略
SELECT 
  policyname, 
  cmd, 
  permissive,
  roles,
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY cmd, policyname;

-- 步骤 2: 检查 RLS 是否启用
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'rooms';

-- 步骤 3: 删除所有旧策略（如果需要重新开始）
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;
DROP FUNCTION IF EXISTS check_user_in_room(UUID, UUID);

-- 步骤 4: 创建辅助函数（用于 SELECT 策略）
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

-- 步骤 5: 授予函数执行权限
GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_in_room(UUID, UUID) TO anon;

-- 步骤 6: 创建 INSERT 策略（最重要！）
-- 确保用户已登录，且 host_id 等于当前用户 ID
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = host_id
  );

-- 步骤 7: 创建 SELECT 策略
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT 
  USING (check_user_in_room(id, auth.uid()));

-- 步骤 8: 创建 UPDATE 策略
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 步骤 9: 验证策略（再次检查）
SELECT 
  policyname, 
  cmd, 
  with_check 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY cmd, policyname;

-- 步骤 10: 测试查询（可选，用于验证）
-- 注意：这个查询会使用当前登录的用户
-- SELECT auth.uid() as current_user_id;
