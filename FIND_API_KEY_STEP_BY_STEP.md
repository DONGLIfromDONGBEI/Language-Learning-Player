# 找到 API Keys 的正确步骤

## 🎯 你当前的位置

你现在在 **"Data API"** 页面，但我们需要的是 **"API Keys"** 页面。

## ✅ 正确步骤

### 步骤 1: 在左侧菜单找到 "API Keys"

看左侧边栏的 **"PROJECT SETTINGS"** 部分，你会看到：

```
PROJECT SETTINGS
├── General
├── Compute and Disk
├── Infrastructure
├── Integrations
├── Data API          ← 你在这里
├── API Keys          ← 点击这个！
├── JWT Keys
└── ...
```

### 步骤 2: 点击 "API Keys"

点击左侧菜单中的 **"API Keys"**（在 "Data API" 下面）

### 步骤 3: 在 API Keys 页面找到密钥

点击 "API Keys" 后，你会看到：

1. **Project URL**（页面顶部）
   - 你已经看到了：`https://gtelykmkljvlelhiiwpk.supabase.co`
   - 这个就是 `NEXT_PUBLIC_SUPABASE_URL`

2. **Project API keys**（页面下方）
   - 在这个部分，你会看到类似这样的表格：
   
   | Name | Key | Actions |
   |------|-----|---------|
   | **anon** | `public` | `••••••••` [Reveal] [Copy] |
   | **service_role** | `secret` | `••••••••` [Reveal] [Copy] |

3. 找到 **"anon"** 这一行，点击 **"Reveal"** 显示密钥，然后点击 **"Copy"** 复制

## 📝 总结

1. ✅ 你已经找到了 Project URL：`https://gtelykmkljvlelhiiwpk.supabase.co`
2. ⏭️ 现在需要：点击左侧菜单的 **"API Keys"**
3. 📋 在 API Keys 页面复制 **anon public key**

## 🆘 如果左侧菜单没有 "API Keys"

有时候界面可能不同，试试：
- 在 Settings 下找 "Keys" 或 "API Keys"
- 或者直接访问：`https://app.supabase.com/project/gtelykmkljvlelhiiwpk/settings/api/keys`

告诉我点击 "API Keys" 后你看到了什么！





