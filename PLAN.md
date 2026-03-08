# AI 助手 RAG 功能实施计划

## 项目概述

为 good-idea 知识管理平台接入基于 RAG（Retrieval-Augmented Generation）的 AI 助手功能。用户可以通过 AI 助手提问，系统会从知识库中检索相关文档片段，结合阿里云 DashScope 大模型生成精准回答。

## 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 聊天模型 | DashScope `qwen-turbo` | 阿里云百炼，OpenAI 兼容接口，最便宜 |
| 嵌入模型 | DashScope `text-embedding-v3` | 1024 维（默认），OpenAI 兼容接口 |
| 向量数据库 | ChromaDB (Docker) | 通过 HTTP API 连接，本地已有镜像 |
| 文件数据库 | Supabase (PostgreSQL) | 云服务，`files` 表已创建 |
| 后端 | Express + Node.js | 现有架构 |
| 前端 | React + Ant Design | 现有架构 |

## 环境信息

| 项 | 值 |
|----|-----|
| Supabase URL | `https://mndpxazvgejtahavvimv.supabase.co` |
| Supabase Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZHB4YXp2Z2VqdGFoYXZ2aW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI0NjIsImV4cCI6MjA4NzM4ODQ2Mn0.4iw1ppvDScjMAkjOatZCrjOyDei-YJBIRshw9h310CQ` |
| DashScope API Key | `sk-19fd055000ad4705b998cf84fa0c369e` |
| DashScope Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| ChromaDB URL | `http://localhost:8000`（Docker 容器） |

## 实施阶段

---

### 阶段一：前端文件数据同步到 Supabase

**目标**：让前端的文件 CRUD 操作同步到 Supabase 后端数据库，为后续 RAG 提供数据源。

**前提**：Supabase `files` 表已通过 MCP 创建完毕 ✅

**改动范围**：

1. **`web/src/store/fileTree.ts`** — 在 Zustand store 的增删改操作中，增加对后端 API 的调用
   - `createNode` → 同时调用 `POST /api/files`
   - `updateNode` → 同时调用 `PUT /api/files/:id`
   - `deleteNode` → 同时调用 `DELETE /api/files/:id`
   - 初始化时从 `GET /api/files` 拉取数据（如果 Supabase 可用）

2. **后端无需改动** — `server/src/routes/files.js` 已有完整的 CRUD 接口

**注意**：前端仍保留 localStorage 缓存，Supabase 作为持久化层，确保离线体验不受影响。

---

### 阶段二：配置文件 & 环境变量

**改动范围**：

1. **`server/.env.example`** — 新增：
   ```
   DASHSCOPE_API_KEY=
   DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   CHROMA_URL=http://localhost:8000
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   ```

2. **`server/.env`**（gitignore）— 写入实际配置：
   ```
   PORT=3001
   SUPABASE_URL=https://mndpxazvgejtahavvimv.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZHB4YXp2Z2VqdGFoYXZ2aW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTI0NjIsImV4cCI6MjA4NzM4ODQ2Mn0.4iw1ppvDScjMAkjOatZCrjOyDei-YJBIRshw9h310CQ
   DASHSCOPE_API_KEY=sk-19fd055000ad4705b998cf84fa0c369e
   DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   CHROMA_URL=http://localhost:8000
   ```

3. **`.gitignore`** — 确保 `server/.env` 被忽略

---

### 阶段三：ChromaDB Docker 部署

**前提**：本地已有 Docker 服务和 chromadb 镜像 ✅

**改动范围**：

1. **`docker-compose.yml`**（项目根目录）：
   ```yaml
   services:
     chroma:
       image: chromadb/chroma:latest
       ports:
         - "8000:8000"
       volumes:
         - chroma_data:/chroma/chroma
       environment:
         - IS_PERSISTENT=TRUE
   volumes:
     chroma_data:
   ```

2. **启动方式**：`docker-compose up -d chroma`

---

### 阶段四：文档 Embedding 服务

**改动范围**：

1. **`server/src/services/chroma.js`** — ChromaDB 客户端封装
   - 初始化 ChromaDB 连接（连接到 Docker 容器）
   - 获取/创建 `documents` collection

2. **`server/src/services/embedding.js`** — 核心嵌入逻辑
   - `getEmbedding(text)` — 调用 DashScope Embedding API (`text-embedding-v3`) 获取向量
   - `chunkText(text, maxLen=800)` — 文本分块（500-1000 字，重叠 100 字）
   - `embedFile(file)` — 对单个文件内容分块并嵌入到 ChromaDB
   - `embedAllFiles()` — 从 Supabase 读取所有 .md / 纯文本文件，批量嵌入
   - `removeFileEmbeddings(fileId)` — 删除文件时清理对应向量

