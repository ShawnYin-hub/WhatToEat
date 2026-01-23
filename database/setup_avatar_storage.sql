-- =====================================================
-- Supabase 头像存储配置 - 快速部署版本
-- 在 Supabase Dashboard 的 SQL Editor 中直接执行此文件
-- =====================================================

-- 1. 创建 avatars bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧的 Storage 策略（如果存在）
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 3. 创建新的 Storage 策略

-- 3.1 允许用户上传自己的头像
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3.2 允许用户更新自己的头像
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3.3 允许用户删除自己的头像
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3.4 允许所有人查看公开的头像
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- =====================================================
-- 配置完成！
-- =====================================================
-- 如果执行成功，你应该看到：
-- - 1个 bucket 已创建或已存在
-- - 4个 policy 已创建
--
-- 接下来：
-- 1. 进入 Storage 页面确认 avatars bucket 存在
-- 2. 检查 Policies 标签，确认4个策略都已创建
-- 3. 在应用中测试头像上传功能
-- =====================================================
