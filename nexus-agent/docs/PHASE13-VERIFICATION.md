# Phase 13 — Verification Notes

Verified at: 2026-07-04 20:45 CST

## Scope

Phase 13 only: multi-window registry, project tab to main-process working directory, app menu, tray state, notification wrapper, global shortcut, Settings shortcut controls, and an isolated Electron smoke script.

Out of scope: release packaging, publishing, installer output, and production API calls.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| Project tab switches main working directory | `Sidebar` project rows are buttons; `App` updates `currentProjectId`, then calls `window.nexus.switchProject({ projectPath })`; main resolves with `resolveTrustedProjectRoot()` and stores the path per window | PASS |
| Trusted-root behavior remains intact | `loadContext`, `sendMessage`, and PTY still resolve roots through `resolveTrustedProjectRoot()` / `resolveProjectPath()`; Phase 13 adds no bypass | PASS |
| New window menu creates a second window | `installAppMenu()` registers Chinese menu item `new-window`; `phase13-smoke` clicked it and saw `countAfterMenuNewWindow:2` | PASS |
| Window registry cleans closed windows | `createManagedWindow()` stores BrowserWindow entries and deletes them on `closed`; smoke destroyed the second window and saw `countAfterClose:1` | PASS |
| Tray initializes and changes color | `initializeTray()` creates `Tray`; `updateTrayStatus('executing')` sets status `executing` and color `#f59e0b`; smoke saw `initialized:true` | PASS |
| Notifications stay in main process | `ipc.ts` handles agent `done` / `error` side effects via `notifications.notify()`; renderer has no direct Notification call | PASS |
| Notification wrapper is runnable | `phase13-smoke` forced notification delivery in an isolated Electron process and saw both done/error notifications with `status:"shown"` | PASS |
| Global shortcut focuses input | `initializeGlobalShortcut()` registers `CommandOrControl+Shift+A`; smoke called the same activation handler and saw `focus.active:true` on CommandInput textarea | PASS |
| Shortcut can be rebound | `phase13-smoke` changed the accelerator to `CommandOrControl+Shift+Y` through the preload API and saw `registered:true` | PASS |
| Shortcut registration failure is visible | `getShortcutState()` returns `registered` and `lastError`; if registration fails, `lastError` is populated instead of reporting success | PASS |
| Settings can disable shortcut | Settings General tab uses `getShortcutSettings` / `setShortcutSettings`; smoke toggled the Settings control and saw `enabled:false`, `registered:false` | PASS |
| No new dependency | `package.json` was not changed; implementation uses Electron built-ins and existing IPC/Zustand | PASS |

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
✓ built in 7.57s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

Note: Vite still reports the existing Monaco large chunk warning. Build exits 0.

```text
node scripts/phase13-smoke.cjs
PHASE13_SMOKE_RESULT {
  "projectSwitch": {"snapshot":{"projectPath":".../project-a"}},
  "windows": {"countAfterMenuNewWindow":2,"countAfterClose":1},
  "tray": {"executing":{"initialized":true,"status":"executing","color":"#f59e0b"}},
  "notifications": {"done":{"status":"shown"},"error":{"status":"shown"}},
  "shortcut": {"initial":{"registered":true},"focus":{"active":true},"afterRebind":{"accelerator":"CommandOrControl+Shift+Y","registered":true},"afterDisable":{"enabled":false,"registered":false}},
  "settingsDisable": {"disabled":true}
}
```

```text
node scripts/phase12-smoke.cjs
PHASE12_SMOKE_RESULT {
  "install": {"firstCopied":10,"firstSkipped":0,"secondCopied":0,"secondSkipped":10},
  "overwritePreserved": true,
  "expectedSkillsPresent": true,
  "prdIsProjectOverride": true,
  "workflowReferencesCoreSkills": true,
  "shipPushInAllowedTools": false,
  "shipProhibitsPush": true,
  "loadErrorCount": 0
}
```

```text
scope search for release-related tokens in src, scripts, and this file
exit 1 with no matches
```

## Code Notes

- `src/main/window/manager.ts` is the only window registry; `src/main/window.ts` stays a BrowserWindow factory.
- `src/main/tray/index.ts` keeps the four tray colors inline; no separate icon assets or dependencies were added.
- Shortcut settings are stored as one JSON value in the existing `settings` table.
- Smoke uses temporary `userData`, database, projects, Claude home, and permission file, then removes the temp directory.
