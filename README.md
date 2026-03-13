# good-idea 

**good-idea** 是一款面向个人知识管理与想法记录的全栈应用，采用类似 Obsidian 的多栏布局，支持本地文件树、多标签编辑、多格式文档预览、关系图谱、白板、内置终端以及基于本地知识库的 AI 助手（RAG 问答）。

前端为 React 单页应用，后端为 Node.js/Express 服务，使用 Docker Compose 一键部署。

---

## 功能概览

- **文件树管理** — 浏览、创建、重命名、删除文件和文件夹，左侧可拖拽调整宽度的侧栏
- **多标签编辑与预览** — 在标签页中同时打开多个文档，实时切换
- **多格式文档预览**
  - Markdown（GFM 语法、代码高亮）
  - PDF 预览
  - Word (`.docx`) 预览
  - Excel (`.xlsx`) 预览
- **AI 助手 / RAG 问答** — 基于 ChromaDB 向量索引 + 阿里云 DashScope 大模型，对本地知识库进行问答与内容总结，流式返回并标注来源文件
- **白板** — 基于 tldraw 的自由画布，用于头脑风暴与可视化记录
- **关系图谱** — 力导向图（react-force-graph-2d）展示文档节点关系
- **内置终端** — WebSocket + xterm，连接后端 PTY 在应用内直接使用系统 Shell
- **全局搜索** — 快速检索文件和内容
- **用户认证** — JWT 登录，首次登录自动注册
- **主题与设置** — 支持深色/浅色主题切换，可为每个用户配置 LLM API Key 和模型
- **双数据库支持** — 默认 SQLite 本地存储，可切换为 Supabase (PostgreSQL) 远程存储

---

### 基础设施

| 组件 | 说明 |
|------|------|
| Docker Compose | 容器编排，含 chroma / server / web 三个服务 |
| Nginx | 前端静态资源托管 + API/WS 反向代理 |
| ChromaDB | 向量数据库，持久化存储 |
| SQLite | 默认文件数据库，存储文件树与内容 |

---

## 项目结构

```
good-idea/
├── .env.example               # 根目录环境变量示例
├── docker-compose.yml         # Docker Compose 编排（chroma + server + web）
├── entrypoint.sh              # 容器入口脚本
├── PLAN.md                    # RAG 功能实施计划
├── PROJECT.md                 # 详细项目架构文档
│
├── server/                    # 后端服务
│   ├── .env.example           # 后端环境变量示例
│   ├── Dockerfile             # 后端镜像构建
│   ├── package.json
│   ├── supabase-schema.sql    # Supabase files 表建表脚本
│   ├── supabase-auth-schema.sql
│   └── src/
│       ├── index.js           # Express 入口：路由、WebSocket、静态托管
│       ├── db.js              # 数据访问入口（Supabase / SQLite 自动切换）
│       ├── sqlite.js          # SQLite 初始化与连接
│       ├── routes/
│       │   ├── ai.js          # RAG 对话、embedding 管理
│       │   ├── auth.js        # 登录 / 注册
│       │   ├── files.js       # 文件 CRUD
│       │   └── settings.js    # 用户设置
│       ├── services/
│       │   ├── chroma.js      # ChromaDB 客户端封装
│       │   ├── embedding.js   # 文本分块 + DashScope Embedding
│       │   ├── textExtractors.js  # 多格式文档文本提取
│       │   └── users.js       # 用户服务
│       ├── data/
│       │   ├── filesSource.js     # 统一文件数据源
│       │   ├── settingsStore.js   # 设置存储
│       │   └── usersStore.js      # 用户存储
│       ├── middleware/
│       │   └── auth.js        # JWT 认证中间件
│       └── cli/
│           ├── index.js       # CLI 入口
│           ├── wsTerminal.js  # WebSocket 终端
│           └── ...            # 命令解析、补全、历史等
│
└── web/                       # 前端应用
    ├── Dockerfile             # 前端镜像构建（多阶段：build → nginx）
    ├── nginx.conf             # Nginx 配置（静态托管 + 反向代理）
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts         # Vite 配置：/api、/ws 代理到后端
    └── src/
        ├── App.tsx            # 根组件：Antd ConfigProvider + 深色主题
        ├── main.tsx           # 应用入口
        ├── layout/            # 布局与页面级组件
        │   ├── AppLayout.tsx
        │   ├── HeaderBar.tsx / MainNav.tsx
        │   ├── ResizableSidebar.tsx / LeftIconSidebar.tsx
        │   ├── MainContent.tsx / MainArea.tsx / TabContent.tsx
        │   ├── FileContent.tsx        # 文件内容区
        │   ├── AIPanel.tsx            # RAG 对话面板
        │   ├── TerminalPanel.tsx      # 终端面板
        │   ├── SearchModal.tsx        # 全局搜索
        │   ├── SettingsModal.tsx      # 设置弹窗
        │   ├── WelcomePage.tsx        # 欢迎页
        │   └── ...
        ├── components/
        │   ├── FileTree.tsx           # 文件树组件
        │   ├── GraphView.tsx          # 力导向关系图
        │   ├── WhiteboardView.tsx     # tldraw 白板
        │   ├── RequireAuth.tsx        # 路由守卫
        │   └── viewers/
        │       ├── MdViewer.tsx       # Markdown 预览
        │       ├── PdfViewer.tsx      # PDF 预览
        │       ├── DocxViewer.tsx     # Word 预览
        │       └── XlsxViewer.tsx     # Excel 预览
        ├── store/                     # Zustand 全局状态
        │   ├── layout.ts             # 布局状态
        │   ├── fileTree.ts           # 文件树状态
        │   ├── bookmarks.ts          # 书签状态
        │   ├── auth.ts               # 认证状态
        │   └── settings.ts           # 设置状态
        ├── lib/
        │   ├── api.ts                # HTTP 请求封装
        │   └── docxReplace.ts
        ├── hooks/
        │   └── useUploadFile.ts      # 文件上传 Hook
        ├── pages/
        │   └── LoginPage.tsx         # 登录页
        ├── api/
        │   └── settings.ts           # 设置 API
        └── utils/
            ├── fileTypes.ts          # 文件类型工具
            ├── graph.ts              # 图谱工具
            ├── markdownLinks.ts      # Markdown 链接解析
            └── upload.ts             # 上传工具
```

