# Phase 14 — Verification Notes

Verified at: 2026-07-05 02:01 CST

## Scope

Phase 14 only: electron-builder macOS DMG packaging, native dependency unpack/rebuild, isolated MVP smoke, real UI smoke, package artifact checks, and MVP documentation.

Out of scope: notarization, publishing, production API calls, Phase 15 features, and clean-room Sonoma install execution.

## Acceptance Matrix

| DEV-PLAN / MVP item | Evidence | Result |
| --- | --- | --- |
| `appId` and `productName` configured | `electron-builder.yml` has `appId: com.nexus.agent` and `productName: Nexus Agent` | PASS |
| macOS DMG target configured | `electron-builder.yml` has `mac.category: public.app-category.developer-tools` and `mac.target: dmg` for arm64 | PASS |
| Native modules unpacked | `asarUnpack` includes `better-sqlite3`, `node-pty`, `**/*.node`, and `**/*.dylib` | PASS |
| Native rebuild/install flow | `package.json` postinstall runs `electron-builder install-app-deps && npm run rebuild:native`; `scripts/build-mac.sh` runs `electron-builder install-app-deps` before `electron-builder --mac` | PASS |
| DMG artifact produced | `npm run build:mac` produced `out/Nexus Agent-0.1.0.dmg` | PASS |
| Package contains native modules | `node scripts/phase14-package-check.cjs` found `better_sqlite3.node` and `node-pty`/`pty.node` under `app.asar.unpacked` | PASS |
| Packaged app can start locally | Latest packaged `.app` stayed alive for 5s with isolated `userData`, DB, Claude home, and permissions path | PASS |
| MVP workflow includes `/prd` and `/goal` | `node scripts/phase14-mvp-smoke.cjs` chat text included `/prd` and `/goal` from local mock SSE | PASS |
| ToolPanel shows tool flow | Phase 14 smoke saw ToolPanel text containing `写入文件` and `执行命令` | PASS |
| One file changed and `npm test` passed | Phase 14 smoke wrote `generated/mvp.txt` with `PHASE14_MVP_OK`; `npm test` returned `exitCode:0` and stdout `PHASE14_NPM_TEST_GREEN` | PASS |
| Real UI smoke covers Stage 1 high-risk workflow | `node scripts/phase14-ui-smoke.cjs` clicked `添加项目`, sent a message, restarted with the same DB/userData, restored persisted history, rejected `/readonly` write without permission prompt, and verified `always` permission in SQLite | PASS |
| Smoke isolation | Smoke uses temp `NEXUS_SMOKE_USER_DATA`, `NEXUS_DB_PATH`, project, `NEXUS_CLAUDE_HOME`, and `NEXUS_PERMISSIONS_PATH`; API calls use local mock SSE | PASS |
| Uninstall data path is clean | Production bootstrap sets Electron `userData` to `~/Library/Application Support/Nexus`; DB already uses the same app data directory | PASS |
| Clean macOS Sonoma install | Not executed here; current host is macOS 26.5.1 arm64, not clean Sonoma 14.x | NOT RUN |

## Commands Run

```text
npm run tsc:check
> tsc --noEmit -p tsconfig.main.json
> tsc --noEmit -p tsconfig.renderer.json
exit 0
```

```text
npm run build:mac
> npm run electron:build
> electron-builder install-app-deps
> electron-builder --mac
electron-builder: packaging platform=darwin arch=arm64 appOutDir=out/mac-arm64
electron-builder: building target=DMG arch=arm64 file=out/Nexus Agent-0.1.0.dmg
exit 0
```

Notes from packaging:

- Vite still reports the existing Monaco large chunk warning; build exits 0.
- electron-builder reports `author is missed`, default Electron icon, and skipped macOS code signing because no Developer ID identity is installed. This Phase does not publish, notarize, or upload.

