# iOS 空白页排查指南

## 如果 Xcode 运行后显示空白页，按以下步骤排查：

### 1. 确保已同步最新构建

在 Mac 端执行：

```bash
cd ~/Desktop/WhatToEat  # 或你的项目路径
git pull
npm run build
npx cap sync ios
```

### 2. 检查 Xcode 控制台错误

1. 在 Xcode 中运行应用
2. 查看底部控制台（Console）是否有红色错误信息
3. 常见错误：
   - `Failed to load resource` - 资源路径问题
   - `CORS error` - 跨域问题
   - `Module not found` - 模块加载问题

### 3. 检查 Safari Web Inspector（真机调试）

1. 在 Mac 上打开 Safari
2. 菜单：开发 → [你的 iPhone 名称] → [你的应用名称]
3. 查看 Console 标签页的错误信息
4. 查看 Network 标签页，检查资源是否加载成功

### 4. 检查 Info.plist 配置

确保 `ios/App/App/Info.plist` 中有：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>localhost</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### 5. 清理并重新构建

在 Xcode 中：
1. Product → Clean Build Folder (Shift + Cmd + K)
2. 关闭 Xcode
3. 在终端中：
   ```bash
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   cd ../..
   ```
4. 重新打开 Xcode 并运行

### 6. 检查 Capacitor 配置

确保 `capacitor.config.ts` 中：

```typescript
webDir: 'dist',
```

并且 `dist` 目录存在且包含 `index.html` 和 `assets` 文件夹。

### 7. 检查资源路径

在 Xcode 中：
1. 打开 `ios/App/App/public/index.html`
2. 检查 script 和 link 标签的路径是否为 `/assets/...`
3. 确保 `ios/App/App/public/assets/` 目录存在且包含所有文件

### 8. 常见问题解决

#### 问题：资源 404 错误
**解决：** 确保运行了 `npx cap sync ios` 同步最新构建

#### 问题：JavaScript 错误
**解决：** 查看 Safari Web Inspector 的 Console，找到具体错误并修复

#### 问题：CORS 错误
**解决：** 检查 API 请求是否使用了正确的代理路径

#### 问题：白屏但无错误
**解决：** 
1. 检查 `src/main.jsx` 是否正确挂载到 `#root`
2. 检查是否有未捕获的异常
3. 尝试在浏览器中打开 `dist/index.html` 测试

### 9. 调试技巧

在 `src/main.jsx` 中添加：

```javascript
console.log('App starting...')
```

在 Xcode 控制台或 Safari Web Inspector 中查看是否输出。

---

如果以上步骤都无法解决，请提供：
1. Xcode 控制台的完整错误信息
2. Safari Web Inspector Console 的错误信息
3. Network 标签页中失败的请求
