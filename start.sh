#!/bin/bash

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install
fi

# 启动开发服务器
echo "正在启动开发服务器..."
npm run dev