3. **分块策略**：
   - 每块 500-1000 字（中文约 500-1000 字符）
   - 目标块大小 800 字，相邻块重叠 100 字，避免语义断裂
   - 每块 metadata：`{ fileId, fileName, chunkIndex, totalChunks }`

4. **触发时机**：
   - 手动触发：`POST /api/ai/embed-all`（全量索引）
   - 自动触发：文件创建/更新/删除时增量更新（在 files 路由中添加 hook）

5. **新增 API 端点**：
   - `POST /api/ai/embed-all` — 全量嵌入所有文件
   - `GET /api/ai/embed-status` — 查询索引状态

---

### 阶段五：RAG 检索 + 生成

**改动范围**：

1. **`server/src/routes/ai.js`** — 重构为 RAG 流程：
   ```
   用户提问
     → 调用 DashScope Embedding API 获取问题向量
     → ChromaDB 相似度检索 (top-5)
     → 拼接检索到的文档片段为 context
     → 构建 system prompt（含 context + 指令）
     → 调用 DashScope Chat API (qwen-turbo, stream)
     → SSE 流式返回
   ```

2. **System Prompt 模板**：
   ```
   你是一个知识库助手。根据以下检索到的文档片段回答用户问题。
   如果文档中没有相关信息，请如实说明。
   回答时请标注信息来源的文件名。

   --- 相关文档 ---
   [检索到的文档片段]
   --- 文档结束 ---
   ```

3. **响应格式**：保持现有 SSE 流式输出，前端无需改动核心逻辑

---

### 阶段六：前端 AI Panel 升级

**改动范围**：

1. **`web/src/layout/AIPanel.tsx`**：
   - 更新空状态提示文案（移除 DASHSCOPE_API_KEY 手动配置提示）
   - 添加「建立知识索引」按钮（调用 `POST /api/ai/embed-all`）
   - 显示索引进度/状态
   - 在 AI 回答中展示引用来源（命中的文件名）

---

### 阶段七：Docker 完整部署

**改动范围**：

1. **`server/Dockerfile`**：
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY src/ ./src/
   EXPOSE 3001
   CMD ["node", "src/index.js"]
   ```

2. **`web/Dockerfile`**：
   ```dockerfile
   FROM node:20-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   ```

3. **`docker-compose.yml`** 完整版：
   ```yaml
   services:
     chroma:
       image: chromadb/chroma:latest
       ports:
         - "8000:8000"
       volumes:
         - chroma_data:/chroma/chroma
       environment:
         - IS_PERSISTENT=TRUE

     server:
       build: ./server
       ports:
         - "3001:3001"
       environment:
         - DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY}
         - DASHSCOPE_BASE_URL=${DASHSCOPE_BASE_URL:-https://dashscope.aliyuncs.com/compatible-mode/v1}
         - CHROMA_URL=http://chroma:8000
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
       depends_on:
         - chroma

     web:
       build: ./web
       ports:
         - "80:80"
       depends_on:
         - server

   volumes:
     chroma_data:
   ```

4. **部署环境变量**：通过 `.env` 文件或 Docker `environment` 注入敏感信息

---

## 实施顺序

```
阶段一 (前端同步 Supabase)    ← 数据基础
  → 阶段二 (配置文件)          ← 环境准备
    → 阶段三 (ChromaDB Docker) ← 向量库就绪
      → 阶段四 (Embedding 服务) ← 知识索引
        → 阶段五 (RAG 检索+生成) ← 核心功能
          → 阶段六 (前端升级)    ← 用户体验
            → 阶段七 (Docker 部署) ← 生产就绪
```

## 支持的文件类型（嵌入）

| 类型 | 扩展名 | 说明 |
|------|--------|------|
| Markdown | `.md` | 直接读取 content 字段 |
| 纯文本 | `.txt`, 无扩展名 | 直接读取 content 字段 |

## 依赖变更

### server/package.json — 无需新增
- `chromadb` — 已存在 ✅
- DashScope API 使用 OpenAI 兼容接口，直接用 `fetch` 调用，无需额外 SDK

## 数据库状态

- Supabase `files` 表 — 已创建 ✅（通过 MCP 执行 SQL）
- ChromaDB `documents` collection — 将在阶段四自动创建
