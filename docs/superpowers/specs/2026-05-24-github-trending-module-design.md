# GitHub 热点项目抓取模块设计

## 概述

为 Pocket Stack 项目新增 GitHub 热门项目抓取功能，通过 PocketBase pb_hooks 后端代理抓取 GitHub Trending 数据，结合 Serper.dev 搜索 API 自动采集相关文章内容和图片素材，并在前端提供浏览、管理和搜索界面。

## 架构

```
用户 → React 前端 (github-trending 模块)
        │ POST /api/github-trending/refresh
        ▼
        PocketBase pb_hooks
        │ HTTP fetch
        ├──→ GitHub Trending API (github-trending-api.vercel.app)
        │    → 获取热门项目列表
        ├──→ Serper.dev Search API (api-key: 5f1b1a39a5ec6a4312cf53e067b50972500755c2)
        │    → 搜索相关文章
        ├──→ Serper.dev Image API
        │    → 搜索图片素材
        └──→ GitHub Raw API
             → 获取 README
        │
        ▼
        PocketBase Collections
        ├── gh_trending_projects
        ├── gh_trending_articles
        ├── gh_trending_images
        └── gh_trending_settings
```

## PocketBase 数据模型

### gh_trending_projects

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `name` | text (required, unique) | 项目全名，如 `citywill/pocket-stack` |
| `description` | text (多行) | 项目描述 |
| `url` | url (required) | GitHub 仓库 URL |
| `homepage` | url | 项目官网 |
| `language` | text | 编程语言 |
| `stars` | number (int) | Star 数 |
| `forks` | number (int) | Fork 数 |
| `stars_today` | number (int) | 今日新增 Star |
| `owner_avatar` | url | 作者头像 URL |
| `readme` | text (多行) | README 全文 |
| `tags` | json | 用户自定义标签，如 `["ai","cli"]` |
| `notes` | text (多行) | 用户笔记 |
| `source` | select | 来源: `trending` / `search` / `manual` |
| `collected_at` | datetime | 首次采集时间 |

### gh_trending_articles

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `project` | relation → gh_trending_projects | 关联项目 |
| `title` | text (required) | 文章标题 |
| `url` | url (required) | 文章链接 |
| `snippet` | text (多行) | 摘要 |
| `content` | text (多行) | 文章全文内容 |
| `source` | text | 来源标识（如 `serper`） |

### gh_trending_images

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `project` | relation → gh_trending_projects | 关联项目 |
| `image_url` | url (required) | 图片 URL |
| `alt_text` | text | 图片描述 |
| `source` | text | 来源（`serper`/`github`/`manual`） |
| `is_cover` | bool | 是否封面图 |

### gh_trending_settings

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `language` | text | 筛选语言，留空表示全部 |
| `since` | select | 时间范围: `daily` / `weekly` / `monthly` |
| `auto_sync` | bool | 是否自动定时抓取 |
| `sync_interval` | number (int) | 自动抓取间隔（小时） |

## 后端 (pb_hooks)

### 文件结构

```
pb_hooks/
├── github-trending.pb.js      # 核心逻辑：API 路由 + 抓取 + 搜索
└── github-trending.cron.pb.js # 定时任务
```

### 自定义 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/github-trending/refresh` | 触发抓取，可选 query: `language`, `since` |
| GET | `/api/github-trending/status` | 返回最近抓取状态和统计数据 |

### 抓取流程

1. 调用 `https://github-trending-api.vercel.app/repositories?language={lang}&since={since}` 获取热门项目列表
2. 遍历每个项目，检查 `gh_trending_projects` 是否已存在
   - 已存在 → 更新 stars、forks、stars_today 等动态数据
   - 不存在 → 创建新记录，并触发后续搜索
3. 对新项目，调用 Serper.dev 搜索：
   - `POST https://google.serper.dev/search` → 搜索项目相关文章
   - `POST https://google.serper.dev/images` → 搜索项目相关图片
   - 结果存入 `gh_trending_articles` 和 `gh_trending_images`
4. 调用 GitHub Raw API 获取 README 内容
5. 图片素材只保存 URL 引用，不下载存储

### 错误处理

- GitHub Trending API 不可用时返回友好提示，不影响已存在数据
- Serper.dev 搜索失败时跳过搜索步骤，只保存项目信息
- 重复抓取时更新已有记录的 stars/forks 等动态数据，不创建重复
- 所有 HTTP 请求设置超时（15 秒）

### 定时任务

- 使用 PocketBase `cronAdd()`，默认每 6 小时执行一次
- 读取 `gh_trending_settings` 判断是否启用
- 创建对应的 API Key 记录在 PocketBase 中（也可直接在 hook 中配置）
- API Key 通过 `$os.getenv("SERPER_API_KEY")` 从环境变量读取，或存储在 `gh_trending_settings` 集合中

## 前端模块

### 文件结构

```
src/modules/github-trending/
├── package.json          # 模块元信息
├── menu.ts               # 菜单（"GitHub 热点"）
├── routes.tsx            # 路由定义
├── migrations/           # PocketBase 集合定义
│   ├── gh_trending_projects.json
│   ├── gh_trending_articles.json
│   ├── gh_trending_images.json
│   └── gh_trending_settings.json
└── components/
    ├── TrendingPage.tsx       # 热门项目列表
    ├── ProjectDetail.tsx      # 项目详情
    ├── CollectedProjects.tsx  # 采集管理
    └── Settings.tsx           # 配置页
```

### 页面路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/github-trending` | TrendingPage | 热门项目列表主页面，含刷新按钮和筛选 |
| `/github-trending/:id` | ProjectDetail | 项目详情（基本信息 / 文章 / 图片素材 三个 Tab） |
| `/github-trending/collected` | CollectedProjects | 所有已采集项目列表，支持搜索和标签筛选 |
| `/github-trending/settings` | Settings | 语言、时间范围、自动同步配置 |

### TrendingPage 页面设计

- 顶部：标题 + "刷新"按钮 + 语言/时间筛选
- 卡片网格布局：每个卡片显示项目名、描述、语言标签、Star 数、今日增长、作者头像
- 点击卡片跳转到详情页
- 刷新时显示 loading 动画

### ProjectDetail 页面设计

- 顶部：项目名、Star/Fork 统计、语言标签
- Tab 切换：
  - **概览**：README 内容预览、项目元信息
  - **文章**：相关文章列表（标题、来源、链接、摘要）
  - **图片素材**：图片网格展示，可标记封面图

### CollectedProjects 页面设计

- 搜索框 + 标签筛选
- 表格/卡片列表展示所有已采集项目
- 支持标签编辑和笔记添加

## 部署说明

1. 将 `pb_hooks/` 目录复制到 PocketBase 数据目录
2. 在前端 `.env` 中配置 Serper.dev API Key（或通过 PocketBase 管理界面配置）
3. 重启 PocketBase 服务加载 hooks
4. 在前端模块管理页面初始化 collections
5. 访问 `/github-trending` 使用功能

## 未涵盖的范围（YAGNI）

- 用户评论/讨论功能
- 项目对比功能
- 导出数据为 CSV/Excel
- 社交媒体分享功能
