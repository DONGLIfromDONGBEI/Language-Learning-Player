# 英语听力学习播放器

基于 Next.js (App Router) 和 Tailwind CSS 的英语听力学习播放器组件，专为听写训练设计。

## 功能特性

### 1. 数据结构
播放器接收 `journalData` 数组，每个对象包含：
- `id`: 唯一标识符
- `startTime`: 开始时间（秒）
- `endTime`: 结束时间（秒）
- `englishText`: 英文文本
- `chineseText`: 中文文本

### 2. 倍速系统
提供 YouTube 风格的倍速选择器，支持以下档位：
- 0.4x, 0.6x, 0.8x, 1.0x, 1.2x, 1.5x, 2.0x

### 3. 字幕三态逻辑
通过按钮在三种状态间循环切换：
- **English**: 仅显示英文，隐藏中文
- **Bilingual**: 同时显示中英文
- **Hidden**: 所有文本不可见（保留布局高度，避免页面抖动），适合纯听写

### 4. 核心交互
- **高亮跟随**: 当前播放时间对应的字幕块自动高亮（浅蓝色背景）
- **点击跳转**: 点击任何字幕块，音频自动跳转到该句的 `startTime` 并开始播放
- **单句循环**: 每个字幕块右侧的 Loop 图标，点击后音频仅在该句的 `startTime` 到 `endTime` 之间循环

### 5. 键盘快捷键
- **空格键**: 播放/暂停
- **右箭头 (→) 或 N 键**: 跳转到下一句并自动开启循环播放
- **左箭头 (←) 或 P 键**: 跳转到上一句并自动开启循环播放

> 注意：当用户在输入框中输入时，快捷键会被禁用，避免干扰正常输入。

### 6. UI 设计
- 深色模式主题
- 英文使用 Inter 无衬线字体
- 中文使用苹方字体
- Pollykann 风格的简洁设计

## 安装和启动

### 方法 1: 使用启动脚本

```bash
./start.sh
```

### 方法 2: 手动启动

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 注意事项

- 如果遇到权限问题，请确保你有执行权限
- 确保已安装 Node.js (版本 18 或更高)
- 将音频文件放在 `public` 目录下，然后在代码中引用（如 `/your-audio.mp3`）

## 使用方法

### 上传本地文件

1. **上传音频文件**：
   - 点击"选择音频文件"按钮
   - 选择你的音频文件（支持 MP3, WAV, OGG, M4A 等格式）
   - 文件会在浏览器中直接加载，无需上传到服务器

2. **上传字幕文件**：
   - 点击"选择字幕文件"按钮
   - 选择 JSON 格式的字幕文件
   - 字幕文件格式示例见下方

### 字幕文件格式

支持 **SRT 格式**（推荐）和 JSON 格式（向后兼容）。

#### SRT 格式（推荐）

SRT 是标准的字幕文件格式，格式如下：

```
1
00:00:00,000 --> 00:00:03,500
Hello, welcome to today's listening practice.
你好，欢迎来到今天的听力练习。

2
00:00:03,500 --> 00:00:07,200
We will be working on improving your listening skills.
我们将致力于提高你的听力技能。
```

**格式说明**：
- 第一行：序号（从 1 开始）
- 第二行：时间码，格式为 `HH:MM:SS,mmm --> HH:MM:SS,mmm`（逗号或点都可以）
- 第三行及之后：文本内容
  - 包含中文字符的行会被识别为中文
  - 不包含中文字符的行会被识别为英文
  - 可以有多行，会自动合并

#### JSON 格式（向后兼容）

```json
[
  {
    "id": "1",
    "startTime": 0,
    "endTime": 3.5,
    "englishText": "Hello, welcome to today's listening practice.",
    "chineseText": "你好，欢迎来到今天的听力练习。"
  }
]
```

**字段说明**：
- `id`: 唯一标识符（字符串）
- `startTime`: 开始时间（秒，数字）
- `endTime`: 结束时间（秒，数字）
- `englishText`: 英文文本（字符串）
- `chineseText`: 中文文本（字符串）

### 示例文件

- `public/example-subtitles.srt` - SRT 格式示例（推荐）
- `public/example-subtitles.json` - JSON 格式示例（向后兼容）

### 作为组件使用

```tsx
import ListeningPlayer from '@/components/ListeningPlayer'
import { JournalEntry } from '@/types'

const journalData: JournalEntry[] = [
  {
    id: '1',
    startTime: 0,
    endTime: 3.5,
    englishText: 'Hello, welcome to today\'s listening practice.',
    chineseText: '你好，欢迎来到今天的听力练习。',
  },
  // ... 更多条目
]

<ListeningPlayer 
  journalData={journalData} 
  audioUrl="/path/to/audio.mp3" 
/>
```

## 项目结构

```
Player/
├── app/
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 首页（示例）
│   └── globals.css     # 全局样式
├── components/
│   └── ListeningPlayer.tsx  # 播放器组件
├── types/
│   └── index.ts        # TypeScript 类型定义
└── package.json
```

## 部署到云端

要让其他人也能使用这个应用，需要将项目部署到云端。

### 🚀 快速部署（推荐）

**一键部署脚本**：
```bash
./deploy.sh
```

按照提示操作即可！

### 📖 详细步骤

查看 [DEPLOY_STEPS.md](./DEPLOY_STEPS.md) 获取完整的部署指南。

### ✨ 部署后的优势

- ✅ **永久链接**：部署后获得永久 URL，只要不删除就一直可用
- ✅ **自动更新**：推送代码到 GitHub，Vercel 自动重新部署
- ✅ **完全免费**：GitHub + Vercel 免费套餐完全够用
- ✅ **版本管理**：GitHub 保存所有版本，可以随时回退
- ✅ **全球访问**：任何人都可以通过 URL 访问你的应用

### 📝 关于数据存储

当前使用浏览器 IndexedDB 存储文件：
- ✅ 完全免费，不需要服务器存储
- ✅ 隐私保护，数据不离开用户设备
- ⚠️ 换设备或清除浏览器数据会丢失（这是正常的）

如果需要跨设备同步，可以后续添加云端存储功能。

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

