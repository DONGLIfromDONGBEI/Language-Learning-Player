# 跨设备同步功能实现指南

## 问题
当前文件存储在浏览器 IndexedDB 中，只能在同一设备上使用，无法跨设备同步。

## 解决方案：Supabase 云端存储

### 为什么选择 Supabase？
- ✅ 完全免费（个人项目）
- ✅ 提供存储、数据库、认证一体化
- ✅ 易于集成
- ✅ 与 Next.js 完美兼容
- ✅ 自动处理文件上传/下载

## 实现步骤

### 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 使用 GitHub 账户登录
3. 点击 "New Project"
4. 填写项目信息：
   - Project name: `listening-player`
   - Database Password: 设置一个强密码（记住它）
   - Region: 选择离你最近的区域
5. 点击 "Create new project"
6. 等待 1-2 分钟，项目创建完成

### 第二步：获取 API 密钥

1. 在 Supabase 项目页面，点击左侧 "Settings"（齿轮图标）
2. 点击 "API"
3. 复制以下信息：
   - **Project URL**（类似：`https://xxxxx.supabase.co`）
   - **anon public key**（一个很长的字符串）

### 第三步：配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
```

**重要**：`.env.local` 文件已经在 `.gitignore` 中，不会被提交到 GitHub。

### 第四步：安装依赖

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 第五步：创建 Supabase 客户端

创建 `lib/supabase.ts` 文件（我会帮你创建）

### 第六步：创建数据库表

在 Supabase 中创建表来存储文件元数据（我会提供 SQL）

### 第七步：更新文件存储逻辑

修改 `FileUploader` 组件，支持云端上传和同步

## 功能特性

实现后将支持：
- ✅ 用户登录/注册（可选，也可以匿名使用）
- ✅ 文件上传到云端
- ✅ 跨设备文件同步
- ✅ 文件列表自动同步
- ✅ 离线支持（本地缓存 + 云端同步）

## 隐私和安全

- 文件存储在 Supabase（符合 GDPR）
- 可以选择匿名使用或注册账户
- 每个用户只能看到自己的文件

## 成本

- **免费套餐**：
  - 500MB 存储空间
  - 2GB 带宽/月
  - 50,000 月活跃用户
  - 完全够个人使用

- **如果超出**：可以升级到 Pro 计划（$25/月），或使用其他服务

## 开始实现

我会帮你创建所有必要的代码文件。



