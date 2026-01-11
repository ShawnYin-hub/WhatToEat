# 📝 GitHub Desktop 提交步骤

## ✅ 需要提交的文件

根据当前状态，需要提交以下文件：

1. **api/nominatim.js** - Nominatim API 代理函数（已修复参数处理）
2. **src/services/osmApi.js** - OSM API 客户端（使用代理 URL）

## 🎯 在 GitHub Desktop 中的操作

### 步骤 1：勾选文件

在 GitHub Desktop 左侧面板的文件列表中：

1. **找到需要提交的文件**
   - `api/nominatim.js` - ✅ 勾选
   - `src/services/osmApi.js` - ✅ 勾选（如果有显示）

2. **勾选文件**
   - 点击文件名前面的复选框
   - 或者点击 "3 changed files" 前面的复选框（会勾选所有文件）

### 步骤 2：输入提交信息

在左下角的提交区域：

1. **Summary (required)** - 必填
   - 输入：`Fix: Nominatim and Overpass API proxy`
   - 或者：`Fix: API proxy parameter handling`

2. **Description** - 可选
   - 可以留空
   - 或者添加更详细的说明

### 步骤 3：提交

1. **点击 "Commit to main" 按钮**
   - 等待提交完成（通常几秒钟）

2. **推送到 GitHub**
   - 点击工具栏的 "Push origin" 按钮
   - 或者点击 "Repository" > "Push"
   - 等待推送完成

### 步骤 4：等待 Vercel 部署

1. **访问 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 找到您的项目

2. **查看部署进度**
   - 会自动检测 GitHub 更新
   - 等待 1-2 分钟部署完成

## 💡 提示

- ✅ **可以一起提交** - 可以勾选多个文件一起提交
- ✅ **提交信息要简洁** - Summary 用一句话描述更改
- ✅ **推送到 GitHub** - 提交后记得点击 "Push origin"

---

**是的，需要勾选 api/nominatim.js（和其他修改的文件），然后 Commit！**
