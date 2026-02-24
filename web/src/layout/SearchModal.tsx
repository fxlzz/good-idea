import { FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import { Input, List, Modal } from "antd";
import { useMemo, useState, useEffect, useRef } from "react";
import { useBookmarksStore } from "../store/bookmarks";
import { useFileTreeStore } from "../store/fileTree";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const nodes = useFileTreeStore((s) => s.nodes);
  const openTabs = useFileTreeStore((s) => s.openTabs);
  const openFile = useFileTreeStore((s) => s.openFile);
  const nodeIds = useBookmarksStore((s) => s.nodeIds);
  const getNode = useFileTreeStore((s) => s.getNode);

  const recentFiles = useMemo(() => {
    const ids = new Set(openTabs.map((t) => t.nodeId));
    const list = openTabs
      .map((t) => getNode(t.nodeId))
      .filter((n): n is NonNullable<typeof n> => !!n && n.type === "file");
    const rest = Object.values(nodes)
      .filter((n) => n.type === "file" && !ids.has(n.id))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...list, ...rest].slice(0, 20);
  }, [nodes, openTabs, getNode]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentFiles.map((n) => ({ ...n, match: "recent" as const }));
    return Object.values(nodes)
      .filter(
        (n) =>
          n.type === "file" &&
          (n.name.toLowerCase().includes(q) ||
            (typeof n.content === "string" && n.content.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20)
      .map((n) => ({ ...n, match: "name" as const }));
  }, [query, recentFiles, nodes]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const len = searchResults.length;
    if (len === 0) return;
    const i = Math.max(0, Math.min(selectedIndex, len - 1));
    setSelectedIndex(i);
    listRef.current?.querySelectorAll("[data-search-item]")[i]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedIndex, searchResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, searchResults.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = searchResults[selectedIndex];
      if (item) {
        openFile(item.id);
        onClose();
      }
    }
  };

  const handleOpen = (nodeId: string) => {
    openFile(nodeId);
    onClose();
  };

  const isBookmarked = (id: string) => nodeIds.includes(id);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      closable={false}
      styles={{
        body: { padding: 0 },
      }}
    >
      <div style={{ padding: 16 }}>
        <Input
          ref={inputRef}
          prefix={<SearchOutlined style={{ color: "var(--ide-text-muted)" }} />}
          placeholder="搜索文件名或内容..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          allowClear
          suffix={<span style={{ fontSize: 12, color: "var(--ide-text-muted)" }}>ESC</span>}
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginBottom: 8, fontSize: 12, color: "var(--ide-text-muted)" }}>
          最近访问
        </div>
        <div ref={listRef} style={{ maxHeight: 320, overflow: "auto" }}>
          <List
            dataSource={searchResults}
            rowKey="id"
            renderItem={(n, index) => {
              const selected = index === selectedIndex;
              return (
                <List.Item
                  data-search-item
                  style={{
                    cursor: "pointer",
                    padding: "10px 12px",
                    marginBottom: 4,
                    borderRadius: 6,
                    background: selected ? "var(--ide-tab-active-bg)" : "transparent",
                    border: "none",
                  }}
                  onClick={() => handleOpen(n.id)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      gap: 12,
                    }}
                  >
                    <FileTextOutlined style={{ color: "var(--ide-text-muted)", fontSize: 16 }} />
                    <span style={{ fontWeight: 500, flex: 1 }}>{n.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--ide-accent)",
                        background: "var(--ide-tab-active-bg)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      文件名
                    </span>
                    {isBookmarked(n.id) && <span style={{ color: "var(--ide-accent)" }}>🔖</span>}
                    <span style={{ fontSize: 12, color: "var(--ide-text-muted)" }}>
                      🕐 {formatDate(n.updatedAt)}
                    </span>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--ide-text-muted)",
          }}
        >
          ↑↓ 导航　Enter 打开　Esc 关闭
        </div>
      </div>
    </Modal>
  );
}
