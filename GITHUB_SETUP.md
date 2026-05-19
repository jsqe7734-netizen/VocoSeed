# Vocoseed GitHub + 自动部署指南

## 第一步：安装 Git

1. 下载 Git：https://git-scm.com/downloads
2. 安装时使用默认设置即可
3. 验证安装：打开命令行输入 `git --version`

## 第二步：初始化 Git 仓库

在项目目录下执行：

```bash
cd d:\app\vocoseed-app
git init
git add .
git commit -m "Initial commit"
```

## 第三步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`vocoseed-app`（或其他你喜欢的名字）
3. 选择 Public 或 Private（推荐 Private）
4. **不要**勾选初始化 README、.gitignore 或 LICENSE（我们已经有了）
5. 点击 "Create repository"

## 第四步：推送代码到 GitHub

在项目目录执行：

```bash
git remote add origin https://github.com/你的用户名/vocoseed-app.git
git branch -M main
git push -u origin main
```

## 第五步：使用 Vercel 自动部署（推荐）

### 1. 访问 Vercel

https://vercel.com/new

### 2. 导入项目

- 点击 "Import" 选择你的 GitHub 仓库
- 点击 "Deploy"

### 3. 配置环境变量

在 Vercel 的项目设置中添加环境变量：

```
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon_key
VITE_OPENAI_API_KEY=你的API密钥
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_DALLE_MODEL=dall-e-3
VITE_BAIDU_APP_ID=你的百度APP ID
VITE_BAIDU_API_KEY=你的百度API密钥
VITE_BAIDU_SECRET_KEY=你的百度密钥
```

### 4. 完成！

- 部署成功后你会获得一个公网地址（如：`https://vocoseed-app.vercel.app`）
- 每次你推送代码到 GitHub，Vercel 会自动重新部署

## 第六步：日常使用

### 开发时的流程：

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 进行开发...

# 3. 提交代码
git add .
git commit -m "描述你的修改"
git push origin main
```

### 不再需要本地服务器！

代码推送到 GitHub 后，Vercel 会自动：
- 自动构建
- 自动部署
- 自动生成公网访问地址

## 可选：使用 Netlify 部署

如果你更习惯 Netlify：

1. 访问 https://app.netlify.com/
2. 点击 "Add new site" → "Import an existing project"
3. 连接 GitHub，选择仓库
4. 同样配置环境变量
5. 点击 "Deploy site"

## 可选：GitHub Pages 部署（免费）

在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
      with:
        version: 8
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v4
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 注意事项

1. **永远不要把 `.env` 文件提交到 GitHub**！（已经在 .gitignore 中排除）
2. 环境变量在部署平台（Vercel/Netlify）的设置中配置
3. 本地开发继续使用 `.env` 文件
4. 可以使用环境变量区分开发/生产环境

## 快速命令参考

```bash
# 查看状态
git status

# 查看修改
git diff

# 提交代码
git add .
git commit -m "修改描述"
git push

# 分支操作
git checkout -b feature/new-feature
git checkout main
git merge feature/new-feature

# 撤销修改
git checkout -- filename
git reset HEAD~1  # 撤销上一次提交
```
