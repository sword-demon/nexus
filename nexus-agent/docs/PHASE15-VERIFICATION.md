# Phase 15 — Verification Notes

Verified at: 2026-07-05 03:55 CST

## Scope

Phase 15 only: v1.0 cost tracking — `messages` table 5 new columns,
`autoUpdateEnabled` setting seed, `agent/cost.ts` compute + `MODEL_PRICING`,
`agentSlice.sessionCostUsd`, ToolPanel pinned cost row, ChatPanel
assistant bubble cost detail, and `phase15-cost-smoke` isolation.

Out of scope: cache hit % per tool row (Phase 16), retry backoff (Phase 17),
stuck detection + shortcuts (Phase 18), electron-updater (Phase 19),
vitest 4-class unit suite (Phase 20). Those land in later phases.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| `messages` gets 5 new columns | `db/migrations/002_cost_tracking.sql.ts` adds `input_tokens` / `output_tokens` / `cache_creation_tokens` / `cache_read_tokens` / `cost_usd` via `PRAGMA table_info` + `ALTER TABLE ADD COLUMN`; v0.1 rows keep NULL | PASS (code review) |
| Migration is idempotent on re-open | `addColumnIfMissing` short-circuits via `PRAGMA table_info`; `autoUpdateEnabled` seed uses `ON CONFLICT DO NOTHING` | PASS (code review) |
| `settings.autoUpdateEnabled` defaults to `true` | Migration 002 seeds `INSERT … ON CONFLICT DO NOTHING 'autoUpdateEnabled'='true'` | PASS (code review) |
| `agent/cost.ts` implements SPEC §11.6 formula | `computeCost(model, usage, now?)` returns `(input*model.input + output*model.output + cacheCreate*model.cacheWrite5m + cacheRead*model.cacheRead) / 1_000_000`, rounded to 6 decimals | PASS (6/6 unit cases) |
| `MODEL_PRICING` covers the SPEC §11.6 table | 6 rows incl. `claude-3-5-sonnet-20241022`, `claude-sonnet-4-6`, `claude-sonnet-5`, `claude-haiku-4-5`, `claude-opus-4-8`, `claude-fable-5` | PASS (unit) |
| Sonnet 5 promo price (output $2/MTok before 2026-09-01) | `priceForSonnet5Output` branches on `now < SONNET_5_PROMO_END`; today (2026-07-05) is before the cutoff so promo applies | PASS (unit boundary test) |
| Assistant message writes 5 cost columns | `ipc.ts runStreamingTurn` passes `usage` through `computeCost` and forwards as `cost: { … }` to `appendMessage`; DAO INSERT writes 5 columns in the same transaction as the row insert | PASS (code review) |
| `agentSlice.sessionCostUsd` updates on new assistant messages | `appendMessage` increments `state.sessionCostUsd + costOf(message)`; `setMessages` recomputes via `sumAssistantCost`; `resetAgentSession` zeroes it | PASS (code review) |
| ToolPanel shows live `Session · USD` row | `data-od-id="session-cost"` row pinned between header and progress bar; `formatUsd` returns `$0.000` when `value <= 0`; selector `s.sessionCostUsd` is reactive | PASS (code review) |
| ChatPanel assistant bubble expands 5-field detail | `MessageBubble` reads `message.costUsd`; toggle button + 4-row `input/output/cache write/cache read` grid gated on `hasUsage` and `costOpen` | PASS (code review) |
| TypeScript strict, no `any` | `tsc:check` exit 0 on main + renderer | PASS (tsc:check) |
| Renderer + main builds cleanly | `npm run electron:build` exit 0; dist + dist-main regenerated; only the existing Monaco chunk size warning (pre-existing) | PASS (electron:build) |
| Full Electron BrowserWindow smoke (renderer UI + mock SSE) | `scripts/phase15-cost-smoke.cjs` is implemented and matches Phase 14 mvp smoke pattern; **not run on the current dev shell** because the sandbox blocks loopback listen (same blocker that prevents Phase 14 mvp smoke on this host) | NOT RUN (sandbox) |
| DAO + migration smoke (`scripts/phase15-cost-unit.cjs`) | 6 cost cases PASS; 3 DB cases FAIL on `NODE_MODULE_VERSION 140` vs `127` because the dev shell's Node 22 cannot load the Electron-rebuilt `better-sqlite3.node` and sandbox blocks `npm rebuild` (no `~/.npm` write). Cost-only branch of the same script PASSES against the compiled `dist-main/main/agent/cost.js`. | PARTIAL (cost PASS, DB blocked by sandbox) |

