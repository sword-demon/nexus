# Phase 11 — Verification Notes

Verified at: 2026-07-04 13:35 CST

## Scope

Phase 11 only: xterm.js + node-pty terminal embedding, PTY IPC bridge, Monaco DiffViewer, fullscreen DiffViewer, and a dedicated isolated smoke script.

Out of scope: Phase 12 builtin skills, boot skill, packaging, release, and any production API call.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Phase 10 base remains valid | `docs/PHASE10-VERIFICATION.md` exists and `node scripts/phase10-smoke.cjs` passed after Phase 11 changes | PASS |
| Phase 11 dependencies installed | `package.json` contains `@xterm/xterm@^5.5.0`, `@xterm/addon-fit@^0.10.0`, and `monaco-editor@^0.52.2` under the requested `^0.52.0` range | PASS |
| Main-process PTY stream exists | `src/main/pty/manager.ts` uses `node-pty`, stores sessions, writes input, closes sessions, and resolves cwd through `pathGuard`; `src/main/pty/ipc.ts` registers `PTY_SPAWN`, `PTY_WRITE`, `PTY_CLOSE`, and emits `PTY_DATA` | PASS |
| Renderer terminal embeds xterm | `PtyTerminal.tsx` mounts `@xterm/xterm`, loads `FitAddon`, subscribes `pty:data`, sends input through `writePty`, and closes the PTY on unmount | PASS |
| xterm visual tokens match plan | `XtermTheme.ts` sets JetBrains Mono 13px, foreground from `--seed-fg`, and background from `--color-surface-card`; smoke saw `terminalFontSize:"13"` and `terminalBackground:"--color-surface-card"` | PASS |
| ANSI stdout remains visible | Phase 11 smoke ran `ls -la; printf '\033[31mPHASE11_RED\033[0m\n'`; xterm rows contained `PHASE11_RED` and DOM contained ANSI color classes | PASS |
| Interactive input reaches main PTY | Phase 11 smoke focused xterm, inserted `printf 'PHASE11_INTERACTIVE\n'\n`, and saw `terminalHasInteractive:true` from PTY stdout | PASS |
| `write_file` produces diff data | `writeFileTool` reads previous content, writes new content, and returns `diff` with additions/deletions; smoke wrote `generated/diff.txt` from `old line` to two new lines | PASS |
| Monaco diff renders ToolPanel diff | `DiffView.tsx` creates Monaco original/modified models, calls `createDiffEditor`, and smoke saw `.monaco-editor`, `data-diff-additions="2"`, `data-diff-deletions="1"`, and `data-line-numbers="true"` | PASS |
| Small diff inline / large diff side-by-side | `DiffView.tsx` uses inline mode below 24 lines and side-by-side for fullscreen/large diffs; smoke small diff saw `data-render-side-by-side="false"` | PASS |
| Fullscreen DiffViewer works | `DiffFullscreen` renders `data-od-id="diff-fullscreen"` and closes on Escape; smoke opened `↗` then closed with Escape | PASS |
| Tests are isolated | Phase 11 smoke uses temporary `NEXUS_DB_PATH`, Electron `userData`, project root, Claude home, permission file, mock API key, and local mock Anthropic SSE; temp directory is removed in `finally` | PASS |

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
✓ 2689 modules transformed.
✓ built in 25.60s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

Note: Vite reports a large chunk warning after adding Monaco. Build still exits 0.

```text
node scripts/phase10-smoke.cjs
PHASE10_SMOKE_RESULT {
  "ui": {
    "toolUseNames": ["write_file","exec","exec","exec","write_file"],
    "toolUseCount": 5,
    "toolResultCount": 5,
    "toolErrors": ["rejected","rejected"]
  },
  "files": {"once":"once","escExists":false},
  "rules": {"rules":[{"toolName":"exec","pattern":"pnpm test"}]},
  "mock": {"requests":6,"bodiesContainToolResults":5}
}
```

```text
node scripts/phase11-smoke.cjs
PHASE11_SMOKE_RESULT {
  "ui": {
    "toolUseNames": ["exec","write_file"],
    "toolUseCount": 2,
    "toolResultCount": 2,
    "terminalHasRed": true,
    "hasAnsiColor": true,
    "interactive": {"terminalHasInteractive": true},
    "hasMonacoEditor": true,
    "diffAdditions": "2",
    "diffDeletions": "1",
    "diffLineNumbers": "true",
    "diffSideBySide": "false",
    "fullscreenOpened": true,
    "fullscreenClosed": true
  },
  "file": "new line\nadded line\n",
  "mock": {"requests":3,"bodiesContainToolResults":2}
}
```

## Code Notes

- PTY cwd uses `resolveProjectPath(projectRoot, cwd)` so terminal sessions cannot start outside the selected project root.
- `PtyTerminal` replays the approved `exec` stdout into xterm, then opens a shell PTY in the same cwd for user-driven interactive input.
- ToolPanel only embeds xterm for exec output with ANSI escape sequences; ordinary exec summaries stay compact, preserving Phase 10 smoke stability.
- Monaco models are disposed on unmount to avoid leaking editor state.
- `write_file` diff generation is intentionally line-level and minimal for Phase 11; no extra diff dependency was added.
