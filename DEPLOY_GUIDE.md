# 🌐 部署指南 - 让网站可以在线访问

## 🎯 推荐方案：Vercel（最简单）

**为什么选择 Vercel？**
- ✅ 完全免费
- ✅ 无需绑卡
- ✅ 自动 HTTPS（安全连接）
- ✅ 自动分配免费域名
- ✅ 支持 Serverless Functions（OpenStreetMap 代理）
- ✅ 一键部署，非常简单

## 📋 部署步骤（5分钟完成）

### 方法一：通过 GitHub 部署（推荐，最简单）

#### 步骤 1：准备 GitHub 账户
1. 如果没有 GitHub 账户，访问 https://github.com 注册
2. 登录您的账户

#### 步骤 2：将代码上传到 GitHub

**方式 A：使用 GitHub Desktop（图形界面，最简单）**

1. 下载安装 GitHub Desktop：https://desktop.github.com/
2. 打开 GitHub Desktop
3. 点击 "File" > "Add Local Repository"
4. 选择项目文件夹：`C:\Users\30449\what-to-eat-today`
5. 点击 "Publish repository"
6. 填写仓库名称（如：`what-to-eat-today`）
7. 勾选 "Keep this code private"（可选，私有仓库）
8. 点击 "Publish repository"

**方式 B：使用命令行（如果熟悉 Git）**

```bash
cd C:\Users\30449\what-to-eat-today

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 在 GitHub 创建新仓库后，添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/what-to-eat-today.git

# 推送代码
git branch -M main
git push -u origin main
```

#### 步骤 3：在 Vercel 部署

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 点击 "Sign Up"（使用 GitHub 账户登录）

2. **导入项目**
   - 登录后，点击 "Add New..." > "Project"
   - 找到您的 GitHub 仓库 `what-to-eat-today`
   - 点击 "Import"

3. **配置项目（通常使用默认即可）**
   - Framework Preset: **Vite**（会自动检测）
   - Build Command: `npm run build`（默认）
   - Output Directory: `dist`（默认）
   - Install Command: `npm install`（默认）

4. **环境变量（可选）**
   - 如果使用 Google Maps，点击 "Environment Variables"
   - 添加：`VITE_GOOGLE_MAPS_API_KEY` = 您的 API Key
   - 高德地图的 API Key 已内置，无需配置

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待 1-2 分钟，自动构建和部署

6. **完成！**
   - 部署完成后，Vercel 会显示一个网址，例如：
     ```
     https://what-to-eat-today.vercel.app
     ```
   - 这个网址就是您的网站地址，可以分享给任何人使用！

### 方法二：使用 Vercel CLI（命令行）

如果您熟悉命令行，也可以使用 CLI：

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录（使用浏览器登录）
vercel login

# 3. 在项目目录部署
cd C:\Users\30449\what-to-eat-today
vercel

# 4. 按照提示操作：
#    - 是否链接到现有项目？选择 N
#    - 项目名称：what-to-eat-today
#    - 是否覆盖设置？选择 Y
#    - 等待部署完成

# 5. 部署生产环境（可选）
vercel --prod
```

## 🌍 部署后访问

部署完成后，您会获得一个免费域名：

```
https://您的项目名.vercel.app
```

例如：
```
https://what-to-eat-today.vercel.app
```

**任何人都可以通过这个网址访问您的网站！**

## 🔄 更新网站

### 如果使用 GitHub 方式：
1. 修改代码
2. 在 GitHub Desktop 中点击 "Commit to main" > "Push origin"
3. Vercel 会自动检测并重新部署（通常 1-2 分钟）

### 如果使用 CLI 方式：
```bash
vercel --prod
```

## 🎨 自定义域名（可选）

如果您有自己的域名，可以：

1. 在 Vercel 项目页面点击 "Settings" > "Domains"
2. 输入您的域名（如：`whattoeattoday.com`）
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## ⚠️ 重要提示

### 文件检查清单

部署前确保以下文件存在：
- ✅ `api/nominatim.js` - Nominatim 代理
- ✅ `api/overpass.js` - Overpass 代理
- ✅ `vercel.json` - Vercel 配置
- ✅ `package.json` - 项目配置

### 部署后测试

部署完成后，请测试：
1. ✅ 访问网站，检查是否正常加载
2. ✅ 选择"高德地图"，测试中国地区搜索
3. ✅ 选择"OpenStreetMap"，测试海外地区搜索
4. ✅ 测试自动定位功能
5. ✅ 测试搜索餐厅功能

## 📊 Vercel 免费套餐限制

- ✅ **带宽**：100GB/月（通常足够）
- ✅ **Serverless Functions**：100GB-hours/月
- ✅ **域名**：免费子域名（*.vercel.app）
- ✅ **HTTPS**：自动配置，免费
- ✅ **部署次数**：无限制

对于个人项目，这些限制通常足够使用。

## 🆚 其他部署选项

### Cloudflare Pages（不推荐用于此项目）

**为什么不推荐？**
- ❌ Cloudflare Pages 不支持 Serverless Functions
- ❌ OpenStreetMap 需要后端代理，无法使用
- ✅ 如果只使用高德地图，可以考虑

如果只用高德地图，Cloudflare Pages 也可以：
1. 访问 https://pages.cloudflare.com
2. 连接 GitHub 仓库
3. 构建命令：`npm run build`
4. 输出目录：`dist`

### Netlify（可以，但 Vercel 更简单）

Netlify 也支持 Serverless Functions，但需要创建 `netlify/functions/` 目录。
Vercel 的配置更简单，推荐使用 Vercel。

## 🎉 完成！

按照以上步骤，您的网站就可以在线访问了！

**快速总结：**
1. 将代码上传到 GitHub
2. 在 Vercel 导入项目
3. 点击部署
4. 获得免费网址
5. 分享给其他人使用！

---

**需要帮助？**
- Vercel 文档：https://vercel.com/docs
- Vercel 社区：https://github.com/vercel/vercel/discussions
