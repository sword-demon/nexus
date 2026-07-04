# MVP Test Script

Verified at: 2026-07-04 22:05 CST

## Automated Smoke

Run from `nexus-agent/`:

```bash
npm run electron:build
node scripts/phase14-mvp-smoke.cjs
```

The smoke is fully isolated:

| State | Isolation |
| --- | --- |
| Electron userData | temp `NEXUS_SMOKE_USER_DATA` |
| SQLite DB | temp `NEXUS_DB_PATH` |
| Project | temp project with `package.json` and `test.js` |
| Claude home | temp `NEXUS_CLAUDE_HOME` |
| Permissions | temp `NEXUS_PERMISSIONS_PATH` |
| API | local mock SSE via `NEXUS_ANTHROPIC_BASE_URL` |

Expected result:

```text
PHASE14_MVP_SMOKE_RESULT
```

The script asserts the three MVP hard metrics:

| MVP metric | Automated evidence |
| --- | --- |
| Run 1 sample workflow | Mock assistant emits `/prd` then `/goal`; UI chat text must include both |
| Show agent tool calls | ToolPanel text must include `写入文件` and `执行命令`; event stream must include `write_file` and `exec` |
| Change 1 file and pass `npm test` | `generated/mvp.txt` must contain `PHASE14_MVP_OK`; `npm test` result must have `exitCode:0` and stdout `PHASE14_NPM_TEST_GREEN` |

Latest local result:

```text
toolUseNames: ["write_file","exec"]
toolResultCount: 2
changed file: PHASE14_MVP_OK
npm test: exitCode 0, stdout contains PHASE14_NPM_TEST_GREEN
mock requests: 3
mock bodies with tool_result: 2
```

## Package Smoke

Run from `nexus-agent/`:

```bash
npm run build:mac
node scripts/phase14-package-check.cjs
```

Expected artifacts:

```text
out/Nexus Agent-0.1.0.dmg
out/mac-arm64/Nexus Agent.app/Contents/Resources/app.asar.unpacked
```

Latest local result:

```text
PHASE14_PACKAGE_RESULT
dmgFiles: ["out/Nexus Agent-0.1.0.dmg"]
betterSqlite3: node_modules/better-sqlite3/build/Release/better_sqlite3.node
nodePty: node-pty.node / pty.node files under node_modules/node-pty
```

Packaged app launch smoke:

```text
PHASE14_APP_LAUNCH_RESULT {"status":"stable_for_5s"}
```

## Manual Clean macOS Checklist

Not executed in this workspace: current machine is macOS 26.5.1 arm64, not a clean macOS Sonoma 14.x install.

Manual steps for a clean Sonoma machine:

1. Copy `out/Nexus Agent-0.1.0.dmg`.
2. Mount the DMG.
3. Drag `Nexus Agent.app` to `/Applications`.
4. Launch `Nexus Agent.app`.
5. Add a disposable project with a simple `npm test`.
6. Run a prompt equivalent to: `run /prd then /goal, update one file, then npm test`.
7. Confirm ToolPanel shows file write and command execution.
8. Confirm one file changed and `npm test` passed.
9. Quit the app and move it to Trash.
10. Optional cleanup: remove `~/Library/Application Support/Nexus`.
