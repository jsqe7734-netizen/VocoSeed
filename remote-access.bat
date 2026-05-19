@echo off
REM Vocoseed - Remote Access Script
REM 使用 ngrok 从任何网络访问本地开发服务器

echo Starting Vocoseed development server...
start npm run dev

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Starting ngrok tunnel...
npx ngrok http 5173

echo Tunnel established! Copy the URL to access from any device
pause
