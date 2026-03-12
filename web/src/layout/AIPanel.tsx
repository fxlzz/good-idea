import { Button, Input, List, Tag, Tooltip, Switch, message } from "antd";
import { DatabaseOutlined, SyncOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect, useCallback } from "react";
import { useFileTreeStore } from "../store/fileTree";
import { apiFetch } from "../lib/api";

// 与服务端 embedding.js 中的 EMBEDDABLE_EXTS 保持一致
const EMBEDDABLE_EXTS = new Set([
  ".md",
  ".txt",
  ".docx",
  ".doc",
  ".xlsx",
  ".pdf",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css",
  "",
]);
function getExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i) : "";
}
function isEmbeddable(ext: string): boolean {
  return EMBEDDABLE_EXTS.has(ext);
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  ragStatus?: { used: boolean; reason?: string };
};

type AIPanelProps = {
  open: boolean;
  onClose: () => void;
};

type EmbedStatus = {
  running: boolean;
  lastResult: { processedFiles: number; totalChunks: number } | null;
  lastError: string | null;
};

export default function AIPanel({ open }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [embedStatus, setEmbedStatus] = useState<EmbedStatus>({
    running: false,
    lastResult: null,
    lastError: null,
  });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const fetchEmbedStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/ai/embed-status");
      if (res.ok) {
        const data = await res.json();
        setEmbedStatus(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchEmbedStatus();
    const timer = setInterval(fetchEmbedStatus, 3000);
    return () => clearInterval(timer);
  }, [open, fetchEmbedStatus]);

  const nodes = useFileTreeStore((s) => s.nodes);

  const startEmbedding = async () => {
    try {
      const fileList = Object.values(nodes)
        .filter(
          (n) => n.type === "file" && (n.content ?? "").trim() && isEmbeddable(getExt(n.name)),
        )
        .map((n) => ({
          id: n.id,
          name: n.name,
          content: (n.content ?? "").trim(),
          ext: n.ext ?? getExt(n.name),
        }));
      const res = await apiFetch("/api/ai/embed-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileList }),
      });
      if (res.ok) {
        message.success("知识索引已启动");
        setEmbedStatus((s) => ({ ...s, running: true }));
      } else {
        const data = await res.json();
        message.warning(data.error || "启动失败");
      }
    } catch {
      message.error("请求失败，请检查服务器连接");
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const assistantId = `a_${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: assistantId, role: "assistant", content: "", sources: [], ragStatus: undefined },
    ]);

    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((x) => ({ role: x.role, content: x.content })),
          useRag,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `错误: ${err.error ?? res.statusText}` }
              : msg,
          ),
        );
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content: "无响应" } : msg)),
        );
        return;
      }
      let content = "";
      let sources: string[] = [];
      let ragStatus: { used: boolean; reason?: string } | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });

        const sourceMatch = content.match(/__SOURCES__(.+?)__END_SOURCES__/);
        if (sourceMatch) {
          try {
            sources = JSON.parse(sourceMatch[1]);
          } catch {
            // ignore
          }
          content = content.replace(/__SOURCES__.+?__END_SOURCES__/, "");
        }

        const ragMatch = content.match(/__RAG_STATUS__(.+?)__END_RAG_STATUS__/);
        if (ragMatch) {
          try {
            ragStatus = JSON.parse(ragMatch[1]);
          } catch {
            // ignore
          }
          content = content.replace(/__RAG_STATUS__.+?__END_RAG_STATUS__/, "");
        }

        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, content, sources, ragStatus } : msg)),
        );
      }
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, content: `请求失败: ${String(e)}` } : msg,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="ai-panel"
      style={{
        width: 360,
        minWidth: 360,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="ai-panel__header">
        <span>AI 助手</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <Tooltip
            title={
              embedStatus.running
                ? "索引中..."
                : embedStatus.lastResult
                  ? `已索引 ${embedStatus.lastResult.processedFiles} 个文件，${embedStatus.lastResult.totalChunks} 个片段`
                  : "建立知识索引"
            }
          >
            <Button
              type="text"
              size="small"
              icon={embedStatus.running ? <SyncOutlined spin /> : <DatabaseOutlined />}
              onClick={startEmbedding}
              disabled={embedStatus.running}
            />
          </Tooltip>
          <Tooltip>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 12 }}>使用知识库</span>
              <Switch size="small" checked={useRag} onChange={setUseRag} />
            </div>
          </Tooltip>
        </div>
      </div>

      <div ref={listRef} className="ai-panel__list">
        {messages.length === 0 && (
          <div className="ai-panel__empty">
            <p>输入问题，AI 将基于知识库为你解答</p>
            <p className="ai-panel__empty-hint">
              点击右上角 <DatabaseOutlined /> 按钮建立知识索引
            </p>
          </div>
        )}
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item
              style={{
                flexDirection: "column",
                alignItems: item.role === "user" ? "flex-end" : "flex-start",
                border: "none",
                padding: "8px 0",
              }}
              className="ai-panel__message-item"
            >
              <span
                className={
                  item.role === "user"
                    ? "ai-panel__bubble ai-panel__bubble--user"
                    : "ai-panel__bubble ai-panel__bubble--assistant"
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  maxWidth: "90%",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {item.content || (loading && item.role === "assistant" ? "思考中..." : "")}
              </span>
              {item.role === "assistant" && item.sources && item.sources.length > 0 && (
                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {item.sources.map((s, i) => (
                    <Tag key={i} color="blue" style={{ fontSize: 11 }}>
                      {s}
                    </Tag>
                  ))}
                </div>
              )}
              {item.role === "assistant" && item.ragStatus?.used === false && (
                <Tooltip title={item.ragStatus.reason}>
                  <Tag color="orange" style={{ marginTop: 4, fontSize: 11 }}>
                    未使用知识库
                  </Tag>
                </Tooltip>
              )}
            </List.Item>
          )}
        />
      </div>

      <div className="ai-panel__footer">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="输入问题..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading}
        />
        <Button type="primary" block style={{ marginTop: 8 }} onClick={send} loading={loading}>
          发送
        </Button>
      </div>
    </div>
  );
}
