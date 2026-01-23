-- =====================================================
-- 允许房间成员也能触发"一起选"功能
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 修改 update_room_status 函数，允许房间成员也能更新状态
-- 但只允许更新状态为 'rolling'（开始选餐），其他状态仍需要 host 权限
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
DECLARE
  is_host BOOLEAN;
  is_member BOOLEAN;
BEGIN
  -- 检查用户是否是房间的 host
  SELECT EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = p_room_id 
    AND r.host_id = auth.uid()
  ) INTO is_host;

  -- 检查用户是否是房间的成员
  SELECT EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = p_room_id 
    AND rm.user_id = auth.uid()
  ) INTO is_member;

  -- 权限检查：
  -- 1. 如果是 host，可以更新任何状态
  -- 2. 如果是成员，只能更新状态为 'rolling'（触发一起选）
  -- 3. 其他情况（如更新 final_restaurant_name, decision_reason）仍需要 host 权限
  IF NOT is_host AND NOT is_member THEN
    RAISE EXCEPTION 'User is not a member of this room';
  END IF;

  -- 如果是成员但不是 host，只能更新状态为 'rolling'
  IF NOT is_host AND is_member AND p_status != 'rolling' THEN
    RAISE EXCEPTION 'Only the room host can update status to %', p_status;
  END IF;

  -- 如果是成员但不是 host，不允许更新 final_restaurant_name 和 decision_reason
  -- 这些字段只能由 host 在选餐流程完成后更新
  IF NOT is_host AND is_member AND (p_final_restaurant_name IS NOT NULL OR p_decision_reason IS NOT NULL) THEN
    RAISE EXCEPTION 'Only the room host can update final restaurant name and decision reason';
  END IF;

  -- 更新房间（使用表别名）
  UPDATE rooms r
  SET 
    status = p_status,
    final_restaurant_name = CASE 
      WHEN is_host THEN COALESCE(p_final_restaurant_name, r.final_restaurant_name)
      ELSE r.final_restaurant_name
    END,
    decision_reason = CASE 
      WHEN is_host THEN COALESCE(p_decision_reason, r.decision_reason)
      ELSE r.decision_reason
    END,
    current_candidates = CASE 
      WHEN is_host THEN COALESCE(p_current_candidates, r.current_candidates)
      ELSE r.current_candidates
    END,
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

-- 确保权限已授予
GRANT EXECUTE ON FUNCTION update_room_status TO authenticated;

-- 同时需要修改 rooms 表的 RLS 策略，让成员也能查看房间
-- 注意：这个策略可能已经存在，但我们需要确保它正确工作
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;

CREATE POLICY "Members can view their rooms" ON rooms
  FOR SELECT USING (
    -- 如果是 host，可以查看
    host_id = auth.uid()
    OR
    -- 如果是成员，也可以查看
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
      AND rm.user_id = auth.uid()
    )
  );
