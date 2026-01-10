# 详细步骤指南 - 配置云端同步

## 第三步：获取 Supabase 密钥

### 步骤 3.1：打开 Supabase 项目设置

1. 在 Supabase 项目页面（你已经创建了项目）
2. 点击左侧边栏的 **"Settings"**（齿轮图标 ⚙️）
3. 在 Settings 菜单中，点击 **"API"**

### 步骤 3.2：复制密钥

在 API 页面，你会看到两个重要的值：

1. **Project URL**
   - 位置：在 "Project URL" 标签下
   - 格式类似：`https://abcdefghijklmnop.supabase.co`
   - 点击旁边的复制按钮（📋）复制它

2. **anon public key**
   - 位置：在 "Project API keys" 部分，找到 "anon public"
   - 格式：一个很长的字符串，以 `eyJ` 开头
   - 点击旁边的 "Reveal" 或直接点击复制按钮

**重要**：把这两个值先保存在记事本或文本文件中，下一步会用到。

---

## 第四步：配置项目

### 步骤 4.1：创建 .env.local 文件

#### 方法 A：使用终端（推荐）

1. 打开终端（Terminal）
2. 进入项目目录：
   ```bash
   cd /Users/k/Desktop/Player
   ```

3. 创建文件：
   ```bash
   touch .env.local
   ```

4. 打开文件编辑：
   ```bash
   open -e .env.local
   ```
   或者使用你喜欢的编辑器打开

5. 在文件中粘贴以下内容（**替换成你刚才复制的值**）：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=你的_Project_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_public_key
   ```

6. **替换示例**：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

7. 保存文件（`Cmd + S`）

#### 方法 B：使用代码编辑器

1. 在 VS Code 或 Cursor 中
2. 在项目根目录（`/Users/k/Desktop/Player`）创建新文件
3. 文件名：`.env.local`（注意前面有个点）
4. 粘贴上面的内容并替换值
5. 保存

### 步骤 4.2：安装依赖

在终端中执行（确保在项目目录 `/Users/k/Desktop/Player`）：

```bash
npm install @supabase/supabase-js
```

**等待安装完成**，你会看到类似这样的输出：
```
added 1 package, and audited XXX packages in Xs
```

### 步骤 4.3：重启开发服务器

1. **如果服务器正在运行**：
   - 在运行 `npm run dev` 的终端窗口
   - 按 `Ctrl + C` 停止服务器
   - 然后重新运行：
     ```bash
     npm run dev
     ```

2. **如果服务器没有运行**：
   - 直接运行：
     ```bash
     npm run dev
     ```

3. **等待服务器启动**，你会看到：
   ```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3000
   ✓ Ready in X.Xs
   ```

---

## 验证是否成功

1. 打开浏览器，访问 `http://localhost:3000`
2. 在文件上传区域，应该能看到：
   - **"云端同步已启用 - 文件将在所有设备间同步"** 的绿色提示框
3. 上传一个文件测试
4. 在手机上打开同一个网页，应该能看到上传的文件

---

## 如果遇到问题

### 问题 1：找不到 .env.local 文件
- 确保文件名是 `.env.local`（前面有点）
- 确保文件在项目根目录（和 `package.json` 同一级）

### 问题 2：npm install 失败
- 检查网络连接
- 尝试：`npm install @supabase/supabase-js --legacy-peer-deps`

### 问题 3：看不到"云端同步已启用"提示
- 检查 `.env.local` 文件内容是否正确
- 确保重启了开发服务器
- 检查浏览器控制台是否有错误（按 F12 打开）

### 问题 4：不知道如何打开终端
- **Mac**: 按 `Cmd + 空格`，输入 "Terminal"，回车
- **Windows**: 按 `Win + R`，输入 `cmd`，回车

---

## 需要帮助？

如果某个步骤不清楚，告诉我具体是哪一步，我会详细解释！





