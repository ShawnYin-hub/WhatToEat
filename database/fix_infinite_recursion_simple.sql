-- =====================================================
-- 修复 RLS 策略无限递归问题（简化版）
-- 如果 fix_infinite_recursion.sql 还有问题，使用这个版本
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 删除所有可能导致递归的策略
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Members can view their rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;

-- 2. 删除可能存在的函数
DROP FUNCTION IF EXISTS is_room_member(UUID);
DROP FUNCTION IF EXISTS check_user_can_view_room(UUID);

-- 3. 创建最简单的策略：只允许 host 查看房间
-- 成员通过加入流程获取房间信息（通过 room_members 表）
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    -- 只允许 host 查看
    host_id = auth.uid()
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

-- 注意：这个版本只允许 host 直接查看房间
-- 成员需要通过 room_members 表来获取房间信息
-- 如果前端代码需要成员也能查看房间，我们需要修改前端逻辑
