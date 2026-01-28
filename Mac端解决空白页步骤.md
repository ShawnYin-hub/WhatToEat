# Mac 端解决空白页的完整步骤

## 问题原因

iOS 项目中的文件没有同步最新的构建，导致引用的 JS 文件版本不匹配。

## 完整解决步骤

### 1. 进入项目目录

```bash
cd ~/Desktop/WhatToEat  # 或你的实际路径
```

### 2. 拉取最新代码

```bash
git pull
```

### 3. 清理旧的构建和 iOS 同步文件

```bash
# 清理 dist 目录
rm -rf dist

# 清理 iOS 项目中的旧文件（可选，但推荐）
rm -rf ios/App/App/public/assets
rm -rf ios/App/App/public/locales
```

### 4. 重新构建

```bash
npm run build
```

这一步会重新生成 `dist` 目录，包含最新的文件。

### 5. 同步到 iOS（关键步骤！）

```bash
npx cap sync ios
```

**重要：** 这一步会将 `dist` 目录中的文件复制到 `ios/App/App/public/`，并更新 `index.html` 中的文件引用。

### 6. 验证文件是否正确同步

```bash
# 检查文件是否存在
ls -la ios/App/App/public/
ls -la ios/App/App/public/assets/

# 检查 index.html 中的文件引用
cat ios/App/App/public/index.html | grep "index-"
```

应该能看到：
- `index.html` 文件
- `assets` 文件夹
- `locales` 文件夹
- `index.html` 中引用的 JS 文件名应该和 `assets` 文件夹中的文件名匹配

### 7. 在 Xcode 中清理并重新构建

#### 7.1 打开 Xcode

```bash
npx cap open ios
# 或
open ios/App/App.xcworkspace
```

#### 7.2 清理构建

在 Xcode 中：
1. 菜单：`Product → Clean Build Folder` (或按 `Shift + Cmd + K`)
2. 等待清理完成

#### 7.3 检查项目配置

1. 点击左侧的 **"App"** 项目（蓝色图标）
2. 选择 **"App"** target
3. 检查 **"Signing & Capabilities"**：
   - 确保勾选了 `Automatically manage signing`
   - 确保选择了正确的 Team

#### 7.4 选择设备并运行

1. 顶部工具栏选择你的 iPhone 设备
2. 点击左上角 ▶ 运行按钮（或按 `Cmd + R`）

### 8. 如果还是空白页，检查控制台

#### 8.1 查看 Xcode 控制台

在 Xcode 底部查看控制台（Console）是否有错误信息。

#### 8.2 使用 Safari Web Inspector（真机调试）

1. 在 Mac 上打开 Safari
2. 菜单：`Safari → 偏好设置 → 高级`，勾选 `在菜单栏中显示"开发"菜单`
3. 在 iPhone 上运行应用
4. 在 Mac Safari 中：`开发 → [你的 iPhone 名称] → [你的应用名称]`
5. 查看 Console 标签页的错误信息
6. 查看 Network 标签页，检查资源是否加载成功

### 9. 常见问题和解决方案

#### 问题 1：文件引用不匹配

**症状：** `index.html` 中引用的 JS 文件名和 `assets` 文件夹中的文件名不一致

**解决：** 重新执行步骤 4-5（重新构建和同步）

#### 问题 2：资源 404 错误

**症状：** 控制台显示资源加载失败（404）

**解决：** 
```bash
# 确保执行了同步
npx cap sync ios

# 检查文件是否存在
ls -la ios/App/App/public/assets/
```

#### 问题 3：JavaScript 错误

**症状：** 控制台显示 JavaScript 错误

**解决：** 
- 查看具体错误信息
- 检查是否是 Supabase 配置问题
- 检查环境变量是否正确

#### 问题 4：CORS 错误

**症状：** 控制台显示 CORS 错误

**解决：** iOS 应用不受 CORS 限制，如果出现 CORS 错误，可能是：
- 代码中使用了错误的 URL
- 检查 `src/services/supabase.js` 中的配置

### 10. 验证步骤

执行完以上步骤后，应用应该：

1. ✅ 正常启动（不是空白页）
2. ✅ 显示应用界面
3. ✅ 可以正常交互
4. ✅ 没有控制台错误

---

## 快速检查清单

- [ ] 执行了 `git pull` 拉取最新代码
- [ ] 执行了 `npm run build` 重新构建
- [ ] 执行了 `npx cap sync ios` 同步到 iOS
- [ ] 在 Xcode 中清理了构建（Clean Build Folder）
- [ ] 检查了文件引用是否匹配
- [ ] 查看了控制台错误信息（如果有）

---

## 如果还是不行

请提供以下信息：

1. Xcode 控制台的完整错误信息
2. Safari Web Inspector Console 的错误信息
3. `ios/App/App/public/index.html` 的内容
4. `ios/App/App/public/assets/` 目录的文件列表
