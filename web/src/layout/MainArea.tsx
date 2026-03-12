import { ApartmentOutlined, CloseOutlined, FormOutlined } from "@ant-design/icons";
import { Flex } from "antd";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import GraphView from "../components/GraphView";
import WhiteboardView from "../components/WhiteboardView";
import { useFileTreeStore } from "../store/fileTree";
import { useLayoutStore } from "../store/layout";
import FileContent from "./FileContent";
import TerminalPanel from "./TerminalPanel";
import WelcomePage from "./WelcomePage";

const TAB_ICONS: Record<string, ReactNode> = {
  whiteboard: <FormOutlined style={{ fontSize: 12 }} />,
  graph: <ApartmentOutlined style={{ fontSize: 12 }} />,
};

export default function MainArea() {
  const openTabs = useFileTreeStore((s) => s.openTabs);
  const activeTabId = useFileTreeStore((s) => s.activeTabId);
  const setActiveTab = useFileTreeStore((s) => s.setActiveTab);
  const closeTab = useFileTreeStore((s) => s.closeTab);
  const terminalVisible = useLayoutStore((s) => s.terminalVisible);
  const setTerminalVisible = useLayoutStore((s) => s.setTerminalVisible);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = startYRef.current - event.clientY;
      const maxHeight = Math.min(Math.floor(window.innerHeight * 0.72), 620);
      const next = Math.min(maxHeight, Math.max(180, startHeightRef.current + delta));
      setTerminalHeight(next);
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    startYRef.current = event.clientY;
    startHeightRef.current = terminalHeight;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
  };

  const activeTab = useMemo(
    () => openTabs.find((t) => t.id === activeTabId) ?? null,
    [openTabs, activeTabId],
  );

  const hasFileTabs = openTabs.some((t) => t.type === "file");
  const hasWhiteboard = openTabs.some((t) => t.type === "whiteboard");
  const hasGraph = openTabs.some((t) => t.type === "graph");
  const showWelcome = openTabs.length === 0;

  return (
    <Flex vertical style={{ height: "100%", overflow: "hidden", position: "relative" }}>
      {/* Tab bar */}
      {!showWelcome && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "var(--ide-tab-bg)",
            borderBottom: "1px solid var(--ide-sidebar-border)",
            minHeight: 36,
            flexShrink: 0,
            overflow: "auto",
          }}
        >
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  color: isActive ? "var(--ide-text)" : "var(--ide-text-muted)",
                  borderBottom: isActive ? "2px solid var(--ide-accent)" : "2px solid transparent",
                  background: isActive ? "var(--ide-tab-active-bg)" : "transparent",
                  transition: "color .15s, background .15s",
                }}
              >
                {TAB_ICONS[tab.type] ?? null}
                <span
                  style={{
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tab.title}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") closeTab(tab.id);
                  }}
                  style={{ display: "flex", padding: 2, borderRadius: 3 }}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingBottom: terminalVisible ? terminalHeight : 0,
        }}
      >
        {showWelcome && <WelcomePage />}

        {hasWhiteboard && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: activeTab?.type === "whiteboard" ? "flex" : "none",
            }}
          >
            <WhiteboardView />
          </div>
        )}

        {hasGraph && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: activeTab?.type === "graph" ? "flex" : "none",
            }}
          >
            <GraphView />
          </div>
        )}

        {hasFileTabs && (
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: activeTab?.type === "file" ? "flex" : "none",
              flexDirection: "column",
            }}
          >
            <FileContent />
          </div>
        )}
      </div>

      {/* Terminal */}
      {terminalVisible && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: terminalHeight,
            minHeight: 180,
            maxHeight: "72vh",
            borderTop: "1px solid var(--ide-sidebar-border)",
            zIndex: 1000,
            background: "var(--ide-panel)",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            role="separator"
            onMouseDown={startResize}
            style={{
              height: 12,
              cursor: "row-resize",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0))",
              borderBottom: "1px solid var(--ide-sidebar-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 36,
                height: 3,
                borderRadius: 999,
                background: "rgba(180, 180, 190, 0.45)",
              }}
            />
          </div>
          <div
            style={{
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 0,
              borderBottom: "1px solid var(--ide-sidebar-border)",
              background: "var(--ide-panel)",
              color: "var(--ide-text-muted)",
              fontSize: 12,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            <span style={{ margin: 0, lineHeight: 1 }}>终端</span>
            <span
              role="button"
              tabIndex={0}
              aria-label="关闭终端"
              onClick={() => setTerminalVisible(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTerminalVisible(false);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: 4,
                cursor: "pointer",
                color: "var(--ide-text-muted)",
                margin: 0,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ide-hover)";
                e.currentTarget.style.color = "var(--ide-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--ide-text-muted)";
              }}
            >
              <CloseOutlined style={{ fontSize: 12 }} />
            </span>
          </div>
          <TerminalPanel />
        </div>
      )}
    </Flex>
  );
}
