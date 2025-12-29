# 快速启动指南

## 正确的启动步骤

1. **打开终端，进入项目目录**：
```bash
cd /Users/k/Desktop/Player
```

2. **启动开发服务器**（注意：命令是 `npm run dev`，不要多输入）：
```bash
npm run dev
```

3. **等待服务器启动**，你会看到类似这样的输出：
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.3s
```

4. **在浏览器中打开**：
```
http://localhost:3000
```

## 常见问题

### 如果端口 3000 被占用
Next.js 会自动使用下一个可用端口（如 3001），注意查看终端输出的实际端口号。

### 如果看到编译错误
- 确保所有依赖都已安装：`npm install`
- 检查 Node.js 版本：`node --version`（需要 18 或更高）

### 如果服务器没有启动
- 按 `Ctrl + C` 停止当前进程
- 重新运行 `npm run dev`

