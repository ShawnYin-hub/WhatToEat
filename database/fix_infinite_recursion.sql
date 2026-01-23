-- =====================================================
-- 修复 RLS 策略无限递归问题
-- 错误：infinite recursion detected in policy for relation "rooms"
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除所有可能导致递归的策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 2. 创建一个 SECURITY DEFINER 函数来检查用户是否是房间成员
-- 这个函数使用 SECURITY DEFINER，可以绕过 RLS，避免递归
CREATE OR REPLACE FUNCTION is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 获取当前用户 ID
  v_user_id := auth.uid();
  
  -- 如果没有用户，返回 false
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否是 host（直接查询，不触发 RLS）
  IF EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = p_room_id 
    AND r.host_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 检查是否是成员（使用 SECURITY DEFINER 绕过 RLS）
  IF EXISTS (
    SELECT 1 FROM public.room_members rm
    WHERE rm.room_id = p_room_id 
    AND rm.user_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION is_room_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_room_member(UUID) TO anon;

-- 3. 创建简化的 SELECT 策略（使用函数避免递归）
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 如果是 host，直接可以查看
    host_id = auth.uid()
    OR
    -- 如果是成员，使用 SECURITY DEFINER 函数检查（避免递归）
    is_room_member(id)
  );

-- 4. 创建其他必要的策略
-- INSERT 策略
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- UPDATE 策略（只有 host 可以更新）
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE 
  USING (host_id = auth.uid())
  WITH CHECK (host_id = auth.uid());

-- 5. 验证：检查策略是否正确创建
-- 执行后应该看到 3 个策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY policyname;
