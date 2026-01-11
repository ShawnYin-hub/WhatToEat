# 🔑 获取 Google Maps API Key 详细步骤

## 📋 前提条件

- 拥有一个 Google 账户（Gmail 账户即可）
- 准备好一张信用卡（Google 提供免费额度，但需要绑定信用卡验证）

## 🚀 详细步骤

### 第一步：访问 Google Cloud Console

1. 打开浏览器，访问：https://console.cloud.google.com/
2. 使用您的 Google 账户登录

### 第二步：创建新项目

1. 点击页面顶部的项目选择器（显示当前项目名称的地方）
2. 点击"**新建项目**"按钮
3. 填写项目信息：
   - **项目名称**：例如 `what-to-eat-today` 或任意名称
   - **组织**：可以留空
   - **位置**：选择"无组织"
4. 点击"**创建**"按钮
5. 等待几秒钟，项目创建完成

### 第三步：启用必要的 API

1. 在左侧菜单中，点击"**API 和服务**" > "**库**"
2. 在搜索框中输入"**Places API (New)**"
3. 点击"**Places API (New)**"（注意选择带"(New)"的新版本）
4. 点击"**启用**"按钮
5. 等待 API 启用完成

> 💡 **提示**：Places API (New) 是 Google 的最新版本，功能更强大。

### 第四步：创建 API Key

1. 在左侧菜单中，点击"**API 和服务**" > "**凭据**"
2. 点击页面顶部的"**+ 创建凭据**"按钮
3. 选择"**API 密钥**"
4. 系统会自动创建一个 API Key 并显示在弹窗中
5. **立即复制这个 API Key**（点击复制按钮）
   - ⚠️ **重要**：这个 Key 只显示一次，请立即保存！

### 第五步：限制 API Key（推荐，提高安全性）

1. 在"凭据"页面，点击刚才创建的 API Key 名称（或点击"编辑 API 密钥"图标）
2. **应用限制**部分：
   - 选择"**HTTP 引荐来源网址（网站）**"
   - 点击"**添加项目**"
   - 添加您的网站域名，例如：
     - `https://your-site.pages.dev/*`
     - `http://localhost:5174/*`（开发环境）
     - `http://localhost:*`（所有本地端口）
3. **API 限制**部分：
   - 选择"**限制密钥**"
   - 在下拉菜单中选择"**Places API (New)**"
   - 确保只选择了这一个 API
4. 点击"**保存**"按钮

> ⚠️ **注意**：限制 API Key 可以提高安全性，防止他人滥用。如果不限制，API Key 可能被他人使用并消耗您的配额。

## 💰 费用说明

### 免费额度

Google Maps Platform 提供 **$200 免费额度**（每月），相当于：

- **Places API (New) Text Search**：约 11,764 次请求
- **Places API (New) Nearby Search**：约 6,250 次请求

### 定价

超出免费额度后：

- Text Search：$17 / 1000 次请求
- Nearby Search：$32 / 1000 次请求

### 对于个人项目

- 免费额度通常足够使用
- 如果只是测试，使用量很小
- 建议设置配额限制，防止意外超支

### 设置配额限制（推荐）

1. 在左侧菜单，点击"**API 和服务**" > "**配额**"
2. 选择"**Places API (New)**"
3. 找到相关配额项目，点击编辑
4. 设置每日或每月配额限制
5. 保存设置

## ⚙️ 配置到项目中

### 方式一：本地开发环境（.env.local）

1. 在项目根目录找到 `.env.local` 文件（如果没有则创建）
2. 添加以下内容：

```env
VITE_GOOGLE_MAPS_API_KEY=你的API_KEY_在这里
```

3. 保存文件
4. **重启开发服务器**（停止后重新运行 `npm run dev`）

### 方式二：Cloudflare Pages 部署

1. 在 Cloudflare Pages 项目设置中
2. 点击"**Settings**" > "**Environment variables**"
3. 点击"**Add variable**"
4. 添加：
   - **Variable name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: 您的 API Key
   - **Environment**: Production（或 All）
5. 点击"**Save**"
6. 重新部署项目

## ✅ 验证配置

配置完成后：

1. 刷新应用页面
2. 在"地图服务"中选择"**Google Maps**"
3. 如果配置正确，不会显示错误提示
4. 尝试搜索一个地点，如果正常显示结果，说明配置成功

## 🔒 安全提示

1. **不要**将 API Key 提交到公开的 Git 仓库
2. **不要**在代码中硬编码 API Key
3. **使用环境变量**存储 API Key
4. **设置 API 限制**，限制可访问的域名
5. **设置配额限制**，防止意外超支
6. 如果 API Key 泄露，立即删除并创建新的

## 🐛 常见问题

### Q: 需要绑定信用卡吗？
A: 是的，Google 要求绑定信用卡来验证身份，但免费额度内不会收费。

### Q: API Key 创建后多久生效？
A: 通常立即生效，最多几分钟。

### Q: 如何查看 API 使用情况？
A: 在 Google Cloud Console 中，"API 和服务" > "仪表板"可以查看使用统计。

### Q: 可以创建多个 API Key 吗？
A: 可以，每个项目可以创建多个 API Key，便于管理不同环境。

### Q: API Key 被限制后还能用吗？
A: 可以，限制只是增加安全性，只要符合限制条件（域名、API类型）就可以正常使用。

## 📞 需要帮助？

如果遇到问题：
1. 检查 API Key 是否正确复制
2. 确认已启用 Places API (New)
3. 检查 API Key 的限制设置
4. 查看浏览器控制台的错误信息
5. 检查 Google Cloud Console 的 API 使用情况

## 🎉 完成！

配置完成后，您就可以在应用中使用 Google Maps 了！

---

**快速参考链接：**
- Google Cloud Console: https://console.cloud.google.com/
- API 库: https://console.cloud.google.com/apis/library
- 凭据管理: https://console.cloud.google.com/apis/credentials
- 配额管理: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas
