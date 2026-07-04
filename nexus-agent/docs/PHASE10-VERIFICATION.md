# Phase 10 — Verification Notes

Verified at: 2026-07-04 12:35 CST

## Scope

Phase 10 only: PermissionPrompt authorization for `write_file` and `exec`, dangerous command handling, exact always-allow rules, and rejected tool results.

Out of scope: xterm terminal embedding, Monaco DiffViewer, and Phase 11 terminal streaming.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Phase 9 base remains valid | `docs/PHASE9-VERIFICATION.md` exists and `node scripts/phase9-smoke.cjs` passed after PermissionPrompt wiring | PASS |
| `write_file` and `exec` ask permission before execution | `src/main/agent/dispatcher.ts` calls `requestPermission` only for `write_file` and `exec`; Phase 10 smoke saw 4 permission prompts for 5 tool calls because the repeated exact `pnpm test` command hit the rule | PASS |
| Read/list/search do not show PermissionPrompt | Phase 9 smoke still completed `read_file`, `list_dir`, and `search_files` without permission requests; only `write_file` and `exec` emitted `permission_request` events | PASS |
| PermissionPrompt has three decisions | `PermissionPrompt.tsx` renders `拒绝`, `允许一次`, and `始终允许` when `canAlwaysAllow !== false`; `App.tsx` sends `deny`, `allow-once`, or `always-allow` through IPC | PASS |
| Esc rejects the prompt | Phase 10 smoke dispatched Escape for `write_file generated/esc.txt`; tool result was `rejected` and `generated/esc.txt` was not created | PASS |
| Allow once does not write a rule | Phase 10 smoke allowed `write_file generated/once.txt` once; file content was `once`; permission rules contained no `write_file` rule | PASS |
| Always allow is exact | Phase 10 smoke clicked `始终允许` for `pnpm test`; repeated `pnpm test` did not prompt again; rules file contained exactly one rule with `toolName:"exec"` and `pattern:"pnpm test"` | PASS |
| Dangerous command has no always-allow | Phase 10 smoke called `git push -u origin main`; prompt text omitted `始终允许`; the tool returned `rejected` | PASS |
| Rejected tool result reaches model and ToolPanel | Phase 10 smoke saw `toolErrors:["rejected","rejected"]`, mock server received all 5 `tool_result` continuations, and ToolPanel text contained `已拒绝` plus `rejected` | PASS |
| Rules storage path is isolated in tests | Default store path is `~/.nexus/permissions.json`; smoke overrides it with `NEXUS_PERMISSIONS_PATH=/tmp/.../permissions.json` | PASS |
| No Phase 11 scope entered | No xterm/Monaco dependencies were added; existing DiffViewer remains untouched for Phase 11 | PASS |

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
✓ built in 1.17s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

```text
node scripts/phase9-pathguard-smoke.cjs
PHASE9_PATHGUARD_SMOKE_RESULT {"parentEscape":"OUT_OF_BOUNDS","writeSymlinkEscape":"OUT_OF_BOUNDS"}
```

```text
node scripts/phase9-smoke.cjs
PHASE9_SMOKE_RESULT {
  "ui": {
    "toolUseNames": ["read_file","read_file","list_dir","search_files","write_file","exec"],
    "toolUseCount": 6,
    "toolResultCount": 6,
    "toolErrors": ["OUT_OF_BOUNDS: Path is outside project root: /private/etc/passwd"]
  },
  "file": "created by phase9",
  "mock": {"requests":7,"bodiesContainToolResults":6}
}
```

```text
node scripts/phase10-smoke.cjs
PHASE10_SMOKE_RESULT {
  "ui": {
    "toolUseNames": ["write_file","exec","exec","exec","write_file"],
    "toolUseCount": 5,
    "toolResultCount": 5,
    "toolErrors": ["rejected","rejected"],
    "permissionSnapshots": [
      {"toolName":"write_file","hasAlways":true},
      {"toolName":"exec","input":{"command":"pnpm","args":["test"]},"hasAlways":true},
      {"toolName":"exec","input":{"command":"git","args":["push","-u","origin","main"]},"hasAlways":false},
      {"toolName":"write_file","input":{"path":"generated/esc.txt"},"hasAlways":true}
    ],
    "toolText": "...pnpm test...已拒绝...rejected..."
  },
  "files": {"once":"once","escExists":false},
  "rules": {"rules":[{"toolName":"exec","pattern":"pnpm test"}]},
  "mock": {"requests":6,"bodiesContainToolResults":5}
}
```

## Code Notes

- `src/main/security/permissions.ts` is the request/wait/respond flow.
- `src/main/security/dangerous.ts` keeps the Phase 10 blacklist small and explicit.
- `src/main/security/permissionMatch.ts` stores exact rules as JSON at `~/.nexus/permissions.json` by default; `NEXUS_PERMISSIONS_PATH` overrides it for tests.
- `write_file` and `exec` still use Phase 9 `pathGuard`; PermissionPrompt is an additional gate, not a path validation replacement.
- Smoke tests use temporary DB, Electron `userData`, project root, Claude home, API key, Anthropic SSE server, and permission rule file.
