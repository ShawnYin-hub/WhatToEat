# 🔧 修复 Nominatim API 代理

## ⚠️ 问题

请求现在到了 `/api/nominatim`（代理正常工作），但返回 400 Bad Request。

说明代理函数有问题，需要检查并修复。

## 🔍 可能的原因

1. **参数处理问题** - 查询参数可能没有正确传递
2. **请求格式问题** - Vercel Serverless Functions 的请求格式可能不同

## ✅ 检查 Vercel Functions 日志

1. **访问 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 找到 "what-to-eat-today" 项目

2. **查看 Functions**
   - 点击 "Functions" 标签
   - 点击 `api/nominatim` 函数

3. **查看 Logs**
   - 点击 "Logs" 标签
   - 查看错误信息
   - 这可以帮助诊断问题

## 🔧 需要检查的代码

检查 `api/nominatim.js` 是否正确处理查询参数。

Vercel Serverless Functions 使用 Node.js，请求对象格式可能不同。

---

**请查看 Vercel Functions 日志，告诉我具体的错误信息，这样我可以更准确地修复问题！**
