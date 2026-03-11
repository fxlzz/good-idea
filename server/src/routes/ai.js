import { Router } from 'express'
import { getFilesForEmbedding } from '../data/filesSource.js'
import { getCollection } from '../services/chroma.js'
import { getUserSettings } from '../data/settingsStore.js'
import {
  getEmbedding,
  embedAllFiles,
  embedFile,
  removeFileEmbeddings,
  isEmbeddable,
} from '../services/embedding.js'

const router = Router()

const SYSTEM_PROMPT_TEMPLATE = `你是一个知识库助手。根据以下检索到的文档片段回答用户问题。
如果文档中没有相关信息，请如实说明"知识库中未找到相关内容"，然后尽力根据自身知识回答。
回答时请标注信息来源的文件名（用【文件名】格式）。

--- 相关文档 ---
{context}
--- 文档结束 ---`

let embedStatus = { running: false, lastResult: null, lastError: null }

router.post('/chat', async (req, res) => {
  const userId = req.user.id
  const { message, history = [] } = req.body || {}
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message required' })
  }

  try {
    const userSettings = await getUserSettings(userId)
    const apiKey = userSettings.llmApiKey || process.env.DASHSCOPE_API_KEY
    const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    const model = userSettings.llmModel || 'qwen-turbo'

    if (!apiKey) {
      return res.status(503).json({ error: 'AI not configured: set DASHSCOPE_API_KEY or user llmApiKey' })
    }

    let context = ''
    let sources = []

    try {
      const queryEmbedding = await getEmbedding(message)
      const col = await getCollection()
      const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 5,
        where: { userId },
      })

      if (results.documents?.[0]?.length > 0) {
        const docs = results.documents[0]
        const metas = results.metadatas[0]
        context = docs
          .map((doc, i) => {
            const meta = metas[i]
            sources.push(meta?.fileName || '未知文件')
            return `[来源: ${meta?.fileName || '未知'}]\n${doc}`
          })
          .join('\n\n')
      }
    } catch (ragErr) {
      console.warn('RAG retrieval failed, falling back to direct chat:', ragErr.message)
    }

    const ragUsed = context.length > 0

    const systemContent = context
      ? SYSTEM_PROMPT_TEMPLATE.replace('{context}', context)
      : '你是一个 AI 助手，请尽力回答用户的问题。'

    const messages = [
      { role: 'system', content: systemContent },
      ...history.slice(-10).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: err || response.statusText })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    if (sources.length > 0) {
      const uniqueSources = [...new Set(sources)]
      res.write(`__SOURCES__${JSON.stringify(uniqueSources)}__END_SOURCES__`)
    }
    if (!ragUsed) {
      const reason = '知识库未就绪或未检索到相关内容。请先点击「建立知识索引」，并确保 ChromaDB 已启动。'
      res.write(`__RAG_STATUS__${JSON.stringify({ used: false, reason })}__END_RAG_STATUS__`)
    } else {
      res.write(`__RAG_STATUS__${JSON.stringify({ used: true })}__END_RAG_STATUS__`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) res.write(content)
          } catch {
            // skip
          }
        }
      }
    }
    res.end()
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(e.message || e) })
    } else {
      res.end()
    }
  }
})

router.post('/embed-all', async (req, res) => {
  const userId = req.user.id
  if (embedStatus.running) {
    return res.status(409).json({ error: 'Embedding already in progress', status: embedStatus })
  }

  embedStatus = { running: true, lastResult: null, lastError: null }
  res.json({ message: 'Embedding started', status: embedStatus })

  try {
    let files = req.body?.files
    if (Array.isArray(files) && files.length > 0) {
      const withExt = (f) => (f.ext != null ? f.ext : f.name && f.name.includes('.') ? `.${f.name.split('.').pop()}` : '')
      files = files
        .filter((f) => f && f.id && f.name != null && (f.content ?? '').trim() && isEmbeddable(withExt(f)))
        .map((f) => ({ id: f.id, name: f.name, content: String(f.content ?? '').trim(), ext: withExt(f) }))
    } else {
      files = await getFilesForEmbedding(userId)
    }
    const result = await embedAllFiles(files, userId)
    embedStatus = { running: false, lastResult: result, lastError: null }
    console.log('Embed all completed:', result)
  } catch (e) {
    embedStatus = { running: false, lastResult: null, lastError: String(e.message || e) }
    console.error('Embed all failed:', e)
  }
})

router.get('/embed-status', (_req, res) => {
  res.json(embedStatus)
})

export { embedFile, removeFileEmbeddings }
export default router