---

## 本地开发

### 前置要求

- Node.js >= 20
- Docker（用于运行 ChromaDB，RAG 功能需要）

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd web
npm install
```

### 2. 配置环境变量

复制 `server/.env.example` 为 `server/.env`，填入必要配置：

```bash
PORT=3001
SQLITE_PATH=./data/app.db
JWT_SECRET=your_jwt_secret
DASHSCOPE_API_KEY=your_dashscope_key          # embedding modal / chat modal api
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 # 或其他服务商
CHROMA_URL=http://localhost:8000              
```

### 3. 启动 ChromaDB

```bash
docker run -d -p 8000:8000 chromadb/chroma
```

或使用 Docker Compose 单独启动：

```bash
docker-compose up -d chroma
```

### 4. 启动开发服务

```bash
# 终端 1：启动后端（http://localhost:3001）
cd server
npm run dev

# 终端 2：启动前端（http://localhost:5173）
cd web
npm run dev
```

### 5. 数据库选择

- **SQLite（默认）** — 后端自动在 `SQLITE_PATH` 位置创建数据库文件及 `files` 表，开箱即用
- **Supabase（可选）** — 在 Supabase 项目中执行 `server/supabase-schema.sql` 建表，然后在 `.env` 中配置 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`，后端会自动切换到 Supabase

---

## 构建与生产运行

### Docker Compose 部署

项目提供完整的 Docker Compose 编排，包含三个服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| `chroma` | 8000 | ChromaDB 向量数据库，持久化存储 |
| `server` | 3001 | Node.js 后端，SQLite 数据存储在 Docker Volume |
| `web` | 80 | Nginx 托管前端静态资源，反向代理 API 和 WebSocket 到后端 |

#### 部署步骤

1. 在项目根目录创建 `.env` 文件：

`cp .env.example .env`

```bash
DASHSCOPE_API_KEY=your_dashscope_key
JWT_SECRET=your_jwt_secret
```

1. 构建并启动所有服务：

```bash
docker-compose up -d
```

3. 访问 `http://localhost` 即可使用。

#### 架构示意

```
浏览器 ---> Nginx (:80)
              ├── 静态资源 (web/dist)
              ├── /api/* ---> Express Server (:3001)
              │                  ├── SQLite (/data/app.db)
              │                  └── ChromaDB (:8000)
              └── /ws/*  ---> Express Server (WebSocket)
```

#### 持久化

Docker Compose 定义了两个 Volume：

- `chroma_data` — ChromaDB 向量数据
- `server_data` — SQLite 数据库文件 (`/data/app.db`)

---

## 环境变量

### 后端 (`server/.env`)

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | `3001` | 服务端口 |
| `SQLITE_PATH` | 否 | `/data/app.db` | SQLite 数据库文件路径 |
| `JWT_SECRET` | 是 | — | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | 否 | `7d` | JWT 过期时间 |
| `DASHSCOPE_API_KEY` | RAG 需要 | — | 阿里云 DashScope API Key |
| `DASHSCOPE_BASE_URL` | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | DashScope API 地址 |
| `CHROMA_URL` | RAG 需要 | `http://localhost:8000` | ChromaDB 服务地址 |
| `SUPABASE_URL` | 否 | — | Supabase 项目 URL（配置后启用 Supabase 存储） |
| `SUPABASE_ANON_KEY` | 否 | — | Supabase 匿名密钥 |
| `JSON_BODY_LIMIT` | 否 | — | 请求体大小限制 |

---

## 数据库结构

`files` 表（SQLite 与 Supabase 共用同一结构）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT (PK) | 文件/文件夹 ID |
| `name` | TEXT | 名称 |
| `type` | TEXT | `'file'` 或 `'folder'` |
| `parent_id` | TEXT (FK) | 父节点 ID，级联删除 |
| `content` | TEXT | 文件内容 |
| `ext` | TEXT | 文件扩展名 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

---

## 支持的文件类型

| 类型 | 扩展名 | 预览 | RAG 索引 |
|------|--------|------|----------|
| Markdown | `.md` | MdViewer（GFM + 代码高亮） | 支持 |
| 纯文本 | `.txt` | 纯文本显示 | 支持 |
| PDF | `.pdf` | PdfViewer (react-pdf) | 支持 |
| Word | `.docx` | DocxViewer (mammoth / docx-preview) | 支持 |
| Excel | `.xlsx` | XlsxViewer (xlsx) | 支持 |

---
