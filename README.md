# Vocoseed

一个智能创意孵化应用，帮助你记录灵感，完善创意。

## 功能特性

- 🎙️ 语音输入，自动转文字
- 🤖 AI 对话，深度完善创意
- 🔍 智能搜索，查找相关参考
- ✨ 一键生成，从创意到方案
- 💾 数据持久化，云端同步

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI / SiliconFlow API
- **部署**: Vercel / Netlify

## 快速开始

### 本地开发

1. 克隆项目
```bash
git clone https://github.com/你的用户名/vocoseed-app.git
cd vocoseed-app
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
# 复制 .env.example 为 .env
# 填写你的 Supabase 和 OpenAI 配置
```

4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

### 环境变量

创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key

# OpenAI 配置（或使用 SiliconFlow）
VITE_OPENAI_API_KEY=你的API密钥
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_DALLE_MODEL=dall-e-3

# 百度语音识别
VITE_BAIDU_APP_ID=你的百度APP ID
VITE_BAIDU_API_KEY=你的百度API密钥
VITE_BAIDU_SECRET_KEY=你的百度密钥
```

## 部署

使用 Vercel 一键部署：

1. 访问 https://vercel.com/new
2. 导入你的 GitHub 仓库
3. 配置环境变量
4. 点击 Deploy

详细步骤请查看 [GITHUB_SETUP.md](./GITHUB_SETUP.md)

## 数据库设置

在 Supabase 中执行 `supabase/schema.sql` 来创建数据库表和触发器。

## 项目结构

```
.
├── src/
│   ├── components/       # React 组件
│   ├── pages/           # 页面组件
│   ├── context/         # React Context
│   ├── services/        # API 服务
│   ├── data/           # 类型和常量
│   └── config/         # 配置文件
├── supabase/           # 数据库 schema
└── ...
```

## 许可证

MIT
