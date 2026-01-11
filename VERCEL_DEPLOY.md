# 🚀 部署到 Vercel - 完整指南

## 方法一：通过 GitHub 部署（推荐，最简单）⭐

### 第 1 步：准备 GitHub 仓库

**选项 A：使用 GitHub Desktop（推荐给新手）**

1. **下载 GitHub Desktop**
   - 访问：https://desktop.github.com/
   - 下载并安装

2. **登录 GitHub**
   - 打开 GitHub Desktop
   - 使用 GitHub 账户登录（如果没有账户，先注册：https://github.com）

3. **添加项目**
   - 点击 "File" > "Add Local Repository"
   - 点击 "Choose..." 选择文件夹：`C:\Users\30449\what-to-eat-today`
   - 点击 "Add Repository"

4. **发布到 GitHub**
   - 点击 "Publish repository"
   - 取消勾选 "Keep this code private"（如果想公开）或保持勾选（如果想私有）
   - 仓库名称：`what-to-eat-today`
   - 点击 "Publish Repository"
   - 等待上传完成

**选项 B：使用命令行**

```bash
cd C:\Users\30449\what-to-eat-today

# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 在 GitHub 创建新仓库（访问 https://github.com/new）
#    仓库名：what-to-eat-today
#    不要初始化 README、.gitignore 或 license

# 5. 连接远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/what-to-eat-today.git

# 6. 推送代码
git push -u origin main
```

### 第 2 步：在 Vercel 部署

1. **访问 Vercel**
   - 打开：https://vercel.com
   - 点击 "Sign Up"

2. **登录**
   - 选择 "Continue with GitHub"
   - 授权 Vercel 访问您的 GitHub 账户

3. **导入项目**
   - 登录后，点击 "Add New..." > "Project"
   - 在 "Import Git Repository" 中找到 `what-to-eat-today`
   - 点击 "Import"

4. **配置项目（使用默认设置即可）**
   - Framework Preset: **Vite**（会自动检测）
   - Root Directory: `./`（默认）
   - Build Command: `npm run build`（默认）
   - Output Directory: `dist`（默认）
   - Install Command: `npm install`（默认）

5. **环境变量（可选）**
   - 如果使用 Google Maps，点击 "Environment Variables"
   - 添加：
     - Name: `VITE_GOOGLE_MAPS_API_KEY`
     - Value: 您的 Google Maps API Key
   - 高德地图 API Key 已内置，无需配置

6. **部署**
   - 点击 "Deploy" 按钮
   - 等待 1-2 分钟，Vercel 会自动：
     - 安装依赖
     - 构建项目
     - 部署到 CDN
     - 创建 Serverless Functions（api/ 目录）

7. **完成！**
   - 部署成功后，您会看到：
     ```
     ✅ Deployment successful!
     🌍 https://what-to-eat-today.vercel.app
     ```
   - 这个网址就是您的网站！可以分享给任何人使用

---

## 方法二：使用 Vercel CLI（命令行）

### 安装和部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login
# 这会打开浏览器，用 GitHub 账户登录

# 3. 在项目目录部署
cd C:\Users\30449\what-to-eat-today
vercel

# 4. 按照提示操作：
#    - Set up and deploy? Yes
#    - Which scope? 选择您的账户
#    - Link to existing project? No
#    - What's your project's name? what-to-eat-today
#    - In which directory is your code located? ./
#    - Want to override the settings? No

# 5. 等待部署完成
#    会显示部署 URL：https://what-to-eat-today.vercel.app

# 6. 部署到生产环境（可选）
vercel --prod
```

---

## ✅ 部署后验证

部署完成后，访问您的 Vercel URL，测试：

1. ✅ **页面加载**
   - 打开网站，检查是否正常显示

2. ✅ **高德地图功能**
   - 选择"高德地图"
   - 测试定位和搜索功能

3. ✅ **OpenStreetMap 功能**（部署后才可用）
   - 选择"OpenStreetMap"
   - 测试海外地点搜索
   - 测试餐厅搜索

4. ✅ **移动端访问**
   - 在手机浏览器打开网址
   - 测试触摸操作

---

## 🔄 更新网站

### 如果使用 GitHub 方式：

1. **修改代码**
2. **提交更改**
   - GitHub Desktop：点击 "Commit to main" > "Push origin"
   - 命令行：`git add .` > `git commit -m "更新"` > `git push`
3. **自动部署**
   - Vercel 会自动检测 GitHub 更新
   - 自动重新部署（通常 1-2 分钟）

### 如果使用 CLI 方式：

```bash
vercel --prod
```

---

## 🎨 自定义域名（可选）

如果您有自己的域名：

1. 在 Vercel 项目页面
2. 点击 "Settings" > "Domains"
3. 输入您的域名（如：`whattoeattoday.com`）
4. 按照提示配置 DNS 记录
5. 等待 DNS 生效（通常几分钟到几小时）

---

## 📊 Vercel 免费套餐

- ✅ **带宽**：100GB/月
- ✅ **Serverless Functions**：100GB-hours/月
- ✅ **部署次数**：无限制
- ✅ **域名**：免费子域名（*.vercel.app）
- ✅ **HTTPS**：自动配置，免费

对于个人项目，这些限制通常足够使用。

---

## ❓ 常见问题

**Q: 需要付费吗？**
A: 不需要，Vercel 免费套餐足够使用。

**Q: 需要绑卡吗？**
A: 不需要，完全免费。

**Q: 部署失败怎么办？**
A: 查看 Vercel Dashboard > Deployments > 点击失败的部署查看日志。

**Q: OpenStreetMap 还是用不了？**
A: 部署到 Vercel 后应该可以正常使用，因为 Serverless Functions 作为代理。如果还有问题，查看 Vercel Functions 日志。

**Q: 如何查看日志？**
A: Vercel Dashboard > 项目 > Functions > 点击函数 > Logs

---

## 🎉 完成！

按照以上步骤，您的网站就可以在线访问了！

**推荐流程：**
1. ✅ 使用 GitHub Desktop 上传代码到 GitHub（最简单）
2. ✅ 在 Vercel 导入 GitHub 项目
3. ✅ 一键部署
4. ✅ 获得免费网址
5. ✅ 分享给其他人使用！
