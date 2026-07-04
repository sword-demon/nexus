import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, ChevronDown, ChevronRight, Plus, Minus, FileText, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Demo diff data
const DEMO_DIFF = {
  fileName: 'src/utils/auth.ts',
  additions: 18,
  deletions: 7,
  hunks: [
    {
      header: '@@ -1,12 +1,23 @@',
      oldStart: 1,
      newStart: 1,
      lines: [
        { type: 'context', content: "import { verify, sign } from 'jsonwebtoken';", oldLine: 1, newLine: 1 },
        { type: 'context', content: '', oldLine: 2, newLine: 2 },
        { type: 'deletion', content: "const SECRET_KEY = 'hardcoded-secret-key-123';", oldLine: 3 },
        { type: 'deletion', content: '', oldLine: 4 },
        { type: 'deletion', content: 'const validateToken = async (token: string) => {', oldLine: 5 },
        { type: 'deletion', content: '  const decoded = verify(token, SECRET_KEY);', oldLine: 6 },
        { type: 'deletion', content: '  return decoded;', oldLine: 7 },
        { type: 'deletion', content: '}', oldLine: 8 },
        { type: 'addition', content: 'const validateToken = async (token: string) => {', newLine: 3 },
        { type: 'addition', content: '  try {', newLine: 4 },
        { type: 'addition', content: "    const decoded = verify(token, process.env.JWT_SECRET, {", newLine: 5 },
        { type: 'addition', content: "      algorithms: ['HS256'],", newLine: 6 },
        { type: 'addition', content: "      maxAge: '24h',", newLine: 7 },
        { type: 'addition', content: '      clockTolerance: 30,', newLine: 8 },
        { type: 'addition', content: '    });', newLine: 9 },
        { type: 'addition', content: '', newLine: 10 },
        { type: 'addition', content: '    // 检查 token 是否在黑名单中', newLine: 11 },
        { type: 'addition', content: '    const isRevoked = await checkTokenBlacklist(decoded.jti);', newLine: 12 },
        { type: 'addition', content: "    if (isRevoked) throw new AuthError('TOKEN_REVOKED');", newLine: 13 },
        { type: 'addition', content: '', newLine: 14 },
        { type: 'addition', content: '    return decoded;', newLine: 15 },
        { type: 'addition', content: '  } catch (err) {', newLine: 16 },
        { type: 'addition', content: "    if (err.name === 'TokenExpiredError') {", newLine: 17 },
        { type: 'addition', content: "      throw new AuthError('TOKEN_EXPIRED');", newLine: 18 },
        { type: 'addition', content: '    }', newLine: 19 },
        { type: 'addition', content: "    throw new AuthError('INVALID_TOKEN');", newLine: 20 },
        { type: 'addition', content: '  }', newLine: 21 },
        { type: 'addition', content: '}', newLine: 22 },
        { type: 'context', content: '', oldLine: 9, newLine: 23 },
        { type: 'context', content: 'export { validateToken };', oldLine: 10, newLine: 24 },
      ],
    },
  ],
}

function DiffLine({ line, ...qoderProps }) {
  const bgColors = {
    addition: 'bg-[color-mix(in_srgb,var(--seed-primary)_10%,transparent)]',
    deletion: 'bg-[color-mix(in_srgb,var(--seed-accent)_10%,transparent)]',
    context: '',
  }

  const textColors = {
    addition: 'text-[var(--seed-primary)]',
    deletion: 'text-[var(--seed-accent)]',
    context: 'text-[var(--seed-fg)]',
  }

  const lineNumColor = {
    addition: 'text-[color-mix(in_srgb,var(--seed-primary)_60%,var(--seed-muted)_40%)]',
    deletion: 'text-[color-mix(in_srgb,var(--seed-accent)_60%,var(--seed-muted)_40%)]',
    context: 'text-[var(--seed-muted)]',
  }

  const prefix = {
    addition: '+',
    deletion: '-',
    context: ' ',
  }

  return (
    <div className={[(cn('flex text-[12px] font-mono leading-[20px] group', bgColors[line.type])), qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Old line number */}
      <span className={cn('w-[38px] flex-shrink-0 text-right pr-2 select-none', lineNumColor[line.type])} data-qoder-id="qel-span-34feb87f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-34feb87f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffLine&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:7}}">
        {line.type !== 'addition' ? (line.oldLine || '') : ''}
      </span>
      {/* New line number */}
      <span className={cn('w-[38px] flex-shrink-0 text-right pr-2 select-none border-r border-[var(--color-border-subtle)]', lineNumColor[line.type])} data-qoder-id="qel-span-33feb6ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-33feb6ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffLine&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:7}}">
        {line.type !== 'deletion' ? (line.newLine || '') : ''}
      </span>
      {/* Prefix (+/-/space) */}
      <span className={cn('w-[20px] flex-shrink-0 text-center select-none font-medium', textColors[line.type])} data-qoder-id="qel-span-32feb559" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-32feb559&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffLine&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:7}}">
        {prefix[line.type]}
      </span>
      {/* Content */}
      <span className={cn('flex-1 pr-3 whitespace-pre', line.type === 'context' ? 'opacity-80' : '')} data-qoder-id="qel-span-31feb3c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-31feb3c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffLine&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:7}}">
        {line.content}
      </span>
    </div>
  )
}

