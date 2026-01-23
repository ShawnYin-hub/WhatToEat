#!/bin/bash
# 清理旧环境
rm -rf .build Package.resolved
# 强制解析依赖 (确保 carton 插件被下载)
swift package resolve
# 终极启动命令：显式调用 carton 包中的 dev 子命令
swift run --disable-sandbox carton dev --port 8080

