# 🚀 Cloudflare Pages 部署指南

## ✅ 构建完成！

**构建文件位置：**
```
C:\Users\30449\what-to-eat-today\dist
```

这个文件夹包含了所有需要上传到 Cloudflare Pages 的文件。

---

## 📤 快速部署步骤

### 1. 打开 Cloudflare Dashboard
访问：https://dash.cloudflare.com/
登录您的账户

### 2. 进入 Pages
- 点击左侧菜单 **"Workers & Pages"**
- 点击 **"Create application"**
- 选择 **"Pages"** 标签页

### 3. 上传文件
- 点击 **"Upload assets"**
- 选择文件夹：`C:\Users\30449\what-to-eat-today\dist`
  - 或者直接拖拽 `dist` 文件夹到上传区域

### 4. 配置项目
- **Project name**: `what-to-eat-today`（或任意名称）
- **Production branch**: `main`（可任意）
- **Framework preset**: `None`（静态网站）

### 5. 部署
- 点击 **"Deploy site"**
- 等待 1-2 分钟完成部署

### 6. 获得网址
部署完成后，您会得到一个免费的网址：
```
https://what-to-eat-today-xxxxx.pages.dev
```

---

## ⚠️ 重要说明

### API Key 已内置
✅ 我已经将 API Key 配置到构建文件中，**无需额外设置环境变量**。

API Key 已经包含在构建的代码中，可以直接使用。

---

## 📁 上传的文件结构

```
dist/
├── index.html          (入口文件)
├── assets/
│   ├── index-*.js      (JavaScript 代码，包含 API Key)
│   └── index-*.css     (样式文件)
└── _redirects          (路由重定向配置)
```

---

## ✅ 部署后测试

访问您的网站后，请测试：
1. ✅ 页面正常显示
2. ✅ 自动定位功能
3. ✅ 手动输入地址功能
4. ✅ 搜索餐厅功能
5. ✅ 移动端显示

---

## 🔧 自定义域名（可选）

如果想使用自己的域名：

1. 在 Cloudflare Pages 项目设置中
2. 点击 **"Custom domains"**
3. 添加您的域名
4. 按照提示配置 DNS

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Cloudflare 部署日志
2. 查看浏览器控制台错误
3. 确认上传的是 `dist` 文件夹（不是项目根目录）

---

## 🎉 完成！

上传完成后，您的应用就可以被所有人访问了！

**文件路径：** `C:\Users\30449\what-to-eat-today\dist`

直接上传这个文件夹到 Cloudflare Pages 即可！