export default function DiffViewer({ diff = DEMO_DIFF, isVisible = true }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = diff.hunks
      .flatMap(h => h.lines)
      .map(l => {
        const prefix = l.type === 'addition' ? '+' : l.type === 'deletion' ? '-' : ' '
        return `${prefix} ${l.content}`
      })
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--seed-bg)]"
      data-component="DiffViewer"
      data-od-id="diff-viewer"
     data-qoder-id="qel-diffviewer-062c1eff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-diffviewer-062c1eff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;diffviewer&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:5}}">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-flex-ebefee3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ebefee3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:129,&quot;column&quot;:7}}">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
         data-qoder-id="qel-flex-a32c6b22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a32c6b22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:130,&quot;column&quot;:9}}">
          {isExpanded ? (
            <ChevronDown size={12} className="text-[var(--seed-muted)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-muted-81c373c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-81c373c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:135,&quot;column&quot;:13}}"/>
          ) : (
            <ChevronRight size={12} className="text-[var(--seed-muted)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-muted-b450b59e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-b450b59e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:137,&quot;column&quot;:13}}"/>
          )}
          <GitBranch size={12} className="text-[var(--seed-primary)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-primary-15cf98a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-15cf98a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:11}}"/>
          <span className="text-[11px] font-mono text-[var(--seed-fg)] truncate" data-qoder-id="qel-text-11px-9004bb02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-9004bb02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:11}}">{diff.fileName}</span>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0" data-qoder-id="qel-flex-69af2b3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-69af2b3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:9}}">
          {/* Stats */}
          <span className="flex items-center gap-0.5 text-[10px] font-mono text-[var(--seed-primary)]" data-qoder-id="qel-flex-b1c301b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b1c301b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:11}}">
            <Plus size={10}  data-qoder-id="qel-plus-5c6d4fc1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-5c6d4fc1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:146,&quot;column&quot;:13}}"/>
            {diff.additions}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-mono text-[var(--seed-accent)]" data-qoder-id="qel-flex-b3c304dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b3c304dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:149,&quot;column&quot;:11}}">
            <Minus size={10}  data-qoder-id="qel-minus-8af6f387" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-minus-8af6f387&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;minus&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:13}}"/>
            {diff.deletions}
          </span>

          {/* Copy button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            className="ml-1"
           data-qoder-id="qel-ml-1-24809e83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-24809e83&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;ml-1&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:11}}">
            {copied ? <Check size={11} className="text-[var(--seed-primary)]"  data-qoder-id="qel-text-var-seed-primary-383f8e95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-383f8e95&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:23}}"/> : <Copy size={11}  data-qoder-id="qel-copy-45666477" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-copy-45666477&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;copy&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:84}}"/>}
          </Button>
        </div>
      </div>

      {/* Diff Content */}
      <AnimatePresence data-qoder-id="qel-animatepresence-afbe54e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-afbe54e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:167,&quot;column&quot;:7}}">
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
           data-qoder-id="qel-overflow-hidden-fc71dd83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-hidden-fc71dd83&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;overflow-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:169,&quot;column&quot;:11}}">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto" data-qoder-id="qel-overflow-x-auto-2b75b2ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-x-auto-2b75b2ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;overflow-x-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:176,&quot;column&quot;:13}}">
              {diff.hunks.map((hunk, hunkIdx) => (
                <div key={hunkIdx} data-qoder-id="qel-div-f224ee25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f224ee25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:17}}">
                  {/* Hunk Header */}
                  <div className="px-3 py-1 bg-[color-mix(in_srgb,var(--seed-primary)_6%,transparent)] border-y border-[var(--color-border-subtle)]" data-qoder-id="qel-px-3-633afebf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-633afebf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:180,&quot;column&quot;:19}}">
                    <span className="text-[10px] font-mono text-[var(--seed-muted)]" data-qoder-id="qel-text-10px-8f4701c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-8f4701c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:181,&quot;column&quot;:21}}">{hunk.header}</span>
                  </div>
                  {/* Lines */}
                  <div data-qoder-id="qel-div-ef24e96c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ef24e96c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:19}}">
                    {hunk.lines.map((line, lineIdx) => (
                      <DiffLine key={`${hunkIdx}-${lineIdx}`} line={line}  data-qoder-id="qel-diffline-c472acf3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-diffline-c472acf3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/DiffViewer.jsx&quot;,&quot;componentName&quot;:&quot;DiffViewer&quot;,&quot;elementRole&quot;:&quot;diffline&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:23}}"/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
