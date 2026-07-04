import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { highlightCode } from '@/lib/syntax-highlight'
import StatusIndicator from './StatusIndicator'

const DEMO_MESSAGES = [
  {
    id: '1',
    role: 'user',
    content: '帮我分析 src/utils/auth.ts 文件中的认证逻辑，并找出可能的安全漏洞',
    timestamp: '14:32',
  },
  {
    id: '2',
    role: 'assistant',
    content: `我来分析这个认证文件。让我先读取文件内容...

经过分析，我发现以下几个关键点：

\`\`\`typescript
// src/utils/auth.ts - 第 47 行
const validateToken = async (token: string) => {
  // 潜在问题：没有检查 token 过期时间
  const decoded = jwt.verify(token, SECRET_KEY);
  return decoded;
}
\`\`\`

**发现的问题：**

1. Token 验证缺少过期时间检查，攻击者可能利用永久有效的 token
2. SECRET_KEY 硬编码在源码中，应该使用环境变量
3. 缺少 token 刷新机制的并发处理`,
    timestamp: '14:32',
    status: 'done',
  },
  {
    id: '3',
    role: 'user',
    content: '请修复这些问题，生成更安全的实现',
    timestamp: '14:33',
  },
  {
    id: '4',
    role: 'assistant',
    content: `正在为你重写认证逻辑...

\`\`\`typescript
// src/utils/auth.ts - 改进版本
import { verify, sign } from 'jsonwebtoken';

const validateToken = async (token: string) => {
  try {
    const decoded = verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: '24h',
      clockTolerance: 30,
    });
    
    // 检查 token 是否在黑名单中（用于强制登出）
    const isRevoked = await checkTokenBlacklist(decoded.jti);
    if (isRevoked) throw new AuthError('TOKEN_REVOKED');
    
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthError('TOKEN_EXPIRED');
    }
    throw new AuthError('INVALID_TOKEN');
  }
}
\`\`\`

已修复全部三个安全问题。文件已写入。`,
    timestamp: '14:33',
    status: 'done',
  },
]

