-- =====================================================
-- 多人联机选餐功能：rooms 和 room_members 表
-- 在 Supabase Dashboard 的 SQL Editor 中执行
-- =====================================================

-- 1. 房间表
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 6 位邀请码
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting | voting | rolling | finished
  current_candidates JSONB, -- 存储候选餐厅列表（前 10 家）
  final_restaurant_name TEXT,
  decision_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 房间成员表
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB, -- 存储用户偏好（标签数组等）
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view rooms they are in" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Hosts can update own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can update own member record" ON room_members;

-- 创建策略：用户可以查看自己参与的房间（简化版，避免递归）
-- 只检查 host_id，成员的查看权限通过其他方式控制
CREATE POLICY "Users can view rooms they are in" ON rooms
  FOR SELECT USING (
    host_id = auth.uid()
    -- 注意：不在这里查询 room_members，避免与 room_members 策略形成循环
  );

-- 创建策略：用户可以创建房间（作为host）
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);

-- 创建策略：Host 可以更新自己的房间
CREATE POLICY "Hosts can update own rooms" ON rooms
  FOR UPDATE USING (host_id = auth.uid());

-- 创建策略：用户可以查看自己所在房间的成员（简化版，避免递归）
-- 1. 如果是房间的 host，可以查看所有成员
-- 2. 如果是成员自己，可以查看自己的记录
-- 3. 如果是某个房间的成员，可以查看该房间的所有成员（通过 rooms 表判断，不递归）
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

-- 创建策略：用户可以插入自己的成员记录
CREATE POLICY "Users can insert into room_members" ON room_members
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- 创建策略：用户可以更新自己的成员记录
CREATE POLICY "Users can update own member record" ON room_members
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_rooms_updated_at();
