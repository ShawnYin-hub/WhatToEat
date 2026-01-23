-- =====================================================
-- 修复 rooms 表的 SELECT 策略，允许成员查看房间
-- 解决 500 错误：GET /rest/v1/rooms?select=*&code=eq.XXX
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 删除可能冲突的策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;

-- 创建新的 SELECT 策略，允许 host 和成员都能查看房间
-- 使用 SECURITY DEFINER 函数来避免递归问题
CREATE OR REPLACE FUNCTION check_user_can_view_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- 检查是否是 host
  IF EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = p_room_id 
    AND r.host_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 检查是否是成员
  IF EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id 
    AND rm.user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION check_user_can_view_room TO authenticated;

-- 创建 SELECT 策略（使用函数避免递归）
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 如果是 host，直接可以查看
    host_id = auth.uid()
    OR
    -- 如果是成员，使用函数检查（避免递归）
    check_user_can_view_room(id)
  );

-- 如果上面的策略还有问题，使用更简单的方法：
-- 直接允许成员通过 room_members 表查看（但要注意避免递归）
-- 先删除上面的策略，然后创建这个：
/*
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;

CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    host_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
      AND rm.user_id = auth.uid()
    )
  );
*/