function MessageBubble({ message, index, ...qoderProps }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={[(cn(
        'group relative flex gap-3 px-5 py-4',
        isUser && 'flex-row-reverse'
      )), qoderProps?.className].filter(Boolean).join(" ")}
      data-component="MessageBubble"
      data-od-id={`message-${message.id}`}
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
          isUser
            ? 'bg-[var(--seed-accent)] text-[var(--seed-fg)]'
            : 'bg-[var(--seed-primary)] text-[var(--seed-bg)]'
        )}
       data-qoder-id="qel-div-cb35e632" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cb35e632&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:7}}">
        {isUser ? 'U' : 'A'}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 max-w-[85%] rounded-[var(--seed-radius)] px-4 py-3',
          isUser
            ? 'bg-[color-mix(in_srgb,var(--seed-primary)_12%,transparent)] border border-[var(--color-border-subtle)]'
            : 'bg-[var(--color-bg-elevated)]'
        )}
       data-qoder-id="qel-div-cc35e7c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cc35e7c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:110,&quot;column&quot;:7}}">
        <div className="text-sm leading-relaxed whitespace-pre-wrap" data-qoder-id="qel-text-sm-57925cb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-57925cb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:118,&quot;column&quot;:9}}">
          {renderContent(message.content)}
        </div>
        <div className="flex items-center gap-2 mt-2" data-qoder-id="qel-flex-0e41f6d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0e41f6d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:9}}">
          <span className="text-[11px] text-[var(--seed-muted)] tracking-wide" data-qoder-id="qel-text-11px-b9524326" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-b9524326&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:122,&quot;column&quot;:11}}">
            {message.timestamp}
          </span>
          {message.status === 'done' && (
            <span className="text-[11px] text-[var(--seed-primary)] tracking-wide uppercase" style={{ letterSpacing: '0.06em' }} data-qoder-id="qel-text-11px-ba5244b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-ba5244b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:13}}">
              completed
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function renderContent(text) {
  // Simple code block rendering
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n')
      const lang = lines[0].replace('```', '').trim()
      const code = lines.slice(1, -1).join('\n')
      return (
        <div key={i} className="my-3 rounded-[var(--seed-radius)] overflow-hidden" data-qoder-id="qel-my-3-77bd33ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-my-3-77bd33ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;my-3&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:9}}">
          {lang && (
            <div className="px-3 py-1.5 bg-[color-mix(in_srgb,var(--seed-bg)_80%,var(--seed-surface)_20%)] border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-px-3-01d6b39f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-01d6b39f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:13}}">
              <span className="text-[11px] font-mono text-[var(--seed-muted)] uppercase tracking-[0.08em]" data-qoder-id="qel-text-11px-969444ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-969444ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:148,&quot;column&quot;:15}}">
                {lang}
              </span>
            </div>
          )}
          <pre className="!m-0 !rounded-t-none" data-qoder-id="qel-m-0-575e63ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-m-0-575e63ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;m-0&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:11}}">
            <code data-qoder-id="qel-code-778afb0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-code-778afb0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;code&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:13}}">{highlightCode(code, lang)}</code>
          </pre>
        </div>
      )
    }
    // Handle inline code
    const inlineParts = part.split(/(`[^`]+`)/g)
    return inlineParts.map((inline, j) => {
      if (inline.startsWith('`') && inline.endsWith('`')) {
        return (
          <code key={`${i}-${j}`} className="text-[13px]" data-qoder-id="qel-text-13px-601ea8be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-601ea8be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:11}}">
            {inline.slice(1, -1)}
          </code>
        )
      }
      // Handle bold
      const boldParts = inline.split(/(\*\*[^*]+\*\*)/g)
      return boldParts.map((bold, k) => {
        if (bold.startsWith('**') && bold.endsWith('**')) {
          return (
            <strong key={`${i}-${j}-${k}`} className="font-medium text-[var(--seed-fg)]" data-qoder-id="qel-font-medium-54a8dada" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-54a8dada&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:174,&quot;column&quot;:13}}">
              {bold.slice(2, -2)}
            </strong>
          )
        }
        return <span key={`${i}-${j}-${k}`} data-qoder-id="qel-span-c40f2683" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c40f2683&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:16}}">{bold}</span>
      })
    })
  })
}

function ThinkingIndicator(qoderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={["flex gap-3 px-5 py-4", qoderProps?.className].filter(Boolean).join(" ")}
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--seed-primary)] flex items-center justify-center" data-qoder-id="qel-flex-shrink-0-4daf3017" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-4daf3017&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ThinkingIndicator&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:193,&quot;column&quot;:7}}">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-3 h-3 rounded-full bg-[var(--seed-bg)]"
         data-qoder-id="qel-w-3-a2f02737" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-a2f02737&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ThinkingIndicator&quot;,&quot;elementRole&quot;:&quot;w-3&quot;,&quot;loc&quot;:{&quot;line&quot;:194,&quot;column&quot;:9}}"/>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-[var(--seed-radius)] bg-[var(--color-bg-elevated)]" data-qoder-id="qel-flex-7de8ed44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7de8ed44&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ThinkingIndicator&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:7}}">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-[var(--seed-primary)]"
           data-qoder-id="qel-w-1-5-7cdeb614" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-7cdeb614&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ThinkingIndicator&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:202,&quot;column&quot;:11}}"/>
        ))}
      </div>
    </motion.div>
  )
}

export default function ChatPanel({ agentStatus, ...qoderProps }) {
  const [messages] = useState(DEMO_MESSAGES)
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Simulate thinking state
  useEffect(() => {
    if (agentStatus === 'thinking' || agentStatus === 'streaming') {
      setIsThinking(true)
    } else {
      setIsThinking(false)
    }
  }, [agentStatus])

  return (
    <div
      className={["flex flex-col h-full", qoderProps?.className].filter(Boolean).join(" ")}
      data-component="ChatPanel"
      data-od-id="chat-panel"
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-flex-da7d9dd7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-da7d9dd7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:7}}">
        <div className="flex items-center gap-3" data-qoder-id="qel-flex-d97d9c44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d97d9c44&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:242,&quot;column&quot;:9}}">
          <h2 className="text-sm font-medium tracking-[-0.01em]" data-qoder-id="qel-text-sm-7d238e3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-7d238e3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:243,&quot;column&quot;:11}}">对话</h2>
          <span className="text-[11px] text-[var(--seed-muted)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-11px-117bde84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-117bde84&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:244,&quot;column&quot;:11}}">
            {messages.length} messages
          </span>
        </div>
        <StatusIndicator status={agentStatus} size="sm"  data-qoder-id="qel-statusindicator-1b5e644b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusindicator-1b5e644b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;statusindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:9}}"/>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-1"
       data-qoder-id="qel-flex-1-c1d15592" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-c1d15592&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:7}}">
        <AnimatePresence mode="popLayout" data-qoder-id="qel-animatepresence-200b1e21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-200b1e21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:9}}">
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id} message={msg} index={index}  data-qoder-id="qel-messagebubble-af290556" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-messagebubble-af290556&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;messagebubble&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:13}}"/>
          ))}
          {isThinking && <ThinkingIndicator key="thinking"  data-qoder-id="qel-thinkingindicator-c2a983d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thinkingindicator-c2a983d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ChatPanel.jsx&quot;,&quot;componentName&quot;:&quot;ChatPanel&quot;,&quot;elementRole&quot;:&quot;thinkingindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:260,&quot;column&quot;:26}}"/>}
        </AnimatePresence>
      </div>
    </div>
  )
}
