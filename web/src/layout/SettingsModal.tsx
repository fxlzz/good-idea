import {
  Modal,
  Typography,
  Radio,
  Segmented,
  InputNumber,
  Switch,
  Tag,
  Space,
  Input,
  Button,
} from "antd";
import type { ModalProps } from "antd";
import { useEffect, useState } from "react";
import { useSettingsStore } from "../store/settings";
import { fetchSettings, updateSettings } from "../api/settings";

type SettingsModalProps = Pick<ModalProps, "open" | "onClose"> & {
  onClose?: () => void;
};

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const {
    theme,
    setTheme,
    llmModel,
    llmApiKey,
    embeddingModel,
    storageEngine,
    chunkSize,
    chunkOverlap,
    chunkSeparators,
    enableParentChunks,
    updateSettings: updateLocal,
  } = useSettingsStore();
  const [activeSection, setActiveSection] = useState<
    "theme" | "llm" | "embedding" | "storage" | "chunking"
  >("theme");
  const [showCustomLlm, setShowCustomLlm] = useState(false);
  const [customLlmModel, setCustomLlmModel] = useState("");
  const [customLlmKey, setCustomLlmKey] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const server = await fetchSettings();
        updateLocal(server);
      } catch {
        // ignore, fall back to local defaults
      }
    })();
  }, [open, updateLocal]);

  const syncAndUpdate = async (partial: Parameters<typeof updateLocal>[0]) => {
    updateLocal(partial);
    try {
      await updateSettings(partial);
    } catch {
      // silent fail, user can retry later
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      title="设置"
      centered
      destroyOnClose
      okText="确定"
      cancelText="关闭"
      width={600}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          minHeight: 260,
        }}
      >
        <div
          style={{
            width: 200,
            borderRight: "1px solid var(--ide-sidebar-border)",
            paddingRight: 12,
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            偏好设置
          </Typography.Text>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveSection("theme")}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: activeSection === "theme" ? "var(--ide-tab-active-bg)" : "transparent",
                color: activeSection === "theme" ? "var(--ide-text)" : "var(--ide-text-muted)",
              }}
            >
              主题
            </button>
            <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              模型配置
            </Typography.Text>
            <button
              type="button"
              onClick={() => setActiveSection("llm")}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: activeSection === "llm" ? "var(--ide-tab-active-bg)" : "transparent",
                color: activeSection === "llm" ? "var(--ide-text)" : "var(--ide-text-muted)",
              }}
            >
              LLM 大语言模型
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("embedding")}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background:
                  activeSection === "embedding" ? "var(--ide-tab-active-bg)" : "transparent",
                color: activeSection === "embedding" ? "var(--ide-text)" : "var(--ide-text-muted)",
              }}
            >
              Embedding 嵌入模型
            </button>
            <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              存储引擎
            </Typography.Text>
            <button
              type="button"
              onClick={() => setActiveSection("storage")}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background:
                  activeSection === "storage" ? "var(--ide-tab-active-bg)" : "transparent",
                color: activeSection === "storage" ? "var(--ide-text)" : "var(--ide-text-muted)",
              }}
            >
              存储引擎
            </button>
            <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              分块设置
            </Typography.Text>
            <button
              type="button"
              onClick={() => setActiveSection("chunking")}
              style={{
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background:
                  activeSection === "chunking" ? "var(--ide-tab-active-bg)" : "transparent",
                color: activeSection === "chunking" ? "var(--ide-text)" : "var(--ide-text-muted)",
              }}
            >
              分块参数
            </button>
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: 4 }}>
          {activeSection === "theme" && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                偏好设置
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                选择界面的默认主题外观。
              </Typography.Paragraph>
              <div>
                <Typography.Text>主题</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Segmented
                    options={[
                      { label: "浅色（light）", value: "light" },
                      { label: "深色（dark）", value: "dark" },
                    ]}
                    value={theme}
                    onChange={(val) => {
                      const next = val as "light" | "dark";
                      setTheme(next);
                      syncAndUpdate({ theme: next });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {activeSection === "llm" && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                模型配置 · LLM
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                选择用于总结与对话的大语言模型。
              </Typography.Paragraph>
              <div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography.Text>LLM 大语言模型</Typography.Text>
                  <Button type="link" size="small" onClick={() => setShowCustomLlm((v) => !v)}>
                    {showCustomLlm ? "收起自定义" : "新增模型"}
                  </Button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={llmModel}
                    onChange={(e) => syncAndUpdate({ llmModel: e.target.value })}
                  >
                    <Space direction="vertical">
                      <Radio value="qwen-turbo">qwen-turbo（默认）</Radio>
                      <Radio value="qwen-max">qwen-max</Radio>
                      {llmModel && llmModel !== "qwen-turbo" && llmModel !== "qwen-max" && (
                        <Radio value={llmModel}>{llmModel}</Radio>
                      )}
                    </Space>
                  </Radio.Group>
                </div>
                {showCustomLlm && (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <Input
                      placeholder="模型名称，如 qwen-max"
                      value={customLlmModel}
                      onChange={(e) => setCustomLlmModel(e.target.value)}
                    />
                    <Input.Password
                      placeholder="该模型对应的 API Key"
                      value={customLlmKey}
                      onChange={(e) => setCustomLlmKey(e.target.value)}
                    />
                    <Button
                      type="primary"
                      size="small"
                      disabled={!customLlmModel.trim() || !customLlmKey.trim()}
                      onClick={() => {
                        const modelName = customLlmModel.trim();
                        const key = customLlmKey.trim();
                        if (!modelName || !key) return;
                        syncAndUpdate({ llmModel: modelName, llmApiKey: key });
                        setCustomLlmModel("");
                        setCustomLlmKey("");
                        setShowCustomLlm(false);
                      }}
                    >
                      保存并使用该模型
                    </Button>
                    {llmApiKey && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        已配置自定义 API Key。
                      </Typography.Text>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSection === "embedding" && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                模型配置 · Embedding
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                选择用于文档向量化的嵌入模型。
              </Typography.Paragraph>
              <div>
                <Typography.Text>Embedding 嵌入模型</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={embeddingModel}
                    onChange={(e) => syncAndUpdate({ embeddingModel: e.target.value })}
                  >
                    <Space direction="vertical">
                      <Radio value="text-embedding-v3">text-embedding-v3（默认）</Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </div>
            </div>
          )}
          {activeSection === "storage" && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                存储引擎
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                选择知识库使用的存储后端。
              </Typography.Paragraph>
              <div>
                <Typography.Text>存储引擎</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={storageEngine}
                    onChange={(e) => syncAndUpdate({ storageEngine: e.target.value })}
                  >
                    <Space direction="vertical">
                      <Radio value="local">Local（本地存储）</Radio>
                      <Radio value="cloud" disabled>
                        云端（即将支持）
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </div>
            </div>
          )}
          {activeSection === "chunking" && (
            <div>
              <Typography.Title level={5} style={{ marginBottom: 4 }}>
                分块设置
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                配置文档拆分为向量块时的大小、重叠和分隔符，以获得更好的检索效果。
              </Typography.Paragraph>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div>
                  <Typography.Text>分块大小</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      min={100}
                      max={4000}
                      value={chunkSize}
                      addonAfter="字符"
                      onChange={(value) => syncAndUpdate({ chunkSize: Number(value ?? 512) })}
                    />
                  </div>
                </div>
                <div>
                  <Typography.Text>分块重叠</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      min={0}
                      max={500}
                      value={chunkOverlap}
                      addonAfter="字符"
                      onChange={(value) => syncAndUpdate({ chunkOverlap: Number(value ?? 100) })}
                    />
                  </div>
                </div>
                <div>
                  <Typography.Text>分隔符</Typography.Text>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {chunkSeparators.map((sep, index) => (
                      <Tag
                        key={`${sep}-${index}`}
                        style={{
                          background: "var(--ide-panel)",
                          color: "var(--ide-text)",
                          borderRadius: 8,
                          padding: "2px 8px",
                          border: "1px solid var(--ide-sidebar-border)",
                        }}
                      >
                        {sep === "\n" ? "单换行 (\\n)" : sep === "\n\n" ? "双换行 (\\n\\n)" : sep}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <Typography.Text>父子分块</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Switch
                        checked={enableParentChunks}
                        onChange={(checked) => syncAndUpdate({ enableParentChunks: checked })}
                      />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        启用两级分块策略（父块提供上下文，子块用于向量匹配）。
                      </Typography.Text>
                    </Space>
                  </div>
                </div>
              </Space>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
