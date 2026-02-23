import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const WS_URL = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/terminal`

export default function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(el)
    fitAddon.fit()
    terminalRef.current = term
    fitRef.current = fitAddon

    const ws = new WebSocket(WS_URL)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => {
      term.writeln('终端已连接')
    }
    ws.onmessage = (ev) => {
      const data = ev.data
      if (typeof data === 'string') term.write(data)
      else term.write(new Uint8Array(data))
    }
    ws.onclose = () => {
      term.writeln('\r\n连接已关闭')
    }
    ws.onerror = () => {
      term.writeln('\r\n连接错误，请确保后端已启动且支持 WebSocket /ws/terminal')
    }
    term.onData((data) => {
      if (ws.readyState === 1) ws.send(data)
    })
    wsRef.current = ws

    const onResize = () => fitAddon.fit()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      ws.close()
      term.dispose()
      terminalRef.current = null
      fitRef.current = null
      wsRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        padding: 8,
        background: '#1e1e1e',
      }}
    />
  )
}
