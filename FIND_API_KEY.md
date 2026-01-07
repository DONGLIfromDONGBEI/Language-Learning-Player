# 如何找到 Supabase API 密钥

## 📍 详细步骤

### 第一步：进入 Settings

1. 在 Supabase 项目 Dashboard 页面
2. 看左侧边栏，找到 **"Settings"**（设置）
   - 图标是齿轮 ⚙️
   - 通常在左侧菜单的最下面

### 第二步：进入 API 设置

1. 点击 "Settings" 后，会展开一个子菜单
2. 点击 **"API"**（不是 "General" 或其他选项）

### 第三步：找到 API Keys

在 API 页面，你会看到几个部分：

#### 部分 1: Project URL
- 在页面顶部
- 标签是 **"Project URL"**
- 值类似：`https://abcdefghijklmnop.supabase.co`
- 这个就是 `NEXT_PUBLIC_SUPABASE_URL`

#### 部分 2: Project API keys
在这个部分，你会看到几个密钥：

1. **anon public** ← 这个就是你要找的！
   - 标签：`anon` `public`
   - 如果密钥被隐藏，会显示为 `••••••••`
   - 点击 **"Reveal"** 或眼睛图标 👁️ 来显示
   - 然后点击复制按钮 📋

2. **service_role** (secret) - 这个不需要，不要复制这个

## 🔍 如果还是找不到

### 方法 1: 检查页面布局

API 页面通常的结构是：
```
Settings
  ├── General
  ├── API          ← 点击这个
  ├── Database
  └── ...
```

### 方法 2: 直接访问 URL

如果找不到菜单，可以直接访问：
```
https://supabase.com/dashboard/project/你的项目ID/settings/api
```

### 方法 3: 使用搜索

在 Supabase Dashboard 顶部有搜索框，搜索 "API" 或 "key"

## 📝 密钥格式

anon public key 的特征：
- 非常长（通常 200+ 个字符）
- 以 `eyJ` 开头
- 包含很多字母、数字和特殊字符
- 格式类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## ⚠️ 重要提示

- 确保复制的是 **"anon public"** 密钥
- **不要**复制 "service_role" 密钥（那个是 secret，不安全）
- 如果密钥被隐藏，先点击 "Reveal" 再复制

## 🆘 如果还是找不到

告诉我：
1. 你在 Supabase 的哪个页面？
2. 左侧菜单有哪些选项？
3. 点击 Settings 后看到了什么？

我可以根据你的具体情况提供更精确的指导！



