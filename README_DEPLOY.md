# 快速部署指南

## 🚀 一键部署（推荐）

### 方法 1: 使用部署脚本

```bash
./deploy.sh
```

按照脚本提示操作即可！

### 方法 2: 手动部署

#### 步骤 1: 创建 GitHub 仓库

1. 访问 [github.com](https://github.com) 并登录
2. 点击右上角 "+" → "New repository"
3. 填写仓库名（如：`listening-player`）
4. 选择 **Public**
5. 点击 "Create repository"

#### 步骤 2: 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 连接到 GitHub（替换 YOUR_USERNAME 和 REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

**注意**：首次推送可能需要输入 GitHub 用户名和密码（或 Personal Access Token）

#### 步骤 3: 部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 点击 "Add New Project"
4. 选择你的仓库
5. 点击 "Deploy"
6. 等待 1-2 分钟

#### 步骤 4: 获得永久链接

部署完成后，你会得到一个类似这样的 URL：
```
https://your-project-name.vercel.app
```

**这个链接是永久的**，只要不删除项目就一直可用！

## 📝 关于版本管理

### 如何更新版本？

1. 修改本地代码
2. 提交并推送：
   ```bash
   git add .
   git commit -m "Update: 描述你的更新"
   git push
   ```
3. Vercel 会自动检测并重新部署（1-2 分钟）

### 如何保留软件？

- ✅ **Vercel 部署是永久的**：只要不删除项目，URL 一直可用
- ✅ **GitHub 仓库是永久的**：代码永久保存
- ✅ **自动部署**：每次推送代码自动更新
- ✅ **版本历史**：GitHub 保存所有版本，可以随时回退

## 🔒 关于数据存储

### 当前方案（IndexedDB）

- ✅ 文件存储在用户浏览器中
- ✅ 完全免费，不需要服务器存储
- ✅ 隐私保护，数据不离开用户设备
- ⚠️ 换设备或清除浏览器数据会丢失

### 未来扩展（可选）

如果需要跨设备同步，可以添加：
- Supabase（免费云数据库和存储）
- Firebase Storage
- AWS S3

## ❓ 常见问题

**Q: 部署后所有功能都能用吗？**
A: 是的！所有功能都能正常使用。

**Q: 需要付费吗？**
A: 不需要！GitHub 和 Vercel 的免费套餐完全够用。

**Q: 可以自定义域名吗？**
A: 可以！在 Vercel 项目设置中添加你的域名。

**Q: 如何让其他人使用？**
A: 分享 Vercel 给你的 URL 即可，任何人都可以访问。

## 🎯 总结

1. **部署一次，永久使用**：Vercel 部署后 URL 永久有效
2. **自动更新**：推送代码到 GitHub，Vercel 自动重新部署
3. **完全免费**：GitHub + Vercel 免费套餐足够使用
4. **版本管理**：GitHub 保存所有版本，可以随时回退

现在就开始部署吧！🚀

