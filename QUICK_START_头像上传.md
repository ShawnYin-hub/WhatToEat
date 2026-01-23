# 快速开始：头像上传功能

## 🚀 一分钟完成配置

### 第一步：执行SQL配置
1. 打开 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 点击左侧 **SQL Editor**
4. 复制粘贴 `database/setup_avatar_storage.sql` 中的内容
5. 点击 **RUN** 执行

### 第二步：验证配置
1. 点击左侧 **Storage**
2. 确认看到 `avatars` bucket（绿色的公开图标 🌐）
3. 点击 `avatars` bucket
4. 点击 **Policies** 标签
5. 确认看到4个策略：
   - ✅ Users can upload own avatar
   - ✅ Users can update own avatar
   - ✅ Users can delete own avatar
   - ✅ Anyone can view avatars

### 第三步：测试功能
1. 启动你的应用
2. 登录账号
3. 进入个人中心
4. 点击"上传头像"按钮
5. 选择一张图片（JPG或PNG，小于2MB）
6. 上传成功！ 🎉

---

## ✨ 功能特性

### 已实现
- ✅ **移除URL输入**：不再需要手动粘贴图片链接
- ✅ **图片上传**：点击按钮直接选择本地图片
- ✅ **自动缩放**：自动缩放到200x200像素
- ✅ **自动压缩**：压缩到合适大小，加快加载
- ✅ **实时预览**：上传后立即显示
- ✅ **中英文支持**：完整的双语界面
- ✅ **错误提示**：文件太大或格式错误会有友好提示
- ✅ **安全隔离**：每个用户只能管理自己的头像

### 技术规格
- **支持格式**：JPG, PNG
- **文件大小限制**：2MB
- **输出尺寸**：200x200像素（保持宽高比）
- **压缩质量**：80%
- **存储位置**：Supabase Storage (公开bucket)

---

## 📋 完整的SQL代码

如果你需要完整的数据库架构（包括表和Storage），请查看：
- `database/schema.sql` - 完整数据库架构
- `database/setup_avatar_storage.sql` - 仅Storage配置（快速部署）

### 完整SQL代码（可直接复制）

```sql
-- =====================================================
-- Supabase 头像存储配置
-- =====================================================

-- 1. 创建 avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 3. 创建访问策略
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');
```

---

## 🔧 故障排查

### 问题：上传时提示 "Bucket not found"
**解决**：
```sql
-- 确认bucket已创建
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### 问题：上传时提示 "Permission denied"
**解决**：
1. 确保已执行所有4个策略SQL
2. 确认用户已登录
3. 检查bucket的public设置是否为true

### 问题：头像无法显示
**解决**：
1. 确认 "Anyone can view avatars" 策略已创建
2. 检查浏览器控制台是否有错误
3. 确认Storage bucket设置为public

### 问题：文件太大无法上传
**解决**：
选择小于2MB的图片，或修改限制：
```javascript
// 在 src/components/ProfilePage.jsx 中
if (file.size > 2 * 1024 * 1024) {  // 改为你需要的大小
```

---

## 📚 相关文档

- `SUPABASE_STORAGE_SETUP.md` - 详细配置指南
- `个人中心头像上传功能更新说明.md` - 完整更新说明
- `database/schema.sql` - 完整数据库架构
- `database/setup_avatar_storage.sql` - Storage快速配置

---

## 💡 使用提示

1. **推荐图片尺寸**：上传正方形图片效果最佳
2. **文件格式**：JPG压缩率更好，PNG支持透明背景
3. **更换头像**：直接上传新图片，旧图片会自动删除
4. **加载失败**：如果头像加载失败，会自动显示昵称首字母

---

## 🎯 下一步

配置完成后，你可以：
1. 自定义头像尺寸（修改resizeImage函数）
2. 调整文件大小限制
3. 添加更多图片格式支持
4. 实现图片裁剪功能
5. 添加拖拽上传

需要帮助？查看 `个人中心头像上传功能更新说明.md` 获取更多信息！
