# 好想法 (good-idea)

记录好想法的应用，Obsidian 式布局。

## 结构

- `web/` — 前端：React 18 + Vite + TypeScript + Ant Design
- `server/` — 后端：Node.js + Express，仅提供 API

## 开发

```bash
# 前端（默认 http://localhost:5173）
cd web && npm install && npm run dev

# 后端（默认 http://localhost:3001）
cd server && npm install && npm run dev
```

前端通过 Vite proxy 将 `/api` 转发到后端。

## 环境变量

- **server**: 见 `server/.env.example`（PORT, SUPABASE_URL, SUPABASE_ANON_KEY）
- **web**: 可选 `VITE_API_URL`，不设则用相对路径 /api

## Supabase

在 Supabase 项目中执行 `server/supabase-schema.sql` 创建 `files` 表。配置 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY` 后，后端将使用 Supabase 存储文件；未配置时使用内存存储。
