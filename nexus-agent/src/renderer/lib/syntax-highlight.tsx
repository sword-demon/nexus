/**
 * Lightweight syntax highlighter for code blocks.
 * Supports TypeScript/JavaScript with celadon-themed coloring.
 * No external dependencies.
 */

interface TokenPattern {
  type: string
  pattern: RegExp
}

const TOKEN_PATTERNS: TokenPattern[] = [
  // Multi-line comments
  { type: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  // Single-line comments
  { type: 'comment', pattern: /\/\/[^\n]*/g },
  // Template literals
  { type: 'string', pattern: /`(?:[^`\\]|\\.)*`/g },
  // Double-quoted strings
  { type: 'string', pattern: /"(?:[^"\\]|\\.)*"/g },
  // Single-quoted strings
  { type: 'string', pattern: /'(?:[^'\\]|\\.)*'/g },
  // Numbers (including hex, binary, octal)
  { type: 'number', pattern: /\b(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?)\b/g },
  // TypeScript type annotations and generics
  { type: 'type', pattern: /\b(?:string|number|boolean|void|never|any|unknown|null|undefined|object|symbol|bigint|Promise|Record|Partial|Required|Readonly|Pick|Omit|Array|Map|Set)\b/g },
  // Keywords
  { type: 'keyword', pattern: /\b(?:import|export|from|default|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|delete|typeof|instanceof|in|of|throw|try|catch|finally|class|extends|super|this|async|await|yield|static|get|set|enum|interface|type|namespace|declare|abstract|implements|readonly|as|is|keyof|infer)\b/g },
  // Built-in functions/methods
  { type: 'builtin', pattern: /\b(?:console|process|require|module|exports|setTimeout|setInterval|clearTimeout|clearInterval|JSON|Math|Date|Error|RegExp|parseInt|parseFloat|isNaN|isFinite|decodeURI|encodeURI|Object|Array|String|Number|Boolean|Symbol|BigInt|Proxy|Reflect|WeakMap|WeakSet|Promise|Generator|Iterator)\b/g },
  // Function calls (word followed by parenthesis)
  { type: 'function', pattern: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g },
  // Decorators / special markers
  { type: 'decorator', pattern: /@[\w$]+/g },
  // Operators
  { type: 'operator', pattern: /(?:=>|\.\.\.|\?\?|&&|\|\||[+\-*/%]=?|[<>]=?|===?|!==?|\?\.)/g },
  // Punctuation
  { type: 'punctuation', pattern: /[{}[\]();:,.]/g },
]

/**
 * Tokenize source code into highlighted spans.
 * Returns an array of { type, text, start, end } tokens.
 */
interface Token {
  type: string
  text: string
  start: number
  end: number
}

function tokenize(code: string): Token[] {
  const tokens = []

  for (const { type, pattern } of TOKEN_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(code)) !== null) {
      tokens.push({
        type,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      })
    }
  }

  // Sort by start position, then by length (longer first for overlapping)
  tokens.sort((a, b) => a.start - b.start || b.end - a.end)

  // Remove overlapping tokens (keep the first/longest match)
  const result = []
  let lastEnd = 0
  for (const token of tokens) {
    if (token.start >= lastEnd) {
      // Add plain text before this token
      if (token.start > lastEnd) {
        result.push({ type: 'plain', text: code.slice(lastEnd, token.start), start: lastEnd, end: token.start })
      }
      result.push(token)
      lastEnd = token.end
    }
  }
  // Add remaining plain text
  if (lastEnd < code.length) {
    result.push({ type: 'plain', text: code.slice(lastEnd), start: lastEnd, end: code.length })
  }

  return result
}

/**
 * Convert tokenized output to React elements with syntax highlighting classes.
 */
export function highlightCode(code: string, language = '') {
  const tokens = tokenize(code)

  return tokens.map((token, index) => {
    if (token.type === 'plain') {
      return <span key={index} data-qoder-id="qel-span-078daefd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-078daefd&quot;,&quot;filePath&quot;:&quot;react-vite/src/lib/syntax-highlight.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:14}}">{token.text}</span>
    }
    return (
      <span key={index} className={`hltoken-${token.type}`} data-qoder-id="qel-span-048daa44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-048daa44&quot;,&quot;filePath&quot;:&quot;react-vite/src/lib/syntax-highlight.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:92,&quot;column&quot;:7}}">
        {token.text}
      </span>
    )
  })
}

export default highlightCode
