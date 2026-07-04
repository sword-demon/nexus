#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'out')

const dmgFiles = listFiles(outDir).filter((file) => file.endsWith('.dmg'))
const unpackedDir = findUnpackedDir(outDir)
const nativeFiles = unpackedDir ? listFiles(unpackedDir).map((file) => path.relative(unpackedDir, file)) : []

const result = {
  dmgFiles: dmgFiles.map((file) => path.relative(root, file)),
  unpackedDir: unpackedDir ? path.relative(root, unpackedDir) : null,
  betterSqlite3: nativeFiles.filter((file) => file.endsWith('better_sqlite3.node')),
  nodePty: nativeFiles.filter((file) => file.endsWith('node-pty.node') || file.endsWith('pty.node')),
  dylib: nativeFiles.filter((file) => file.endsWith('.dylib')),
}

if (result.dmgFiles.length === 0) fail('missing dmg artifact', result)
if (!result.unpackedDir) fail('missing app.asar.unpacked directory', result)
if (result.betterSqlite3.length === 0) fail('missing better_sqlite3.node in app.asar.unpacked', result)
if (result.nodePty.length === 0) fail('missing node-pty native module in app.asar.unpacked', result)

console.log(`PHASE14_PACKAGE_RESULT ${JSON.stringify(result)}`)

function fail(message, details) {
  console.error(`PHASE14_PACKAGE_CHECK_FAILED ${message}`)
  console.error(JSON.stringify(details, null, 2))
  process.exit(1)
}

function findUnpackedDir(dir) {
  return listDirs(dir).find((item) => item.endsWith(path.join('Contents', 'Resources', 'app.asar.unpacked'))) ?? null
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...listFiles(fullPath))
    else found.push(fullPath)
  }
  return found
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return []
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const fullPath = path.join(dir, entry.name)
    found.push(fullPath, ...listDirs(fullPath))
  }
  return found
}
