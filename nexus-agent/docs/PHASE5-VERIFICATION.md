# Phase 5 — Verification Notes

Verified at: 2026-07-03 23:50:27 CST

## Scope

Phase 5 only: `CLAUDE.md` / `AGENTS.md` / `SKILL.md` filesystem loader, `loadContext` IPC, renderer store hydration, and ToolPanel skill/error display.

The smoke script creates a temp `HOME`, temp project, temp DB, and temp Electron `userData`; it does not read or modify the real `~/.claude`.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Project `CLAUDE.md` + `.claude/skills/refactor/SKILL.md` loads and ToolPanel lists `refactor` | `node scripts/phase5-smoke.cjs`: `claudeLoaded:true`, `refactorListed:true`, `toolPanelTextFound:true` | PASS |
| SKILL.md missing `description` does not enter prompt, app does not crash, error is recorded | Smoke: `invalidInSkills:false`, `loadErrorCount:1`, `invalidErrorRecorded:true` | PASS |
| Global `test` skill and project `test` skill collision resolves to project | Smoke: `skillNames:["refactor:project","test:project"]`, `projectOverridesGlobal:true` | PASS |

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
✓ 1628 modules transformed.
✓ built in 1.22s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

```text
node scripts/phase5-smoke.cjs
PHASE5_SMOKE_RESULT {"directStatus":"ok","claudeLoaded":true,"agentsLoaded":true,"skillNames":["refactor:project","test:project"],"refactorListed":true,"projectOverridesGlobal":true,"invalidInSkills":false,"loadErrorCount":1,"invalidErrorRecorded":true,"toolPanelTextFound":true}
```

## Fixture Shape

```text
temp HOME/
  .claude/CLAUDE.md
  .claude/AGENTS.md
  .claude/skills/test/SKILL.md

temp project/
  CLAUDE.md
  AGENTS.md
  .claude/skills/refactor/SKILL.md
  .claude/skills/test/SKILL.md
  .claude/skills/broken/SKILL.md  # missing description
```

## Code Notes

- `src/main/skills/loader.ts` now records invalid skills in `loadErrors` and excludes them from `PromptContext.skills`.
- `src/renderer/App.tsx` hydrates persisted projects on startup so context can load for the active project, not only the home fallback.
- `src/renderer/store/slices/contextSlice.ts` returns stable empty arrays and avoids a React render loop in ToolPanel.
