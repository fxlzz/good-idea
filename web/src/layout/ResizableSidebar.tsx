import type React from "react";
import {
  FileAddOutlined,
  FolderAddOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Dropdown, Layout, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { useEffect, useRef, useState } from "react";
import FileTree from "../components/FileTree";
import { useUploadFile } from "../hooks/useUploadFile";
import { useFileTreeStore } from "../store/fileTree";

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 210;

function generateId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

type ResizableSidebarProps = {
  width: number;
  onWidthChange: (w: number) => void;
};

export default function ResizableSidebar({ width, onWidthChange }: ResizableSidebarProps) {
  const [dragging, setDragging] = useState(false);
  const [rootMenuOpen, setRootMenuOpen] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const requestNewRootNode = useFileTreeStore((s) => s.requestNewRootNode);
  const syncFromServer = useFileTreeStore((s) => s.syncFromServer);
  const { inputRef: uploadInputRef, triggerUpload, handleFileChange } = useUploadFile(null);

  const rootMenuItems: MenuProps["items"] = [
    { key: "newFile", icon: <FileAddOutlined />, label: "新建文件" },
    { key: "newFolder", icon: <FolderAddOutlined />, label: "新建文件夹" },
    { key: "upload", icon: <UploadOutlined />, label: "上传文件" },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    startX.current = e.clientX;
    startW.current = width;
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta));
      onWidthChange(next);
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onWidthChange]);

  const handleNewFile = () => {
    requestNewRootNode("file");
  };

  const handleNewFolder = () => {
    requestNewRootNode("folder");
  };

  const handleRootMenuClick: MenuProps["onClick"] = ({ key }) => {
    setRootMenuOpen(false);
    if (key === "newFile") {
      handleNewFile();
    } else if (key === "newFolder") {
      handleNewFolder();
    } else if (key === "upload") {
      triggerUpload();
    }
  };

  return (
    <>
      <Layout.Sider
        width={width}
        style={{
          minWidth: width,
          maxWidth: width,
          background: "var(--ide-sidebar)",
          borderRight: "1px solid var(--ide-sidebar-border)",
          flex: `0 0 ${width}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Dropdown
          open={rootMenuOpen}
          onOpenChange={setRootMenuOpen}
          menu={{ items: rootMenuItems, onClick: handleRootMenuClick }}
          trigger={["contextMenu"]}
          getPopupContainer={() => document.body}
        >
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
            onContextMenu={() => setRootMenuOpen(true)}
          >
            <div
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid var(--ide-sidebar-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ide-text)" }}>文件</span>
              <div
                className="ide-sidebar-header-actions"
                style={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Tooltip title="刷新">
                  <span
                    style={{
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--ide-text-muted)",
                      borderRadius: 10,
                    }}
                    onClick={() => syncFromServer()}
                    role="button"
                    tabIndex={0}
                  >
                    <ReloadOutlined style={{ fontSize: 14 }} />
                  </span>
                </Tooltip>
                <Tooltip title="上传文件">
                  <span
                    style={{
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--ide-text-muted)",
                      borderRadius: 10,
                    }}
                    onClick={triggerUpload}
                    role="button"
                    tabIndex={0}
                  >
                    <UploadOutlined style={{ fontSize: 14 }} />
                  </span>
                </Tooltip>
                <Tooltip title="新建文件">
                  <span
                    style={{
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--ide-text-muted)",
                      borderRadius: 10,
                    }}
                    onClick={handleNewFile}
                    role="button"
                    tabIndex={0}
                  >
                    <FileAddOutlined style={{ fontSize: 14 }} />
                  </span>
                </Tooltip>
                <Tooltip title="新建文件夹">
                  <span
                    style={{
                      cursor: "pointer",
                      padding: 4,
                      color: "var(--ide-text-muted)",
                      borderRadius: 10,
                    }}
                    onClick={handleNewFolder}
                    role="button"
                    tabIndex={0}
                  >
                    <FolderAddOutlined style={{ fontSize: 14 }} />
                  </span>
                </Tooltip>
              </div>
            </div>
            <input
              ref={uploadInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div
              style={{
                flex: 1,
                overflow: "auto",
                minHeight: 0,
                background: "var(--ide-tree-bg)",
              }}
            >
              <FileTree />
            </div>
          </div>
        </Dropdown>
      </Layout.Sider>
      <div
        role="separator"
        onMouseDown={handleMouseDown}
        style={{
          width: 4,
          cursor: "col-resize",
          background: dragging ? "var(--ide-accent)" : "transparent",
          flexShrink: 0,
        }}
      />
    </>
  );
}

export { SIDEBAR_MIN, SIDEBAR_MAX, SIDEBAR_DEFAULT };
