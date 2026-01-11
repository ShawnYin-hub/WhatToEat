# 📋 部署说明 - OpenStreetMap 功能

## ⚠️ 重要提示

**OpenStreetMap 在开发环境（localhost）无法直接使用**，因为：
- Nominatim API 有 CORS 限制
- 浏览器直接调用会被阻止
- Vite 代理在某些情况下可能不稳定

## ✅ 解决方案

### 开发环境测试
**推荐：使用高德地图测试核心功能**
- ✅ 高德地图在开发环境完全可用
- ✅ 功能完整，数据准确
- ✅ 可以验证所有核心功能

### 生产环境部署
**部署到 Vercel 后，OpenStreetMap 可以正常使用**
- ✅ Vercel Serverless Functions 作为代理
- ✅ 完全解决 CORS 问题
- ✅ 全球可用，完全免费

## 🚀 部署流程

1. **本地测试**
   - 使用高德地图验证功能
   - 确保核心功能正常

2. **部署到 Vercel**
   - 参考 `DEPLOY_GUIDE.md`
   - 使用 GitHub + Vercel（最简单）

3. **在线测试 OpenStreetMap**
   - 部署后访问 Vercel URL
   - 选择 OpenStreetMap
   - 测试海外地点搜索

## 📝 为什么开发环境不能用？

**技术原因：**
- Nominatim API 不允许浏览器直接调用（CORS 策略）
- Vite 代理在某些情况下不稳定
- 需要服务器端代理才能真正解决 CORS

**生产环境为什么可以？**
- Vercel Serverless Functions 运行在服务器端
- 不受浏览器 CORS 限制
- 作为代理转发请求，完全透明

## 🎯 建议

**对于本地开发：**
- ✅ 使用高德地图测试（推荐）
- ⚠️ OpenStreetMap 留到部署后测试

**部署后：**
- ✅ 所有功能都可以使用
- ✅ OpenStreetMap 可以正常访问
- ✅ 高德地图也可以正常使用

---

**总结：先部署，再测试 OpenStreetMap。这是最可靠的方式！**
