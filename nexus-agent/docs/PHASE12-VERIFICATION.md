# Phase 12 — Verification Notes

Verified at: 2026-07-04 19:31 CST

## Scope

Phase 12 only: builtin Goal workflow skills, first-run non-overwriting install into Electron `userData`, loader discovery of builtin skills, and isolated smoke coverage.

Out of scope: Phase 13 system tray, multi-window/tab, notification, global shortcut, Phase 14 packaging, release, and production API calls.

## Acceptance Matrix

| DEV-PLAN acceptance | Evidence | Result |
| --- | --- | --- |
| 6 core sub-skills are built in | `resources/builtin-skills/` contains `prd`, `prd-to-spec`, `to-issues`, `goal`, `review-it`, and `ship-it` with valid `SKILL.md` frontmatter | PASS |
| 3 bonus sub-skills are built in | `resources/builtin-skills/` contains `refactor`, `note-it`, and `code-to-spec` | PASS |
| Boot skill is available | `resources/builtin-skills/goal-workflow/SKILL.md` has `description: goal 六步法驱动 PR` and references `/prd`, `/prd-to-spec`, `/to-issues`, `/goal`, `/review-it`, `/ship-it` | PASS |
| First startup installs builtin skills | `installBuiltinSkills()` copies resources to `app.getPath('userData')/skills/builtin` | PASS |
| Repeated startup does not overwrite user files | `phase12-smoke` appends `USER_MUTATION_PHASE12` to installed `prd/SKILL.md`, reruns install, and sees `overwritePreserved:true` with `secondCopied:0` | PASS |
| Loader sees builtin skills | `resolveContextPaths()` includes `builtinSkillsDir`; `loadPromptContext()` returns builtin skills with `scope:"builtin"` | PASS |
| Project skill overrides builtin skill | `phase12-smoke` creates project `.claude/skills/prd/SKILL.md`; loader returns `prd:project` and builtin `prd` does not win | PASS |
| `ship-it` does not grant push | `ship-it` `allowed-tools` line is `[read_file, list_dir, search_files, exec]`; `phase12-smoke` reports `shipPushInAllowedTools:false` and `shipProhibitsPush:true` | PASS |
| Existing loader behavior remains valid | `node scripts/phase5-smoke.cjs` still passes project/global override and invalid skill handling | PASS |
| Phase 11 terminal/diff remains valid | `node scripts/phase11-smoke.cjs` still passes xterm, Monaco, fullscreen, and PTY trust boundary checks | PASS |

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
✓ built in 7.89s
> tsc -p tsconfig.main.json && node scripts/write-main-package.cjs
```

Note: Vite still reports the existing Monaco large chunk warning. Build exits 0.

```text
node scripts/phase5-smoke.cjs
PHASE5_SMOKE_RESULT {
  "directStatus": "ok",
  "refactorListed": true,
  "projectOverridesGlobal": true,
  "invalidInSkills": false,
  "invalidErrorRecorded": true,
  "toolPanelTextFound": true
}
```

```text
node scripts/phase11-smoke.cjs
PHASE11_SMOKE_RESULT {
  "ui": {
    "terminalHasRed": true,
    "interactive": {"terminalHasInteractive": true},
    "hasMonacoEditor": true,
    "fullscreenOpened": true,
    "fullscreenClosed": true
  },
  "trust": {"status": "error", "error": "Project is not trusted: /"}
}
```

```text
node scripts/phase12-smoke.cjs
PHASE12_SMOKE_RESULT {
  "install": {"firstCopied":10,"firstSkipped":0,"secondCopied":0,"secondSkipped":10},
  "overwritePreserved": true,
  "expectedSkillsPresent": true,
  "prdIsProjectOverride": true,
  "workflowDescription": "goal 六步法驱动 PR",
  "workflowReferencesCoreSkills": true,
  "shipPushInAllowedTools": false,
  "shipProhibitsPush": true,
  "loadErrorCount": 0
}
```

```text
rg -n "git push|push.*main" "resources/builtin-skills/ship-it/SKILL.md"
17:禁止执行 `git push`。禁止 push 到 main/master。需要发布或推送时先让用户确认。
```

## Code Notes

- Builtin install is non-destructive: existing target files are skipped.
- No new dependency was added; copy/install uses Node `fs` and Electron `app.getPath('userData')`.
- Skill precedence is now `project > global > builtin`.
- `ship-it` can run local checks, but push remains an explicit prohibition and still falls through existing dangerous command permission handling if attempted.
