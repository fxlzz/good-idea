## good-idea

**good-idea** 是一款面向个人知识管理与想法记录的应用，采用类似 Obsidian 的多栏布局，支持本地文件树、多标签编辑、多格式文档预览、关系图谱、白板、内置终端以及基于本地知识库的 AI 助手（RAG 问答）。项目分为前端 React 单页应用与后端 Node.js/Express 服务，并提供 Docker 部署方案。

---

## 功能概览

- **本地知识库文件树**：浏览、创建、重命名、删除文件和文件夹，支持 Markdown、纯文本、PDF、Word、Excel 等多种类型
- **多标签编辑与预览**：在标签页中同时打开多个文档，实时切换阅读与编辑视图
- **多种文档预览**：
  - Markdown 渲染（支持 GFM、代码高亮）
  - PDF 预览
  - Word (`.docx`) 预览
  - Excel (`.xlsx`) 预览
- **图谱与白板**：
  - 关系图谱视图（基于 force-graph）
  - 白板视图（基于 tldraw），用于自由记录与头脑风暴
- **AI 助手 / RAG 问答**：
  - 基于本地文档构建向量索引（Chroma）
  - 使用阿里云 DashScope Embedding + Chat 模型，为本地知识库提供问答与内容总结
- **内置终端**：通过 Node.js(readline) + WebSocket + xterm 实现终端指令功能
- **Supabase / SQLite 存储**：
  - 支持本地 SQLite 存储（默认）
  - 可切换为 Supabase/PostgreSQL 作为远程文件存储后端

---

## 项目结构

- **`web/`** — 前端应用（React + Vite + TypeScript + Ant Design + Zustand）
  - `src/layout/`：整体布局与页面级组件（`HeaderBar`, `ResizableSidebar`, `AIPanel`, `TerminalPanel`, `MainContent` 等）
  - `src/components/`：文件树、图谱视图、白板视图、文档预览组件等
  - `src/store/`：Zustand 全局状态（布局、文件树、书签、设置等）
- **`server/`** — 后端服务（Node.js + Express）
  - `src/index.js`：服务入口，挂载 `/api` 路由、静态资源、WebSocket 终端等
  - `src/routes/`：`files.js`, `ai.js`, `auth.js`, `settings.js` 等路由
  - `src/services/`：`embedding.js`, `chroma.js`, `textExtractors.js` 等服务层
  - `src/data/`：`filesSource.js`, `settingsStore.js`, `usersStore.js` 等数据访问层
  - `src/cli/`：CLI 工具（`wsTerminal.js` 等）
  - `supabase-schema.sql` / `supabase-auth-schema.sql`：Supabase 建表脚本
- **根目录其他文件**
  - `PROJECT.md`：更详细的项目架构与设计说明
  - `Dockerfile` / `docker-compose.yml`：打包与编排配置

---

## 技术栈一览

- **前端**
  - React + Vite + TypeScript
  - Ant Design 组件库（支持深色模式与中文）
  - react-router-dom, Zustand
  - react-markdown, remark-gfm, rehype-highlight
  - react-pdf, mammoth, xlsx, docx-preview
  - tldraw, react-force-graph-2d, xterm
- **后端**
  - Node.js (ESM) + Express
  - SQLite（通过 `better-sqlite3`）或 Supabase/PostgreSQL
  - Chroma 向量数据库（HTTP API）
  - 阿里云 DashScope Embedding + Chat（OpenAI 兼容接口）
  - jsonwebtoken, bcryptjs, ws, node-pty 等
- **部署**
  - Docker / Docker Compose
  - `.env` 环境变量管理

---

## 本地开发

### 1. 安装依赖

```bash
# 前端
cd web
npm install

# 后端
cd server
npm install
```

### 2. 启动开发环境

```bash
# 启动后端（默认 http://localhost:3001）
cd server
npm run dev

# 启动前端（默认 http://localhost:5173）
cd ../web
npm run dev
```
---

## 构建与生产运行

### 1. 构建前端

```bash
cd web
npm install
npm run build
```

前端构建产物输出到 `web/dist`，由后端托管。

### 2. 启动后端

```bash
cd server
npm install --production
npm start
```
---

## Docker

```bash
# 构建
docker build -t good-idea-app .

# 运行
docker run -d \
  -p 3000:3001 \
  -v good-idea-data:/data \
  -e DASHSCOPE_API_KEY=your_dashscope_key \
  good-idea-app
```

暴露两个服务：
- server 3000（前端由后端返回渲染）
- Chroma 8000

---

## 环境变量

可参考 `server/.env.example`：
- `PORT`：后端端口，默认 `3001`
- `SQLITE_PATH`：SQLite 数据文件路径，默认 `/data/app.db`
- `SUPABASE_URL`：Supabase 项目 URL
- `SUPABASE_ANON_KEY`：Supabase 匿名 key
- `DASHSCOPE_API_KEY`：阿里云 DashScope API Key（用于 embedding 与聊天）
- `DASHSCOPE_BASE_URL`：DashScope API 基础 URL（可选，默认官方兼容模式地址）
- `CHROMA_URL`：Chroma 服务地址，默认 `http://localhost:8000`
- `JWT_SECRET` / `JWT_EXPIRES_IN`：JWT 认证相关配置
- `JSON_BODY_LIMIT`：请求体大小限制

## Supabase

- 在 Supabase 项目中执行 `server/supabase-schema.sql` 和（如需）`server/supabase-auth-schema.sql` 创建相应表。
- 配置 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY` 后，后端会使用 Supabase 作为文件与用户存储；未配置时则使用本地 SQLite。

---