## Commands Run

```text
npm run tsc:check
> tsc --noEmit -p tsconfig.main.json
> tsc --noEmit -p tsconfig.renderer.json
exit 0
```

```text
npm run electron:build
> vite v5.4.21 building for production...
> ✓ 1632 modules transformed.
> ✓ built in 6.54s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
exit 0
```

```text
node scripts/phase15-cost-unit.cjs
PHASE15_UNIT_RESULT {
  "total": 9,
  "failures": 3,
  "report": [
    {"name": "computeCost matches SPEC §11.6 for Sonnet 4.6", "status": "PASS"},
    {"name": "computeCost handles cache_read-only usage", "status": "PASS"},
    {"name": "computeCost null cache buckets default to 0", "status": "PASS"},
    {"name": "computeCost returns null for unknown model", "status": "PASS"},
    {"name": "Sonnet 5 output uses promo price before 2026-09-01", "status": "PASS"},
    {"name": "MODEL_PRICING covers every SPEC §11.6 row", "status": "PASS"},
    {"name": "migration 002 adds 5 columns + seeds autoUpdateEnabled", "status": "FAIL", "error": "NODE_MODULE_VERSION 140 vs 127 (sandbox)"},
    {"name": "migration 002 is idempotent on second pass", "status": "FAIL", "error": "NODE_MODULE_VERSION 140 vs 127 (sandbox)"},
    {"name": "messages DAO round-trips 5 cost fields through SQLite", "status": "FAIL", "error": "NODE_MODULE_VERSION 140 vs 127 (sandbox)"}
  ]
}
```

## Environment Constraints (recorded honestly)

1. **Loopback listen blocked.** The current Claude Code sandbox disallows
   `server.listen('127.0.0.1', …)` from any process, so neither
   `phase14-mvp-smoke.cjs` nor `phase15-cost-smoke.cjs` can run their
   mock Anthropic SSE server on this host. Both scripts are in place and
   follow the pattern that succeeded on the dev machine used for
   `PHASE14-VERIFICATION.md`.

2. **better-sqlite3 ABI mismatch.** The prebuilt native binding in
   `node_modules/better-sqlite3/build/Release/better_sqlite3.node` is
   Electron 39 (NODE_MODULE_VERSION 140). The host Node 22 is 127, and
   `npm rebuild better-sqlite3` cannot run because the sandbox denies
   writes to `~/.npm`. The DAO / migration assertions therefore had to
   be replaced with code-review evidence on this machine.

## Files Touched

- `src/main/db/migrations/002_cost_tracking.sql.ts` (new)
- `src/main/db/index.ts` (register migration 002)
- `src/main/db/dao/messages.ts` (5 columns read/write + `updateMessageCost`)
- `src/main/agent/cost.ts` (new — `computeCost`, `MODEL_PRICING`)
- `src/main/ipc.ts` (forward `cost` to `appendMessage` after stream)
- `src/shared/types/ipc.ts` (`MessageDto` 5 nullable cost fields)
- `src/renderer/store/slices/agentSlice.ts` (`sessionCostUsd`,
  5-field defaults on locally-constructed messages)
- `src/renderer/components/ToolPanel.tsx` (pinned `Session · USD` row +
  `formatUsd` helper)
- `src/renderer/components/ChatPanel.tsx` (assistant bubble cost toggle
  + 4-row detail grid)
- `scripts/phase15-cost-smoke.cjs` (new — full Electron smoke; not run here)
- `scripts/phase15-cost-unit.cjs` (new — pure Node verification)