```text
node scripts/phase14-package-check.cjs
PHASE14_PACKAGE_RESULT {
  "dmgFiles": ["out/Nexus Agent-0.1.0.dmg"],
  "unpackedDir": "out/mac-arm64/Nexus Agent.app/Contents/Resources/app.asar.unpacked",
  "betterSqlite3": ["node_modules/better-sqlite3/build/Release/better_sqlite3.node"],
  "nodePty": ["node_modules/node-pty/bin/darwin-arm64-140/node-pty.node", "node_modules/node-pty/build/Release/pty.node", "..."]
}
```

```text
node scripts/phase14-mvp-smoke.cjs
PHASE14_MVP_SMOKE_RESULT {
  "toolUseNames": ["write_file", "exec"],
  "toolResultCount": 2,
  "file": "PHASE14_MVP_OK\n",
  "execResults": [{"command":"npm","args":["test"],"exitCode":0,"stdout":"...PHASE14_NPM_TEST_GREEN..."}],
  "mock": {"requests":3,"bodiesContainToolResults":2}
}
```

```text
node scripts/phase14-ui-smoke.cjs
PHASE14_UI_SMOKE_RESULT {
  "first.addedState.projects.length": 1,
  "first.messages": ["user: ui smoke first: write generated/allowed.txt", "assistant: UI smoke first turn. ui smoke first done"],
  "restore.messagesContain": "ui smoke first done",
  "rules": [{"toolName":"write_file","pattern":"generated/allowed.txt","scope":"always"}],
  "readonly.tool_result": {"ok": false, "error": "Tool not allowed by active skill: write_file"},
  "files": {"allowed": "ALWAYS_OK\\n", "deniedExists": false},
  "mock.toolNamesByRequest[2]": ["read_file"],
  "mock.toolNamesByRequest[3]": ["read_file"]
}
```

```text
node scripts/phase10-smoke.cjs
PHASE10_SMOKE_RESULT toolUseCount=5 toolResultCount=5 alwaysRule=exec:pnpm test denied=["rejected","rejected"]
```

```text
node scripts/phase12-smoke.cjs
PHASE12_SMOKE_RESULT expectedSkillsPresent=true workflowReferencesCoreSkills=true loadErrorCount=0
```

```text
node scripts/phase13-smoke.cjs
PHASE13_SMOKE_RESULT windows.countAfterMenuNewWindow=2 tray.executing.color=#f59e0b shortcut.focus.active=true settingsDisable.disabled=true
```

```text
Packaged app launch smoke
PHASE14_APP_LAUNCH_RESULT {"status":"stable_for_5s"}
stderr only included Node DEP0040 punycode deprecation warning.
```

## Fix Log

| Issue | Fix | Result |
| --- | --- | --- |
| Phase 14 smoke initially set `HOME` to a temp dir, which made Electron safeStorage report no configured API key in this environment | Matched existing Phase 10/11 isolation: keep process `HOME`, isolate `userData`, DB, Claude home, permissions, and assert `setApiKey` returns `ok` | PASS |
| Phase 14 smoke returned full ToolPanel xterm DOM text, producing an oversized child result line | Trimmed ToolPanel sample to 1200 chars and kept npm stdout evidence from structured `tool_result.output` | PASS |
| Production user data was split between `Nexus` DB path and Electron default `Nexus Agent` userData path | Set production `app.setPath('userData', ~/Library/Application Support/Nexus)` while preserving `NEXUS_SMOKE_USER_DATA` override | PASS |
| Real UI smoke exposed the filtered-tools path importing a stale CommonJS artifact | Changed the agent stream import from `./tools` to `./tools/index`, so runtime filtering can read `AGENT_TOOLS` consistently after `electron:build` | PASS |
| Failed turns could collapse to an unhelpful `unknown` surface during UI smoke | Added agent error logging around `runStreamingTurn` catch to record the real exception message in `main.log` | PASS |

## Code Review Notes

- Scope stayed inside Phase 14 packaging/MVP verification plus the minimum uninstall data-path fix.
- No new dependencies were added.
- No production API was called; Anthropic requests in MVP smoke use a local SSE mock.
- No Git commit, push, branch, reset, notarization, or upload was performed.
- Existing trusted project root, PermissionPrompt, and PTY path guard code paths were not weakened.
