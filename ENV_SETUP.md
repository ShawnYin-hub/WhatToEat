# 环境变量配置说明

## ✅ 已配置

您的项目已经配置了高德地图 API Key，API Key 已保存在 `.env.local` 文件中。

## 📝 环境变量文件说明

### `.env.local` (已创建)
- **用途**: 本地开发环境变量，包含敏感信息（API Key）
- **状态**: ✅ 已创建并配置
- **内容**: `VITE_AMAP_API_KEY=59db828f842e5c5666d401e86911ce1d`
- **注意**: 此文件已在 `.gitignore` 中排除，不会被提交到 Git

### `.env.example` (示例文件)
- **用途**: 作为配置模板，不包含真实的 API Key
- **状态**: ✅ 已创建
- **注意**: 可以提交到 Git，供团队成员参考

## 🔧 如何修改 API Key

1. 打开 `.env.local` 文件
2. 修改 `VITE_AMAP_API_KEY` 的值
3. **重要**: 修改后需要重启开发服务器才能生效

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 🔍 Vite 环境变量规则

在 Vite 项目中，环境变量必须遵循以下规则：

1. **必须以 `VITE_` 开头** - 只有以 `VITE_` 开头的变量才会暴露给客户端代码
2. **在代码中使用**: `import.meta.env.VITE_AMAP_API_KEY`
3. **类型**: 所有环境变量都是字符串类型

## 🔐 安全提示

- ❌ **不要**将 `.env.local` 文件提交到 Git
- ❌ **不要**在代码中硬编码 API Key
- ✅ 使用 `.env.local` 存储敏感信息
- ✅ `.env.local` 已在 `.gitignore` 中配置

## 📚 参考文档

- [Vite 环境变量和模式](https://cn.vitejs.dev/guide/env-and-mode.html)
- [高德开放平台](https://lbs.amap.com/)
