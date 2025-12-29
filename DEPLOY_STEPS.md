# 部署步骤指南

## 目标
1. 将项目部署到云端，让任何人都能访问
2. 永久保留，不需要每次重新搭建
3. 支持版本升级和更新

## 方案：GitHub + Vercel（完全免费）

### 第一步：准备 GitHub 账户

1. 访问 [github.com](https://github.com)
2. 如果没有账户，点击 "Sign up" 注册（免费）
3. 登录你的账户

### 第二步：在 GitHub 创建新仓库

1. 点击右上角的 "+" 号，选择 "New repository"
2. 填写仓库信息：
   - Repository name: `listening-player`（或你喜欢的名字）
   - Description: `English listening practice player`
   - 选择 **Public**（公开，免费）
   - **不要**勾选 "Add a README file"（我们已经有了）
3. 点击 "Create repository"

### 第三步：将代码推送到 GitHub

在终端中执行以下命令（我会帮你创建脚本）：

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交代码
git commit -m "Initial commit: Listening Player with dictation feature"

# 4. 连接到 GitHub（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/listening-player.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

**注意**：执行第 4 步时，需要替换 `YOUR_USERNAME` 为你的实际 GitHub 用户名。

### 第四步：部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up"，使用 GitHub 账户登录
3. 登录后，点击 "Add New Project"
4. 选择你刚才创建的 GitHub 仓库
5. Vercel 会自动检测 Next.js 项目
6. 直接点击 "Deploy"（不需要修改任何设置）
7. 等待 1-2 分钟，部署完成

### 第五步：获得永久链接

部署完成后，你会得到：
- **生产环境 URL**：`https://your-project-name.vercel.app`
- 这个链接是**永久的**，只要不删除项目就一直可用
- 任何人都可以通过这个链接访问你的应用

### 第六步：自动更新（可选）

以后如果需要更新功能：
1. 修改本地代码
2. 执行：
   ```bash
   git add .
   git commit -m "Update: 描述你的更新"
   git push
   ```
3. Vercel 会自动检测到更新并重新部署（通常 1-2 分钟）

## 关于文件存储的说明

**重要**：目前文件存储在浏览器的 IndexedDB 中，这意味着：
- ✅ 每个用户在自己的浏览器中保存文件（隐私保护）
- ✅ 不需要服务器存储空间
- ✅ 完全免费

**限制**：
- 文件只保存在用户的浏览器中
- 换设备或清除浏览器数据会丢失文件
- 如果需要跨设备同步，需要后续添加云端存储功能

## 常见问题

### Q: 部署后功能都能正常使用吗？
A: 是的！所有功能都能正常使用：
- ✅ 文件上传（浏览器本地处理）
- ✅ 音频播放
- ✅ 字幕显示
- ✅ 听写功能
- ✅ 键盘快捷键
- ✅ 文件持久化存储（IndexedDB）

### Q: 需要付费吗？
A: 不需要！GitHub 和 Vercel 的免费套餐完全够用：
- GitHub：无限公开仓库
- Vercel：无限部署、自动 HTTPS、全球 CDN

### Q: 如何更新版本？
A: 推送代码到 GitHub，Vercel 会自动重新部署。

### Q: 可以自定义域名吗？
A: 可以！在 Vercel 项目设置中添加你的域名即可。

## 下一步

执行 `./deploy.sh` 脚本，按照提示操作即可！

