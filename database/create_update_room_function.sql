-- =====================================================
-- 创建 RPC 函数来更新房间状态（绕过 CORS PATCH 问题）
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 创建函数：更新房间状态
CREATE OR REPLACE FUNCTION update_room_status(
  p_room_id UUID,
  p_status TEXT,
  p_final_restaurant_name TEXT DEFAULT NULL,
  p_decision_reason TEXT DEFAULT NULL,
  p_current_candidates JSONB DEFAULT NULL
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
BEGIN
  -- 检查用户是否是房间的 host（使用表别名避免歧义）
  IF NOT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = p_room_id 
    AND r.host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the room host can update the room status';
  END IF;

  -- 更新房间（使用表别名）
  UPDATE rooms r
  SET 
    status = p_status,
    final_restaurant_name = COALESCE(p_final_restaurant_name, r.final_restaurant_name),
    decision_reason = COALESCE(p_decision_reason, r.decision_reason),
    current_candidates = COALESCE(p_current_candidates, r.current_candidates),
    updated_at = NOW()
  WHERE r.id = p_room_id;

  -- 返回更新后的房间数据
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
  WHERE r.id = p_room_id;
END;
$$;

-- 授予执行权限给认证用户
GRANT EXECUTE ON FUNCTION update_room_status TO authenticated;

-- 创建函数：更新房间候选餐厅
CREATE OR REPLACE FUNCTION update_room_candidates(
  p_room_id UUID,
  p_candidates JSONB
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
BEGIN
  -- 检查用户是否是房间的 host（使用表别名避免歧义）
  IF NOT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = p_room_id 
    AND r.host_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the room host can update the room candidates';
  END IF;

  -- 更新候选餐厅（使用表别名）
  UPDATE rooms r
  SET 
    current_candidates = p_candidates,
    updated_at = NOW()
  WHERE r.id = p_room_id;

  -- 返回更新后的房间数据
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
  WHERE r.id = p_room_id;
END;
$$;

-- 授予执行权限给认证用户
GRANT EXECUTE ON FUNCTION update_room_candidates TO authenticated;
