#!/usr/bin/env node

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const expectedSkills = [
  'goal-workflow',
  'prd',
  'prd-to-spec',
  'to-issues',
  'goal',
  'review-it',
  'ship-it',
  'refactor',
  'note-it',
  'code-to-spec',
]

if (process.versions.electron) {
  void runElectron()
} else {
  runWrapper()
}

function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase12-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  const userData = path.join(tempDir, 'userData')
  writeProjectOverride(project)

  const child = spawnSync(electron, [__filename], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      NEXUS_CLAUDE_HOME: home,
      NEXUS_SMOKE_PROJECT: project,
      NEXUS_SMOKE_USER_DATA: userData,
      NEXUS_BUILTIN_SKILLS_SOURCE: path.join(root, 'resources', 'builtin-skills'),
    },
  })
  if (child.status !== 0) {
    throw new Error(`phase12 smoke failed\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`)
  }
  const line = child.stdout.split('\n').find((s) => s.startsWith('PHASE12_CHILD_RESULT '))
  if (!line) throw new Error(`phase12 smoke produced no result\n${child.stdout}\n${child.stderr}`)
  const result = JSON.parse(line.slice('PHASE12_CHILD_RESULT '.length))
  assertSmokeResult(result)
  console.log(`PHASE12_SMOKE_RESULT ${JSON.stringify(result)}`)
  fs.rmSync(tempDir, { recursive: true, force: true })
}

async function runElectron() {
  const { app } = require('electron')
  const { installBuiltinSkills } = require('../dist-main/main/skills/builtin.js')
  const { loadPromptContext } = require('../dist-main/main/skills/loader.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()

  const firstInstall = installBuiltinSkills()
  const prdTarget = path.join(firstInstall.targetDir, 'prd', 'SKILL.md')
  fs.appendFileSync(prdTarget, '\nUSER_MUTATION_PHASE12\n')
  const secondInstall = installBuiltinSkills()
  const overwritePreserved = fs.readFileSync(prdTarget, 'utf8').includes('USER_MUTATION_PHASE12')

  const context = await loadPromptContext(process.env.NEXUS_SMOKE_PROJECT)
  const skillNames = context.skills.map((skill) => `${skill.name}:${skill.scope}`)
  const prdSkill = context.skills.find((skill) => skill.name === 'prd')
  const workflowSkill = context.skills.find((skill) => skill.name === 'goal-workflow')
  const shipIt = fs.readFileSync(path.join(firstInstall.targetDir, 'ship-it', 'SKILL.md'), 'utf8')
  const allowedToolsLine = shipIt.split('\n').find((line) => line.startsWith('allowed-tools:')) || ''

  console.log(`PHASE12_CHILD_RESULT ${JSON.stringify({
    install: {
      firstCopied: firstInstall.copied,
      firstSkipped: firstInstall.skipped,
      secondCopied: secondInstall.copied,
      secondSkipped: secondInstall.skipped,
      targetDir: firstInstall.targetDir,
    },
    installedDirs: fs.readdirSync(firstInstall.targetDir).sort(),
    overwritePreserved,
    skillNames,
    expectedSkillsPresent: expectedSkills.every((name) => context.skills.some((skill) => skill.name === name)),
    prdIsProjectOverride: prdSkill?.scope === 'project' && prdSkill.content.includes('PROJECT_PRD_OVERRIDE_PHASE12'),
    workflowDescription: workflowSkill?.description,
    workflowReferencesCoreSkills: ['/prd', '/prd-to-spec', '/to-issues', '/goal', '/review-it', '/ship-it']
      .every((needle) => workflowSkill?.content.includes(needle)),
    shipAllowedToolsLine: allowedToolsLine,
    shipPushInAllowedTools: /git\s+push|push.*main|push.*master/i.test(allowedToolsLine),
    shipProhibitsPush: /禁止执行 `git push`|禁止 push 到 main\/master/.test(shipIt),
    loadErrorCount: context.loadErrors.length,
  })}`)

  app.quit()
}

function writeProjectOverride(project) {
  const dir = path.join(project, '.claude', 'skills', 'prd')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\nname: prd\ndescription: project prd override\nallowed-tools: [read_file]\n---\nPROJECT_PRD_OVERRIDE_PHASE12\n`,
  )
}

function assertSmokeResult(result) {
  const missing = expectedSkills.filter((name) => !result.installedDirs.includes(name))
  if (missing.length > 0) throw new Error(`missing builtin skill dirs: ${missing.join(', ')}`)
  if (result.install.firstCopied < expectedSkills.length) throw new Error('first install did not copy builtin skills')
  if (result.install.secondCopied !== 0) throw new Error('second install overwrote or copied files')
  if (!result.overwritePreserved) throw new Error('second install did not preserve user-modified file')
  if (!result.expectedSkillsPresent) throw new Error('loadContext did not include all builtin skills')
  if (!result.prdIsProjectOverride) throw new Error('project skill did not override builtin prd')
  if (result.workflowDescription !== 'goal 六步法驱动 PR') throw new Error('goal-workflow description mismatch')
  if (!result.workflowReferencesCoreSkills) throw new Error('goal-workflow does not reference all core skills')
  if (result.shipPushInAllowedTools) throw new Error('ship-it allowed-tools grants push')
  if (!result.shipProhibitsPush) throw new Error('ship-it does not explicitly prohibit push')
  if (result.loadErrorCount !== 0) throw new Error(`unexpected load errors: ${result.loadErrorCount}`)
}

function assertBuilt() {
  const required = [
    path.join(root, 'dist-main', 'main', 'skills', 'builtin.js'),
    path.join(root, 'dist-main', 'main', 'skills', 'loader.js'),
    path.join(root, 'resources', 'builtin-skills', 'goal-workflow', 'SKILL.md'),
  ]
  for (const file of required) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${file}. Run npm run electron:build first.`)
    }
  }
}
