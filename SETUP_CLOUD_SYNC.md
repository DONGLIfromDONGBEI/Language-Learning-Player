# 跨设备同步设置指南

## 🎯 目标
实现文件在手机、平板、电脑等不同设备间自动同步。

## 📋 快速设置步骤

### 第一步：创建 Supabase 项目（5分钟）

1. 访问 [supabase.com](https://supabase.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 填写信息：
   - Project name: `listening-player`
   - Database Password: 设置强密码（记住它）
   - Region: 选择最近的区域
5. 点击 "Create new project"
6. 等待 1-2 分钟

### 第二步：创建存储桶（2分钟）

1. 在 Supabase 项目页面，点击左侧 "Storage"
2. 点击 "Create a new bucket"
3. 填写：
   - Name: `listening-files`
   - **勾选** "Public bucket"
4. 点击 "Create bucket"

### 第三步：设置存储策略（3分钟）

1. 在 Storage 页面，点击 `listening-files` 桶
2. 点击 "Policies" 标签
3. 创建三个策略（每个策略点击 "New Policy" → "Create policy from scratch"）：

**策略 1: 允许上传**
- Policy name: `Allow uploads`
- Allowed operation: `INSERT`
- Policy definition: `true`

**策略 2: 允许读取**
- Policy name: `Allow reads`
- Allowed operation: `SELECT`
- Policy definition: `true`

**策略 3: 允许删除**
- Policy name: `Allow deletes`
- Allowed operation: `DELETE`
- Policy definition: `true`

### 第四步：创建数据库表（2分钟）

1. 在 Supabase 项目页面，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 打开项目中的 `supabase-setup.sql` 文件
4. 复制所有内容，粘贴到 SQL Editor
5. 点击 "Run" 或按 `Cmd/Ctrl + Enter`

### 第五步：获取 API 密钥（1分钟）

1. 在 Supabase 项目页面，点击左侧 "Settings"（齿轮图标）
2. 点击 "API"
3. 复制：
   - **Project URL**（类似：`https://xxxxx.supabase.co`）
   - **anon public** key（很长的字符串）

### 第六步：配置环境变量（1分钟）

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
```

**示例**：
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 第七步：安装依赖（1分钟）

```bash
npm install @supabase/supabase-js
```

### 第八步：重启开发服务器

```bash
npm run dev
```

### 第九步：测试

1. 打开网页，上传一个文件
2. 在手机上打开同一个网页
3. 应该能看到上传的文件！

## 🚀 部署到 Vercel 时的配置

部署到 Vercel 后，需要在 Vercel 中添加环境变量：

1. 在 Vercel 项目页面，点击 "Settings"
2. 点击 "Environment Variables"
3. 添加：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key
4. 点击 "Save"
5. 重新部署项目

## ✅ 完成！

现在你的应用支持跨设备同步了！

- ✅ 在电脑上传文件 → 手机自动看到
- ✅ 在手机上上传文件 → 电脑自动看到
- ✅ 所有设备文件自动同步

## 💡 工作原理

- **用户识别**：使用浏览器指纹生成用户 ID（无需登录）
- **文件存储**：文件存储在 Supabase Storage
- **元数据**：文件信息存储在 Supabase Database
- **自动同步**：每次打开网页自动从云端加载文件

## 📊 免费套餐限制

Supabase 免费套餐：
- ✅ 500MB 存储空间
- ✅ 2GB 带宽/月
- ✅ 50,000 月活跃用户
- ✅ 完全够个人使用

## ❓ 常见问题

**Q: 需要登录吗？**
A: 不需要！使用浏览器指纹自动识别用户。

**Q: 文件安全吗？**
A: 是的，每个用户只能看到自己的文件。

**Q: 可以关闭云端同步吗？**
A: 可以，删除 `.env.local` 文件即可，会回退到本地存储。

**Q: 如何清除所有云端文件？**
A: 在 Supabase Dashboard 的 Storage 中删除文件，或在 Database 中清空 `file_pairs` 表。





