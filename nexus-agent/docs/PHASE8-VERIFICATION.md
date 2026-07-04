# Phase 8 — Verification Notes

Verified at: 2026-07-04 11:08 Asia/Shanghai

## Scope

Phase 8 only: renderer UI shell migration from demo constants to Zustand and IPC-backed data.

Out of scope: real filesystem tools, shell execution, PermissionPrompt decision logic, and Monaco diff rendering. Those remain Phase 9, Phase 10, and Phase 11.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Phase 7 base remains valid | `docs/PHASE7-VERIFICATION.md` exists and `node scripts/phase7-smoke.cjs` passed after the renderer migration | PASS |
| UI components use TSX and typed props/state | `ChatPanel.tsx`, `CommandInput.tsx`, `ToolPanel.tsx`, `StatusIndicator.tsx`, `PermissionPrompt.tsx`, `SettingsModal.tsx`, and `DiffViewer.tsx` are the active component files | PASS |
| Demo constants removed from renderer | `rg "DEMO_\|CONTEXT_FILES" src/renderer` produced no output | PASS |
| ChatPanel uses store messages and streaming text | Phase 8 smoke typed `ping` in the real main window; ChatPanel text contained `ping` and streamed assistant text `pong from phase8` | PASS |
| CommandInput sends through real IPC path | Smoke used DOM input + Enter on `[data-od-id="command-input"] textarea`; mock API saw `requests:2` and a `tool_result` continuation | PASS |
| ToolPanel uses real tool events | Smoke recorded `toolUseCount:1`, `toolResultCount:1`; ToolPanel text contained `写入文件`, `tmp.txt`, and stub output | PASS |
| StatusIndicator syncs from Zustand | Smoke status text reached `完成任务已完成` after the event stream completed | PASS |
| PermissionPrompt is wired but Phase 10 logic is not implemented | `App.tsx` renders the first `permissions` entry and resolves local UI state only; no persistent allow/deny policy was added | PASS |
| DiffViewer no longer renders fake diff | `DiffViewer.tsx` accepts `diff` or empty state and ToolPanel only renders it when a real diff payload exists | PASS |
| Central event subscription hook exists | `src/renderer/hooks/useAgentEvent.ts` handles `status`, `text_delta`, `tool_use`, `tool_result`, `permission_request`, `error`, and `end_turn` | PASS |
| `window.nexus` is typed | `src/renderer/types/electron.d.ts` exposes `Window.nexus: NexusApi`; renderer code does not add `any` around the bridge | PASS |
| Test isolation | Phase 8 smoke uses temp `NEXUS_DB_PATH`, temp Electron `userData`, temp project, temp `NEXUS_CLAUDE_HOME`, mock API key, and local mock Anthropic SSE | PASS |

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
✓ built in 1.64s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

```text
node scripts/phase7-smoke.cjs
PHASE7_SMOKE_RESULT {
  "single": {"statuses":["thinking","streaming","done"],"textDeltaCount":1,"endTurnCount":1,"statusText":"完成任务已完成"},
  "tool": {"statuses":["thinking","streaming","executing","streaming","done"],"toolUseCount":1,"toolResultCount":1,"mock":{"requests":2,"bodiesContainToolResult":true}},
  "abort": {"statuses":["thinking","streaming","error"],"errorCodes":["aborted"],"statusText":"错误执行出错"}
}
```

```text
node scripts/phase8-smoke.cjs
PHASE8_SMOKE_RESULT {
  "ui": {
    "chatText": "...ping...pong from phase8...",
    "toolText": "...写入文件...tmp.txt...\"stub\":true...",
    "statusText": "完成任务已完成",
    "inputValue": "",
    "textDeltaCount": 1,
    "toolUseCount": 1,
    "toolResultCount": 1,
    "endTurnCount": 1
  },
  "mock": {"requests":2,"bodiesContainToolResult":true}
}
```

```text
rg "DEMO_|CONTEXT_FILES" src/renderer
# no output
```

## Code Notes

- `src/renderer/hooks/useAgentEvent.ts` is the single renderer subscription point for agent push events.
- `src/renderer/store/slices/agentSlice.ts` now commits local user messages and streamed assistant text into `messages`.
- `src/renderer/store/slices/toolsSlice.ts` continues to own `pendingTools`; ToolPanel now renders that state directly.
- `src/renderer/App.jsx` is a compatibility re-export to `App.tsx`, so old demo shell code is not referenced.
