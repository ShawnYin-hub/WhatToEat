# Supabase Storage 配置指南

## 步骤1：在Supabase Dashboard中创建Storage Bucket

### 方法一：通过Dashboard手动创建（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧菜单的 **Storage**
4. 点击 **New bucket** 按钮
5. 填写以下信息：
   - **Name**: `avatars`
   - **Public bucket**: ✅ 勾选（允许公开访问）
6. 点击 **Create bucket**

### 方法二：通过SQL创建（如果有超级用户权限）

在 Supabase SQL Editor 中执行以下SQL：

```sql
-- 创建 avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

## 步骤2：配置Storage策略

在 Supabase SQL Editor 中执行以下SQL来设置访问策略：

```sql
-- 删除旧的 Storage 策略（如果存在）
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 允许用户上传自己的头像
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户更新自己的头像
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户删除自己的头像
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许所有人查看公开的头像
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
```

## 步骤3：验证配置

### 通过Dashboard验证

1. 进入 **Storage** > **avatars**
2. 点击 **Policies** 标签
3. 确认以下策略已创建：
   - ✅ Users can upload own avatar (INSERT)
   - ✅ Users can update own avatar (UPDATE)
   - ✅ Users can delete own avatar (DELETE)
   - ✅ Anyone can view avatars (SELECT)

### 通过应用测试

1. 登录应用
2. 进入个人中心
3. 点击"上传头像"按钮
4. 选择一张图片（JPG或PNG，小于2MB）
5. 上传成功后，头像应该立即显示

## 文件结构说明

上传的头像文件将按以下结构存储：

```
avatars/
  ├── {user_id_1}/
  │   └── avatar_1234567890.jpg
  ├── {user_id_2}/
  │   └── avatar_1234567891.png
  └── ...
```

- 每个用户的头像存储在以其 `user_id` 命名的文件夹中
- 文件名格式：`avatar_{timestamp}.{ext}`
- 上传新头像时，旧头像会自动删除

## 图片处理说明

前端会自动处理图片：

- ✅ 自动缩放到 200x200 像素（保持宽高比）
- ✅ 压缩质量设置为 80%
- ✅ 支持 JPG 和 PNG 格式
- ✅ 文件大小限制：2MB

## 故障排除

### 问题1：上传失败 - "Bucket not found"

**解决方案**：
- 确保已在Dashboard中创建了 `avatars` bucket
- 检查bucket名称是否正确（必须是 `avatars`）

### 问题2：上传失败 - "Permission denied"

**解决方案**：
- 确保已执行步骤2中的所有SQL策略
- 确保用户已登录（auth.uid() 不为空）
- 检查bucket的 `public` 设置是否为 `true`

### 问题3：头像无法显示

**解决方案**：
- 检查 `user_profiles` 表中的 `avatar_url` 字段是否正确
- 确保 "Anyone can view avatars" 策略已创建
- 检查浏览器控制台是否有CORS错误

### 问题4：文件太大

**解决方案**：
- 前端已设置2MB限制，如果需要调整：
  ```javascript
  // 在 ProfilePage.jsx 中修改
  if (file.size > 2 * 1024 * 1024) {  // 改为你需要的大小
    alert(t('profile.fileTooLarge'))
    return
  }
  ```

## 安全说明

1. **用户隔离**：每个用户只能上传/修改/删除自己的头像
2. **公开访问**：所有人都可以查看头像（用于在应用中显示）
3. **文件类型验证**：前端限制只能上传图片文件
4. **文件大小限制**：前端限制最大2MB
5. **自动清理**：上传新头像时自动删除旧头像

## 完整数据库架构

完整的数据库架构（包括表和Storage配置）请查看 `database/schema.sql` 文件。
