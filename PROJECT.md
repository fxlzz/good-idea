# 好想法 (good-idea) 项目文档

记录好想法的应用，Obsidian 式布局，支持文件树、多格式预览、知识库 RAG 问答、白板与终端等能力。

---

## 一、技术栈总览

### 前端 (web/)

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | React 19 | 使用当前稳定版 |
| 构建 | Vite 7 | 开发服务器与打包 |
| 语言 | TypeScript 5.9 | 类型安全 |
| UI | Ant Design 6 | 组件库，深色主题 + 中文 locale |
| 路由 | react-router-dom 7 | 单页路由 |
| 状态 | Zustand 5 | 全局状态（layout、fileTree、bookmarks） |
| Markdown | react-markdown + remark-gfm + rehype-highlight | 渲染与代码高亮 |
| 文档预览 | mammoth (docx)、react-pdf (pdf)、xlsx | Word / PDF / Excel 预览 |
| 画布 | tldraw 4 | 白板 |
| 图可视化 | react-force-graph-2d | 知识图谱/关系图 |
| 终端 | xterm + xterm-addon-fit | 终端 UI，通过 WebSocket 连后端 PTY |

### 后端 (server/)

| 类别 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js (ESM) | `"type": "module"` |
| 框架 | Express 4 | HTTP API |
| 存储 | SQLite / Supabase(兼容) | 默认使用内嵌 SQLite 文件；可选 Supabase |
| 向量库 | ChromaDB | 文档向量检索，默认 `http://localhost:8000`（容器内嵌服务） |
| 嵌入模型 | 阿里云 DashScope | text-embedding-v3，1024 维 |
| 大模型 | 阿里云 DashScope 兼容接口 | 如 qwen-turbo，用于 RAG 对话 |
| 终端 | node-pty + ws | 伪终端 + WebSocket，支持 PowerShell / Bash |

### 基础设施

- **SQLite**：默认本地数据库文件，存储 `files` 表（文件/文件夹树与内容）。
- **Supabase**：可选的托管 PostgreSQL 后端，沿用相同的 `files` 表结构。
- **Chroma**：向量数据库，存储 `.md` / `.txt` / `.docx` / `.xlsx` / `.pdf` 的 embedding，用于 RAG 检索。

---

## 二、项目结构

```
good-idea/
├── web/                    # 前端
│   ├── src/
│   │   ├── App.tsx         # 根组件，Antd ConfigProvider + 深色主题
│   │   ├── main.tsx       # 入口
│   │   ├── layout/        # 布局与页面级组件
│   │   │   ├── AppLayout.tsx
│   │   │   ├── HeaderBar.tsx / MainNav.tsx
│   │   │   ├── ResizableSidebar.tsx / LeftIconSidebar.tsx
│   │   │   ├── MainContent.tsx / MainArea.tsx / TabContent.tsx
│   │   │   ├── FileContent.tsx      # 文件内容区
│   │   │   ├── SearchModal.tsx      # 全局搜索
│   │   │   ├── AllArticlesModal.tsx
│   │   │   ├── AIPanel.tsx          # RAG 对话面板
│   │   │   ├── TerminalPanel.tsx    # 终端
│   │   │   ├── WelcomePage.tsx / HeaderModal.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── FileTree.tsx
│   │   │   ├── GraphView.tsx        # 力导向图
│   │   │   ├── WhiteboardView.tsx   # tldraw 白板
│   │   │   └── viewers/
│   │   │       ├── MdViewer.tsx
│   │   │       ├── PdfViewer.tsx
│   │   │       ├── DocxViewer.tsx
│   │   │       └── XlsxViewer.tsx
│   │   └── store/
│   │       ├── layout.ts
│   │       ├── fileTree.ts
│   │       └── bookmarks.ts
│   ├── vite.config.ts     # 端口 5173，/api、/ws 代理到 3001
│   └── package.json
├── server/                 # 后端
│   ├── src/
│   │   ├── index.js        # Express + 健康检查 + files/ai 路由 + WebSocket 终端 + 静态前端托管
│   │   ├── db.js           # 数据访问入口（Supabase / SQLite）
│   │   ├── routes/
│   │   │   ├── files.js    # 文件 CRUD，触发单文件 embed
│   │   │   └── ai.js       # /chat 流式 RAG、embed 相关
│   │   ├── services/
│   │   │   ├── embedding.js  # 分块、embedding 调用、embed/remove
│   │   │   └── chroma.js     # Chroma 集合获取/重置
│   │   └── data/
│   │       └── filesSource.js  # 统一文件源（SQLite 或 Supabase）
│   ├── supabase-schema.sql # files 表建表脚本
│   ├── .env.example
│   └── package.json
├── README.md
└── PROJECT.md              # 本文档
```

---

## 三、环境变量

### 后端 (server/.env)

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 服务端口，默认 `3001` |
| `SQLITE_PATH` | 否 | SQLite 数据库文件路径，默认 `/data/app.db` |
| `SUPABASE_URL` | 否 | Supabase 项目 URL；如配置则可继续使用 Supabase |
| `SUPABASE_ANON_KEY` | 否 | Supabase 匿名密钥 |
| `DASHSCOPE_API_KEY` | RAG/对话需 | 阿里云 DashScope API Key |
| `DASHSCOPE_BASE_URL` | 否 | 默认 `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `CHROMA_URL` | 否 | Chroma 地址，默认 `http://localhost:8000` |

