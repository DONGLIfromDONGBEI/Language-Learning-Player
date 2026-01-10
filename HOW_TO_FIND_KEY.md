# 如何找到 Supabase anon public key

## 🎯 详细步骤（带截图说明）

### 步骤 1: 进入项目 Dashboard

1. 访问 [supabase.com](https://supabase.com)
2. 登录你的账户
3. 点击你的项目（`listening-player` 或你创建的项目名）

### 步骤 2: 打开 Settings

在左侧边栏，找到并点击：
- **"Settings"** 或 **"⚙️ Settings"**
- 位置：通常在左侧菜单的最下面

### 步骤 3: 点击 API

点击 Settings 后，会展开子菜单，点击：
- **"API"**

### 步骤 4: 找到 Project API keys

在 API 页面，向下滚动，找到 **"Project API keys"** 部分

在这个部分，你会看到类似这样的表格：

| Name | Key | Actions |
|------|-----|---------|
| **anon** | `public` | `••••••••` [Reveal] [Copy] |
| **service_role** | `secret` | `••••••••` [Reveal] [Copy] |

### 步骤 5: 复制 anon public key

找到 **"anon"** 这一行：
1. 如果密钥被隐藏（显示为 `••••••••`），点击 **"Reveal"** 按钮
2. 密钥会显示出来（很长的字符串，以 `eyJ` 开头）
3. 点击 **"Copy"** 按钮复制

## 📋 你需要复制的两个值

### 1. Project URL
- **位置**：API 页面顶部
- **标签**：`Project URL`
- **格式**：`https://xxxxx.supabase.co`
- **用途**：`NEXT_PUBLIC_SUPABASE_URL`

### 2. anon public key
- **位置**：API 页面下方，"Project API keys" 部分
- **标签**：`anon` `public`
- **格式**：很长的字符串，以 `eyJ` 开头
- **用途**：`NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔍 如果还是找不到

### 方法 1: 使用页面搜索

1. 在 Supabase 页面按 `Cmd/Ctrl + F` 打开搜索
2. 搜索 "anon" 或 "public key"
3. 应该能直接定位到

### 方法 2: 检查不同的标签

有时候界面可能显示为：
- `anon` `public` key
- `anon` key (public)
- `public` anon key
- 或者只有 `anon` 标签

**关键**：找带有 **"anon"** 和 **"public"** 的密钥，**不要**复制 `service_role` 或 `secret` 的密钥。

### 方法 3: 直接访问 URL

如果菜单找不到，可以直接访问：
```
https://app.supabase.com/project/你的项目ID/settings/api
```

替换 `你的项目ID` 为你的实际项目 ID（在项目 URL 中可以看到）

## 📸 界面可能的样子

```
┌─────────────────────────────────────┐
│  Settings > API                     │
├─────────────────────────────────────┤
│                                     │
│  Project URL                        │
│  https://xxxxx.supabase.co  [Copy]  │
│                                     │
│  ...                                │
│                                     │
│  Project API keys                   │
│  ┌──────────────────────────────┐  │
│  │ anon    public  •••• [Reveal]│  │ ← 这个！
│  │ service_role secret •••• [Reveal]│
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## ⚠️ 重要提示

- ✅ 复制 **"anon"** `public` 密钥
- ❌ **不要**复制 `service_role` `secret` 密钥
- ✅ 密钥很长（200+ 字符），确保完整复制

## 🆘 如果还是找不到

请告诉我：
1. 你在 Supabase 的哪个页面？（截图或描述）
2. 点击 Settings 后看到了什么选项？
3. 有没有看到 "API" 选项？

或者，你可以：
- 告诉我你在 Supabase 页面看到了什么
- 我可以根据你的描述提供更精确的指导





