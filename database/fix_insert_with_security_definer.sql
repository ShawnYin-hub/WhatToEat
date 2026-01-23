-- =====================================================
-- 使用 SECURITY DEFINER 函数绕过 RLS 问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除旧的策略和函数
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP FUNCTION IF EXISTS create_room(UUID, TEXT, TEXT);

-- 2. 创建 SECURITY DEFINER 函数来创建房间
-- 这个函数会以创建者的权限执行，绕过 RLS
CREATE OR REPLACE FUNCTION create_room(
  p_host_id UUID,
  p_code TEXT,
  p_status TEXT DEFAULT 'waiting'
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  host_id UUID,
  status TEXT,
  current_candidates JSONB,
  final_restaurant_name TEXT,
  decision_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  -- 验证用户是否登录
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- 验证 host_id 是否匹配当前用户
  IF auth.uid() != p_host_id THEN
    RAISE EXCEPTION 'host_id must match current user';
  END IF;
  
  -- 插入房间
  INSERT INTO rooms (code, host_id, status)
  VALUES (p_code, p_host_id, p_status)
  RETURNING rooms.id INTO v_room_id;
  
  -- 返回创建的房间
  RETURN QUERY
  SELECT 
    r.id,
    r.code,
    r.host_id,
    r.status,
    r.current_candidates,
    r.final_restaurant_name,
    r.decision_reason,
    r.created_at,
    r.updated_at
  FROM rooms r
  WHERE r.id = v_room_id;
END;
$$;

-- 3. 授予执行权限
GRANT EXECUTE ON FUNCTION create_room(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_room(UUID, TEXT, TEXT) TO anon;

-- 4. 仍然保留 INSERT 策略（作为备用）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = host_id
  );

-- 5. 验证
SELECT 
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_room';
