# 部署指南

目前项目在本地运行（`localhost:3000`），只有你的电脑可以访问。要让其他人也能使用，需要将项目部署到云端服务器。

## 推荐方案：Vercel（最简单，免费）

Vercel 是 Next.js 官方推荐的部署平台，提供免费套餐，非常适合个人项目。

### 部署步骤

#### 方法 1: 通过 Vercel 网站部署（推荐）

1. **准备代码仓库**
   - 在 GitHub 上创建一个新仓库
   - 将代码推送到 GitHub：
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/你的用户名/你的仓库名.git
     git push -u origin main
     ```

2. **部署到 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy" 即可

3. **完成**
   - 几分钟后，你会得到一个公开的 URL（如 `https://your-project.vercel.app`）
   - 任何人都可以通过这个 URL 访问你的应用

#### 方法 2: 使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```
   按照提示操作即可。

### Vercel 的优势

- ✅ 完全免费（个人项目）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 自动部署（每次推送到 GitHub 自动更新）
- ✅ 零配置，开箱即用

---

## 其他部署选项

### 1. Netlify

类似 Vercel，也支持 Next.js：

1. 访问 [netlify.com](https://netlify.com)
2. 连接 GitHub 仓库
3. 自动部署

### 2. Railway

适合需要更多控制的场景：

1. 访问 [railway.app](https://railway.app)
2. 从 GitHub 导入项目
3. 配置环境变量（如果需要）

### 3. 自己的服务器

如果你有自己的服务器（VPS、云服务器等）：

1. **构建项目**
   ```bash
   npm run build
   ```

2. **启动生产服务器**
   ```bash
   npm start
   ```

3. **使用 PM2 管理进程**（推荐）
   ```bash
   npm install -g pm2
   pm2 start npm --name "listening-player" -- start
   pm2 save
   pm2 startup
   ```

4. **配置 Nginx 反向代理**（可选）
   - 将域名指向服务器 IP
   - 配置 SSL 证书（Let's Encrypt）

---

## 部署前检查清单

- [ ] 确保代码已提交到 Git
- [ ] 测试本地构建：`npm run build`
- [ ] 检查 `.gitignore` 是否正确（排除 `node_modules`、`.next` 等）
- [ ] 确认没有硬编码的本地路径

---

## 部署后的注意事项

1. **文件上传限制**
   - 目前文件是在浏览器中处理的（不上传到服务器）
   - 如果文件很大，可能会有性能问题
   - 如果需要支持大文件，可以考虑添加文件上传到服务器的功能

2. **域名自定义**
   - Vercel/Netlify 都支持自定义域名
   - 在项目设置中添加你的域名即可

3. **环境变量**
   - 如果将来需要 API 密钥等，可以在部署平台设置环境变量

---

## 快速开始（推荐）

**最快的方式**：
1. 在 GitHub 创建仓库并推送代码
2. 访问 vercel.com，连接 GitHub 仓库
3. 点击 Deploy
4. 完成！获得公开 URL

整个过程大约 5-10 分钟。

