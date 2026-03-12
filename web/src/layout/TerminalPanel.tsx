import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const WS_URL = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/terminal`;

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: "#0f1115", foreground: "#d4d4d4" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    fitAddon.fit();

    const ws = new WebSocket(WS_URL);
    ws.onopen = () => term.writeln("\n终端已连接");
    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") term.write(ev.data);
    };
    ws.onclose = () => term.writeln("\r\n终端已断开");
    ws.onerror = () => {
      term.writeln("\r\n连接错误，请检查服务是否启动");
    };

    term.onData((data) => {
      if (data === "\r") {
        const input = inputRef.current;
        term.write("\r\n");
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "command", input }));
        }
        inputRef.current = "";
        return;
      }

      if (data === "\u007F") {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }

      if (/^[\x20-\x7E]$/.test(data)) {
        inputRef.current += data;
        term.write(data);
      }
    });

    const onResize = () => fitAddon.fit();
    window.addEventListener("resize", onResize);
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, []);

  return (
    <div
      className="terminal-panel"
      ref={containerRef}
      style={{
        height: '100%',
        padding: 8,
        background: "transparent",
      }}
    />
  );
}
