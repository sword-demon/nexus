# Phase 6 — Verification Notes

Verified at: 2026-07-04 00:51:19 CST

## Scope

Phase 6 only: Anthropic SDK client, streaming event bridge, prompt caching system prompt blocks, typed Phase 6 tool schema, structured API errors, and isolated smoke coverage.

Out of scope: Phase 7 agent loop, tool dispatch/execution, real file or shell tools, and Phase 8 UI migration.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| `@anthropic-ai/sdk` added | `npm ls @anthropic-ai/sdk --depth=0` shows `@anthropic-ai/sdk@0.30.1`; package spec is `^0.30.1` | PASS |
| Main process client lazy-loads after API key exists | `missing-key` smoke returns `errorCodes:["api_key_missing"]`; no client request is made without a key | PASS |
| `sendMessage` returns `turnId`, stream events use `agent:event` | Smoke receives `turnId` plus `status` events for every turn; error paths arrive via renderer `onAgentEvent` | PASS |
| SDK streaming is wired through main process | `mock-stream` smoke receives `eventTypes:["status","status","text_delta","end_turn"]` with `textDeltaCount:1` | PASS |
| Prompt context is placed in system prompt with cache breakpoint | `buildSystemPrompt()` emits `CLAUDE.md`, `AGENTS.md`, and skills as system text blocks; final block has `cache_control:{type:"ephemeral"}` | PASS |
| Typed tool definitions exist, but no execution yet | `PHASE6_TOOLS` defines `write_file` schema only; no executor or loop is implemented | PASS |
| 401 / 5xx / network errors become structured events | Phase 6 smoke asserts `auth`, `server`, and `network` error events and matching API log entries | PASS |
| API logs include model/token/error metadata without key | `mock-stream` log has `inputTokens:2048`, `outputTokens:2`, `cacheCreationInputTokens:1024`, `cacheReadInputTokens:0`, `firstTokenMs:9`; error paths log `errorCode` and status where present | PASS |
| Real Anthropic prompt cache behavior | Not executed: no `ANTHROPIC_API_KEY` in this environment | NOT RUN |

## Commands Run

```text
npm install @anthropic-ai/sdk@^0.30.0
added 14 packages
11 vulnerabilities
```

The vulnerabilities are recorded only; dependency remediation is outside Phase 6.

```text
npm ls @anthropic-ai/sdk --depth=0
nexus-agent@0.1.0 /Volumes/MOVESPEED/ai-coding/nexus/nexus-agent
└── @anthropic-ai/sdk@0.30.1
```

```text
npm run tsc:check
> npm run tsc:main && npm run tsc:renderer
> tsc --noEmit -p tsconfig.main.json
> tsc --noEmit -p tsconfig.renderer.json
```

```text
npm run electron:build
vite v5.4.21 building for production...
✓ 1628 modules transformed.
✓ built in 2.20s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

```text
node scripts/phase6-smoke.cjs
PHASE6_SMOKE_RESULT {
  "missingKey": {"errorCodes":["api_key_missing"]},
  "mockStream": {"eventTypes":["status","status","text_delta","end_turn"],"textDeltaCount":1,"endTurnCount":1,"mockRequests":1},
  "mock401": {"errorCodes":["auth"],"mockRequests":1},
  "mock500": {"errorCodes":["server"],"mockRequests":1},
  "network": {"errorCodes":["network"]},
  "real": {"skipped":true,"reason":"ANTHROPIC_API_KEY not set"}
}
```

## Smoke Isolation

```text
tempDir/
  home/                         # NEXUS_CLAUDE_HOME for global prompt context
  project/
    CLAUDE.md                   # >1024-token-sized fixture text
    AGENTS.md
  missing-key.db                # NEXUS_DB_PATH
  mock-401.db
  mock-stream.db
  mock-500.db
  network.db
  *-userData/                   # Electron app.setPath("userData")
```

The smoke writes mock and optional real API keys only into temp SQLite DBs through the Phase 4 safeStorage IPC path. It does not write the real Nexus DB or the real Claude home.

## Code Notes

- `src/main/agent/client.ts` reads the API key only via Phase 4 `getApiKey()` and fingerprints it for client reuse; the key is not sent to renderer or logs.
- `src/main/agent/stream.ts` maps Anthropic stream chunks into existing `AgentEvent` shapes and centralizes API error mapping.
- `scripts/phase6-smoke.cjs` uses async child process spawning so the mock HTTP server can serve Electron child requests while the smoke waits.
- Real Anthropic smoke remains pending until a disposable `ANTHROPIC_API_KEY` is provided.
