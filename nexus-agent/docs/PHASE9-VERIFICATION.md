# Phase 9 — Verification Notes

Verified at: 2026-07-04 11:58 CST

## Scope

Phase 9 only: real agent tool execution for `read_file`, `write_file`, `list_dir`, `search_files`, and `exec`.

Out of scope: PermissionPrompt policy decisions, dangerous command allow/deny rules, xterm terminal embedding, and Monaco DiffViewer. Those remain Phase 10 and Phase 11 work.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Phase 8 base remains valid | `docs/PHASE8-VERIFICATION.md` exists and `node scripts/phase8-smoke.cjs` passed after Phase 9 replaced the old stub write result with real `bytesWritten` output | PASS |
| Five tools are exposed to the model | `src/main/agent/tools/index.ts` exports `AGENT_TOOLS` for `read_file`, `write_file`, `list_dir`, `search_files`, and `exec`; `stream.ts` sends that list to Anthropic | PASS |
| Dispatcher calls real tools | `src/main/agent/dispatcher.ts` validates inputs and dispatches all five tools; unknown tools still return `Unsupported tool` | PASS |
| Project-root path guard exists | `src/main/security/pathGuard.ts` resolves real paths and raises `OUT_OF_BOUNDS` when a target escapes the project root | PASS |
| Existing symlink write targets cannot escape project root | `node scripts/phase9-pathguard-smoke.cjs` verified both `../outside.txt` and an existing symlink write target resolve to `OUT_OF_BOUNDS` | PASS |
| `read_file` reads project files | Phase 9 smoke read `notes.txt` and ToolPanel showed `{"path":"notes.txt","content":"needle lives here\n"}` | PASS |
| `read_file('/etc/passwd')` is rejected | Phase 9 smoke produced `OUT_OF_BOUNDS: Path is outside project root: /private/etc/passwd`; no external file content was returned | PASS |
| `list_dir` returns directory entries | Phase 9 smoke listed `AGENTS.md`, `CLAUDE.md`, `node_modules`, and `notes.txt` with relative paths | PASS |
| `search_files` searches project text without extra dependency | `searchFiles.ts` uses native `fs` recursion and skips `.git`, `node_modules`, `dist`, `dist-main`, and `out`; smoke found `needle` in `notes.txt` and did not surface the fixture under `node_modules` | PASS |
| `write_file` writes project files in the temporary Phase 9 mode | Phase 9 smoke wrote `generated/output.txt`; child process read back `created by phase9`; ToolPanel showed `bytesWritten:17` | PASS |
| `exec` uses `node-pty` | `src/main/agent/tools/exec.ts` imports `node-pty` and calls `pty.spawn`; smoke ran `ls generated` and returned `stdout:"output.txt\n"` with `exitCode:0` | PASS |
| Native dependency is configured | `package.json` includes `node-pty:^1.0.0`, `rebuild:native` rebuilds `better-sqlite3` and `node-pty`, and `electron-builder.yml` unpacks `node_modules/node-pty/**/*` plus `*.node` | PASS |
| ToolPanel receives tool events | Phase 9 smoke recorded `toolUseCount:6`, `toolResultCount:6`, `toolUseNames:["read_file","read_file","list_dir","search_files","write_file","exec"]`, and ToolPanel rendered all outputs | PASS |
| Tool results continue back to the model | Mock Anthropic server saw `requests:7` and `bodiesContainToolResults:6` | PASS |
| Test isolation | Phase 9 smoke uses temp `NEXUS_DB_PATH`, temp Electron `userData`, temp project root, temp `NEXUS_CLAUDE_HOME`, mock API key, and local mock Anthropic SSE | PASS |

## Commands Run

```text
npm run tsc:check
> npm run tsc:main && npm run tsc:renderer
> tsc --noEmit -p tsconfig.main.json
> tsc --noEmit -p tsconfig.renderer.json
```

```text
npm run electron:build
vite v5.4.21 building for production...
✓ 1629 modules transformed.
✓ built in 2.74s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

```text
node scripts/phase9-pathguard-smoke.cjs
PHASE9_PATHGUARD_SMOKE_RESULT {"parentEscape":"OUT_OF_BOUNDS","writeSymlinkEscape":"OUT_OF_BOUNDS"}
```

```text
node scripts/phase8-smoke.cjs
PHASE8_SMOKE_RESULT {
  "ui": {
    "chatText": "...ping...pong from phase8...",
    "toolText": "...写入文件...tmp.txt...\"bytesWritten\":5...",
    "statusText": "完成任务已完成",
    "inputValue": "",
    "toolUseCount": 1,
    "toolResultCount": 1,
    "endTurnCount": 1
  },
  "mock": {"requests":2,"bodiesContainToolResult":true}
}
```

```text
node scripts/phase9-smoke.cjs
PHASE9_SMOKE_RESULT {
  "ui": {
    "toolUseNames": ["read_file","read_file","list_dir","search_files","write_file","exec"],
    "toolUseCount": 6,
    "toolResultCount": 6,
    "toolErrors": ["OUT_OF_BOUNDS: Path is outside project root: /private/etc/passwd"],
    "toolText": "...notes.txt...needle lives here...generated/output.txt...stdout\":\"output.txt\\n\"...\"exitCode\":0...",
    "statusText": "完成任务已完成"
  },
  "file": "created by phase9",
  "mock": {"requests":7,"bodiesContainToolResults":6}
}
```

## Code Notes

- `write_file` and `exec` are intentionally direct in Phase 9, but both are constrained by `pathGuard` to the current project root.
- `pathGuard` checks existing write targets by realpath first, so symlinked files cannot be used to write outside the project root.
- Phase 10 must connect `write_file` and `exec` to PermissionPrompt before exposing durable allow/deny behavior.
- Dangerous command matching is not implemented in Phase 9; it belongs to Phase 10.
- `search_files` uses native `fs` traversal to avoid adding `fast-glob` for this phase.
- `exec` has a 10 second timeout and returns accumulated stdout plus `exitCode`; interactive terminal streaming remains Phase 11.
