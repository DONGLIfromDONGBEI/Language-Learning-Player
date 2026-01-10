# Supabase 设置指南

## 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 填写信息：
   - **Project name**: `listening-player`（或你喜欢的名字）
   - **Database Password**: 设置一个强密码（**记住它**，以后可能需要）
   - **Region**: 选择离你最近的区域（如 `Southeast Asia (Singapore)`）
5. 点击 "Create new project"
6. 等待 1-2 分钟，项目创建完成

## 第二步：创建存储桶（Storage Bucket）

1. 在 Supabase 项目页面，点击左侧 "Storage"
2. 点击 "Create a new bucket"
3. 填写信息：
   - **Name**: `listening-files`
   - **Public bucket**: ✅ **勾选**（这样文件可以直接通过 URL 访问）
4. 点击 "Create bucket"

## 第三步：设置存储策略

1. 在 Storage 页面，点击 `listening-files` 桶
2. 点击 "Policies" 标签
3. 点击 "New Policy" → "Create policy from scratch"
4. 创建以下策略：

### 策略 1: 允许上传文件
- **Policy name**: `Allow uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**: 
  ```sql
  true
  ```

### 策略 2: 允许读取文件
- **Policy name**: `Allow reads`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  true
  ```

### 策略 3: 允许删除文件
- **Policy name**: `Allow deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**: 
  ```sql
  true
  ```

## 第四步：创建数据库表

1. 在 Supabase 项目页面，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-setup.sql` 文件中的所有内容
4. 粘贴到 SQL Editor
5. 点击 "Run" 或按 `Cmd/Ctrl + Enter`
6. 应该看到 "Success. No rows returned"

## 第五步：获取 API 密钥

1. 在 Supabase 项目页面，点击左侧 "Settings"（齿轮图标）
2. 点击 "API"
3. 复制以下信息：
   - **Project URL**（类似：`https://xxxxx.supabase.co`）
   - **anon public** key（一个很长的字符串，以 `eyJ` 开头）

## 第六步：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
```

**示例**：
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**重要**：
- `.env.local` 文件已经在 `.gitignore` 中，不会被提交到 GitHub
- 在 Vercel 部署时，需要在 Vercel 项目设置中添加这些环境变量

## 第七步：安装依赖

在项目目录执行：

```bash
npm install @supabase/supabase-js
```

## 第八步：测试

1. 重启开发服务器：
   ```bash
   npm run dev
   ```
2. 打开网页，上传一个文件
3. 检查 Supabase Storage 中是否有文件上传
4. 在另一个设备上打开网页，应该能看到上传的文件

## 在 Vercel 中配置环境变量

部署到 Vercel 后：

1. 在 Vercel 项目页面，点击 "Settings"
2. 点击 "Environment Variables"
3. 添加：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key
4. 点击 "Save"
5. 重新部署项目（Vercel 会自动检测并重新部署）

## 完成！

现在你的应用支持跨设备同步了！🎉

在任何设备上上传的文件，都会自动同步到所有设备。