### 前端 (web/)

| 变量 | 说明 |
|------|------|
| `VITE_API_URL` | 可选；不设则使用相对路径 `/api`（依赖 Vite 代理） |

---

## 四、本地开发

### 1. 依赖安装

```bash
# 前端
cd web && npm install

# 后端
cd server && npm install
```

### 2. 启动服务

```bash
# 终端 1：后端（默认 http://localhost:3001）
cd server && npm run dev

# 终端 2：前端（默认 http://localhost:5173）
cd web && npm run dev
```

前端通过 Vite 将 `/api` 代理到 `http://localhost:3001`，将 `/ws` 代理到同一后端的 WebSocket。

### 3. 使用 SQLite / Supabase 持久化

- 默认：后端会在 `SQLITE_PATH` 指定的位置创建 SQLite 数据库文件，并自动创建 `files` 表。
- 可选：若仍希望使用 Supabase，将 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 配置到 `server/.env`，后端会优先使用 Supabase。

### 4. 使用 RAG（知识库问答）

1. 本地开发时，可手动启动 Chroma：例如 `docker run -p 8000:8000 chromadb/chroma`，或本地安装 Chroma；在 Docker 部署时则由容器内嵌 Chroma 服务自动启动。
2. 在 `server/.env` 中配置 `DASHSCOPE_API_KEY`（及可选 `DASHSCOPE_BASE_URL`）。
3. 后端会为新增/更新的 `.md`、`.txt` 文件自动做 embedding；也可通过 API 触发全量 embed。

### 5. 终端功能

后端在 `/ws/terminal` 提供 WebSocket，使用 `node-pty` 生成系统 shell（Windows 为 PowerShell，其余为 Bash）。前端通过 xterm 连接该 WebSocket 即可在应用内使用终端。

---

## 五、API 概览

### 健康检查

- `GET /api/health` → `{ "ok": true }`

### 文件 (files)

- `GET /api/files` → `{ nodes, rootIds }` 文件树
- `POST /api/files` 创建文件/文件夹（body: id, name, type, parentId?, content?）
- `PUT /api/files/:id` 更新
- `DELETE /api/files/:id` 删除（若用 Supabase 会级联；并会删除对应 embedding）

### AI / RAG (ai)

- `POST /api/ai/chat` 流式 RAG 对话  
  - body: `{ message, history? }`  
  - 先查 Chroma 取相关片段，再调用大模型，流式返回
- `POST /api/ai/embed-all` 全量重新 embedding（依赖 Chroma + DASHSCOPE_API_KEY）
- 其他与 embed 状态、单文件 embed 等相关的接口见 `server/src/routes/ai.js`

### WebSocket

- `ws://localhost:3001/ws/terminal` 终端 PTY 会话

---

## 六、数据库结构

表 `files`（见 `server/supabase-schema.sql`，SQLite 与 Supabase 复用同一结构）：

- `id` (text, PK)
- `name`, `type` ('file' | 'folder')
- `parent_id` (FK → files.id, ON DELETE CASCADE)
- `content`, `ext`
- `created_at`, `updated_at` (timestamptz)
- 索引：`files_parent_id`

---

## 七、前端功能要点

- **文件树**：左侧可收缩侧栏，支持文件/文件夹的增删改与选中，与后端 `/api/files` 同步。
- **多 Tab**：已打开文件用 Tab 管理，可切换、关闭。
- **多格式预览**：Markdown、PDF、Word(docx)、Excel(xlsx) 等有对应 Viewer 组件，这些文档（`.md`、`.txt`、`.docx`、`.xlsx`、`.pdf`）在后端会被解析为纯文本并写入向量库，用于 RAG 检索。
- **全局搜索**：SearchModal 等，可与后端检索或本地过滤结合（具体以代码为准）。
- **RAG 对话**：AIPanel 调用 `/api/ai/chat`，流式展示回复，并标注来源文件。
- **白板**：WhiteboardView 使用 tldraw。
- **图谱**：GraphView 使用 react-force-graph-2d 展示节点关系。
- **终端**：TerminalPanel 通过 `/ws/terminal` 与后端 PTY 通信。

---

## 八、构建与部署

### 1. 本地开发

```bash
# 前端
cd web && npm install && npm run dev

# 后端
cd server && npm install && npm run dev
```

### 2. Docker 一键启动（推荐部署方式）

```bash
# 在项目根目录构建镜像
docker build -t good-idea-app .

# 运行容器
docker run -d \
  -p 3000:3001 \
  -v good-idea-data:/data \
  -e DASHSCOPE_API_KEY=your_dashscope_key \
  good-idea-app
```

- 浏览器访问 `http://localhost:3000`，即可使用前端和后端全部功能。
- `/data` 卷持久化 SQLite 数据库和 Chroma 向量数据。

---

## 九、小结

| 项目 | 说明 |
|------|------|
| 定位 | Obsidian 式「好想法」记录与知识管理 |
| 前端 | React 19 + Vite 7 + TypeScript + Ant Design + Zustand |
| 后端 | Node + Express，REST + WebSocket |
| 存储 | SQLite（默认） / Supabase（可选） + Chroma（向量） |
| AI | 阿里云 DashScope（embedding + 大模型），RAG 流式对话 |
| 特色 | 文件树、多格式预览、RAG 问答、白板、终端、图谱 |

更多实现细节请直接查看 `web/src` 与 `server/src` 源码。
