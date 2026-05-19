# Supabase 集成指南

## 前置条件

1. 已创建 Supabase 账户 (https://supabase.com)
2. 已创建新的 Supabase 项目

## 第一步：数据库设置

### 1.1 执行 SQL 脚本

1. 登录 Supabase 控制台
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 创建新的查询
5. 复制并粘贴 `supabase/schema.sql` 文件中的内容
6. 点击 "Run" 执行

该脚本会创建以下表：
- `profiles` - 用户个人信息表
- `ideas` - 创意想法表
- `messages` - 对话消息表
- `search_results` - 搜索结果表
- `usage_stats` - 用户使用统计表

同时还会创建：
- 自动更新时间戳的触发器
- 新用户自动创建记录的触发器
- Row Level Security (RLS) 策略

## 第二步：获取 API 凭证

1. 在 Supabase 控制台中，点击左侧菜单的 "Settings" → "API"
2. 复制以下信息：
   - Project URL (Project URL)
   - anon/public (anon key)

## 第三步：配置环境变量

1. 复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 Supabase 凭证：
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 第四步：启用认证方式

在 Supabase 控制台中，进入 "Authentication" → "Providers"：

### 4.1 邮箱/密码认证
- 启用 "Email" 提供商

### 4.2 手机验证码认证（可选）
- 启用 "Phone" 提供商
- 需要配置 SMS 服务

### 4.3 微信认证（可选）
- 启用 "WeChat" 提供商
- 配置微信开放平台的 AppID 和 AppSecret

## 第五步：测试连接

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开 http://localhost:5173
4. 尝试注册一个新账户
5. 如果一切正常，数据应该会保存到 Supabase 数据库中

## 项目架构说明

### 服务层

- `src/services/supabase/authService.ts` - 认证相关服务
- `src/services/supabase/ideaService.ts` - 创意想法数据服务
- `src/services/supabase/statsService.ts` - 统计数据服务

### 配置

- `src/config/supabase.ts` - Supabase 客户端配置

### 数据流

1. 用户认证 → Supabase Auth
2. 数据 CRUD → Supabase Postgres
3. 本地后备 → localStorage（当 Supabase 不可用时）

## 本地开发模式（可选）

如果只想在本地开发，不需要配置 Supabase：

1. 删除或重命名 `.env` 文件
2. 项目会自动使用 localStorage 存储数据
3. 使用模拟数据作为初始数据

## 常见问题

### Q: 数据表没有自动创建？
A: 请确保完整执行了 `supabase/schema.sql` 中的所有 SQL 语句

### Q: RLS 政策报错？
A: 检查用户是否已登录，RLS 政策要求用户必须通过认证

### Q: 如何重置数据库？
A: 在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS search_results CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS usage_stats CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```
然后重新执行 schema.sql

### Q: 如何获取真实的微信登录？
A: 需要在微信开放平台注册应用，获取 AppID 和 AppSecret，然后在 Supabase 中配置

## 生产环境部署

1. 确保使用生产环境的 Supabase 项目
2. 开启邮箱确认功能
3. 设置合理的密码策略
4. 配置自定义 SMTP 服务器
5. 设置数据库备份
6. 配置存储桶（如果需要存储文件）

## 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
