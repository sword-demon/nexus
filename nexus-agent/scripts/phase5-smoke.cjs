#!/usr/bin/env node

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) {
  void runElectron()
} else {
  runWrapper()
}

function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase5-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  const userData = path.join(tempDir, 'userData')
  const dbPath = path.join(tempDir, 'nexus.db')
  writeFixture(home, project)

  const child = spawnSync(electron, [__filename], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      NEXUS_DB_PATH: dbPath,
      NEXUS_SMOKE_USER_DATA: userData,
      NEXUS_SMOKE_PROJECT: project,
    },
  })
  if (child.status !== 0) {
    throw new Error(`phase5 smoke failed\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`)
  }
  const line = child.stdout.split('\n').find((s) => s.startsWith('PHASE5_CHILD_RESULT '))
  if (!line) throw new Error(`phase5 smoke produced no result\n${child.stdout}\n${child.stderr}`)
  const result = JSON.parse(line.slice('PHASE5_CHILD_RESULT '.length))
  console.log(`PHASE5_SMOKE_RESULT ${JSON.stringify(result)}`)
  fs.rmSync(tempDir, { recursive: true, force: true })
}

async function runElectron() {
  const { app, BrowserWindow } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
  registerIpcHandlers()

  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(root, 'dist-main', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  await win.loadFile(path.join(root, 'dist', 'index.html'))

  const project = process.env.NEXUS_SMOKE_PROJECT
  await win.webContents.executeJavaScript(`
    (async () => {
      await window.nexus.addProject({ path: ${JSON.stringify(project)}, displayName: 'Phase 5 Smoke' })
      location.reload()
      return true
    })()
  `, true)
  await waitForLoad(win)

  const direct = await win.webContents.executeJavaScript(`
    (async () => window.nexus.loadContext({ projectPath: ${JSON.stringify(project)} }))()
  `, true)
  const dom = await waitForText(win, ['refactor', '解析失败'])

  const context = direct.context
  const names = context.skills.map((skill) => `${skill.name}:${skill.scope}`)
  const testSkill = context.skills.find((skill) => skill.name === 'test')
  const invalidInSkills = context.skills.some((skill) => skill.name === 'broken' || skill.scope === 'invalid')

  console.log(`PHASE5_CHILD_RESULT ${JSON.stringify({
    directStatus: direct.status,
    claudeLoaded: context.claudeMd.includes('PROJECT_CLAUDE_PHASE5'),
    agentsLoaded: context.agentsMd.includes('PROJECT_AGENTS_PHASE5'),
    skillNames: names,
    refactorListed: names.includes('refactor:project'),
    projectOverridesGlobal: testSkill?.scope === 'project' && testSkill.content.includes('PROJECT_TEST_SKILL'),
    invalidInSkills,
    loadErrorCount: context.loadErrors.length,
    invalidErrorRecorded: context.loadErrors.some((err) => err.path.includes('broken') && err.reason.includes('description')),
    toolPanelTextFound: dom.ok,
  })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function writeFixture(home, project) {
  fs.mkdirSync(path.join(home, '.claude', 'skills', 'test'), { recursive: true })
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'refactor'), { recursive: true })
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'test'), { recursive: true })
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'broken'), { recursive: true })
  fs.writeFileSync(path.join(home, '.claude', 'CLAUDE.md'), 'GLOBAL_CLAUDE_PHASE5\n')
  fs.writeFileSync(path.join(home, '.claude', 'AGENTS.md'), 'GLOBAL_AGENTS_PHASE5\n')
  fs.writeFileSync(path.join(home, '.claude', 'skills', 'test', 'SKILL.md'), skill('test', 'global test skill', 'GLOBAL_TEST_SKILL'))
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'PROJECT_CLAUDE_PHASE5\n')
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'PROJECT_AGENTS_PHASE5\n')
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'refactor', 'SKILL.md'), skill('refactor', 'Refactor code', 'PROJECT_REFACTOR_SKILL'))
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'test', 'SKILL.md'), skill('test', 'project test skill', 'PROJECT_TEST_SKILL'))
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'broken', 'SKILL.md'), `---\nname: broken\n---\nBROKEN_SKILL\n`)
}

function skill(name, description, body) {
  return `---\nname: ${name}\ndescription: ${description}\nwhen_to_use: smoke\nallowed-tools: [Read]\n---\n${body}\n`
}

function waitForLoad(win) {
  return new Promise((resolve) => {
    win.webContents.once('did-finish-load', resolve)
  })
}

async function waitForText(win, needles) {
  for (let i = 0; i < 50; i += 1) {
    const text = await win.webContents.executeJavaScript('document.body.textContent ?? ""', true)
    if (needles.every((needle) => text.includes(needle))) return { ok: true }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return { ok: false }
}

function assertBuilt() {
  const required = [
    path.join(root, 'dist', 'index.html'),
    path.join(root, 'dist-main', 'main', 'ipc.js'),
    path.join(root, 'dist-main', 'preload', 'index.js'),
  ]
  for (const file of required) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${file}. Run npm run electron:build first.`)
    }
  }
}
