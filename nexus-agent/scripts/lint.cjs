#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const sourceDir = path.join(root, 'src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'])
const rules = [
  { name: 'debugger statement', pattern: /\bdebugger\b/g },
  { name: 'leftover demo constant', pattern: /\bDEMO_[A-Z0-9_]*\b/g },
  { name: 'hardcoded secret-like key', pattern: /\bsk-[a-z0-9_-]*[A-Za-z0-9]{24,}\b/g },
]

const failures = []
let checked = 0

for (const file of walk(sourceDir)) {
  checked += 1
  const text = fs.readFileSync(file, 'utf8')
  for (const rule of rules) {
    rule.pattern.lastIndex = 0
    for (const match of text.matchAll(rule.pattern)) {
      failures.push(`${path.relative(root, file)}:${lineOf(text, match.index ?? 0)} ${rule.name}: ${match[0]}`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`lint passed: ${checked} source files checked`)

function walk(dir) {
  const files = []
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name.startsWith('.')) continue
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) files.push(...walk(fullPath))
    else if (extensions.has(path.extname(item.name))) files.push(fullPath)
  }
  return files
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}
