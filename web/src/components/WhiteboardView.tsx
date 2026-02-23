import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function WhiteboardView() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Tldraw persistenceKey="good-idea-whiteboard" />
    </div>
  )
}
