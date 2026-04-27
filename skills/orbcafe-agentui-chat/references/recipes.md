# AgentUI Recipes

## Recipe 1: AgentPanel

```tsx
import { AgentPanel, type AgentPanelStatus, type ChatMessage } from 'orbcafe-ui'

const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: '1',
    type: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date()
  }
])
const [status, setStatus] = useState<AgentPanelStatus>('idle')

<AgentPanel
  title="My AI Assistant"
  description="Powered by ORBAI"
  agentStatus={status}
  messages={messages}
  onSend={handleSend}
  isResponding={isResponding}
  showInput={false}
/>
```

状态切换最小模式：

```ts
setStatus('running')
setIsResponding(true)
// run task...
setStatus('success')
setIsResponding(false)
setTimeout(() => setStatus('idle'), 1200)
```

## Recipe 2: StdChat with streaming

```tsx
import { StdChat, type ChatMessage } from 'orbcafe-ui'

<StdChat
  messages={messages}
  onSend={handleSend}
  isResponding={isResponding}
  showInput={true}
  streamIntervalMs={20}
  streamChunkSize={3}
  onMessageStreamingComplete={(messageId) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg))
    )
  }}
  cardHooks={{
    onCardEvent: (event) => console.log(event.cardType, event.action)
  }}
/>
```

## Recipe 3: CopilotChat inside custom shell

```tsx
import { CopilotChat } from 'orbcafe-ui'

<div style={{ position: 'absolute', left: panelPosition.x, top: panelPosition.y, width: panelSize.width, height: panelSize.height }}>
  <CopilotChat
    title="Copilot"
    messages={messages}
    onSend={handleSend}
    isResponding={isResponding}
    corner={corner}
    onCollapse={() => setIsOpen(false)}
    onHeaderPointerDown={handleHeaderPointerDown}
    streamIntervalMs={20}
    streamChunkSize={3}
    onMessageStreamingComplete={handleStreamingComplete}
    cardHooks={{ onCardEvent: setLastCardEvent }}
  />
</div>
```

## Minimal state shapes

```ts
type ChatMessage = {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

const [messages, setMessages] = useState<ChatMessage[]>(...)
const [isResponding, setIsResponding] = useState(false)
const [agentStatus, setAgentStatus] = useState<AgentPanelStatus>('idle')
```

Copilot shell:

```ts
const [isOpen, setIsOpen] = useState(false)
const [corner, setCorner] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')
const [panelSize, setPanelSize] = useState({ width: 340, height: 460 })
const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 })
```
