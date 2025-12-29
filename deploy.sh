#!/bin/bash

# 部署脚本
# 帮助用户将项目部署到 GitHub 和 Vercel

echo "=========================================="
echo "  听力播放器部署脚本"
echo "=========================================="
echo ""

# 检查是否已初始化 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    echo "✅ Git 仓库初始化完成"
    echo ""
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 发现未提交的更改，正在添加..."
    git add .
    echo ""
    
    echo "💾 提交更改..."
    git commit -m "Initial commit: Listening Player with dictation feature"
    echo "✅ 代码已提交"
    echo ""
else
    echo "ℹ️  没有未提交的更改"
    echo ""
fi

# 提示用户输入 GitHub 信息
echo "=========================================="
echo "  连接到 GitHub"
echo "=========================================="
echo ""
echo "请确保你已经："
echo "1. 在 GitHub 上创建了新仓库"
echo "2. 知道你的 GitHub 用户名和仓库名"
echo ""

read -p "请输入你的 GitHub 用户名: " GITHUB_USERNAME
read -p "请输入你的仓库名（例如：listening-player）: " REPO_NAME

GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo ""
echo "🔗 正在连接到 GitHub..."
echo "URL: ${GITHUB_URL}"
echo ""

# 检查是否已设置 remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  已存在 remote 'origin'"
    read -p "是否要更新为新的 URL? (y/n): " UPDATE_REMOTE
    if [ "$UPDATE_REMOTE" = "y" ]; then
        git remote set-url origin "$GITHUB_URL"
        echo "✅ Remote URL 已更新"
    fi
else
    git remote add origin "$GITHUB_URL"
    echo "✅ 已添加 GitHub remote"
fi

echo ""
echo "📤 正在推送到 GitHub..."
echo ""

# 设置分支名
git branch -M main

# 推送代码
if git push -u origin main; then
    echo ""
    echo "=========================================="
    echo "  ✅ 代码已成功推送到 GitHub！"
    echo "=========================================="
    echo ""
    echo "下一步："
    echo "1. 访问 https://vercel.com"
    echo "2. 使用 GitHub 账户登录"
    echo "3. 点击 'Add New Project'"
    echo "4. 选择你的仓库: ${REPO_NAME}"
    echo "5. 点击 'Deploy'"
    echo ""
    echo "几分钟后，你会得到一个永久的 URL，"
    echo "任何人都可以通过这个 URL 访问你的应用！"
    echo ""
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "1. GitHub 仓库不存在或 URL 错误"
    echo "2. 需要输入 GitHub 用户名和密码（或使用 Personal Access Token）"
    echo "3. 网络连接问题"
    echo ""
    echo "请检查："
    echo "- 仓库 URL 是否正确: ${GITHUB_URL}"
    echo "- 是否已在 GitHub 创建了仓库"
    echo ""
fi

