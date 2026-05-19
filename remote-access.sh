#!/bin/bash
# Vocoseed - Remote Access Script
# 使用 ngrok 从任何网络访问本地开发服务器

echo "启动 Vocoseed 开发服务器..."
npm run dev &

echo "等待服务器启动..."
sleep 3

echo "启动 ngrok 隧道..."
npx ngrok http 5173

echo "隧道已建立！复制显示的 URL 即可从任何设备访问"
echo "按 Ctrl+C 停止"
