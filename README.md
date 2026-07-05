# Nexus Agent

Nexus Agent 是一个基于 Electron 的桌面 AI Coding Agent 客户端。它让开发者用项目内的 `AGENTS.md`、`CLAUDE.md` 和 `SKILL.md` 定义本地 AI 工作流，并在授权后真实读写文件、执行命令、查看工具调用和恢复对话历史。

当前实现目录是 [`nexus-agent/`](nexus-agent/)。顶层目录保留产品规格、设计约束和分阶段开发计划。

## 当前状态

| 项目 | 状态 | 证据 |
| --- | --- | --- |
| v0.1 MVP | Phase 0-14 已完成并有验收记录 | [`DEV-PLAN.md`](DEV-PLAN.md), [`nexus-agent/docs/PHASE14-VERIFICATION.md`](nexus-agent/docs/PHASE14-VERIFICATION.md) |
| 本地 Electron UI smoke | 已通过 | 添加项目、发送消息、重启恢复历史、只读 skill 拒绝写入、始终允许落 SQLite |
| macOS DMG 打包 | 已通过 | `npm run build:mac` 产出 `out/Nexus Agent-0.1.0.dmg` |
| 干净 Sonoma 14.x 安装验收 | 未执行 | 当前开发机不是干净 macOS Sonoma 14.x |
| v1.0 P0 增量 | 计划中 | Phase 15-21: cost/cache/retry/stuck/updater/vitest/release closeout |

## 能力概览

```text
React Renderer
  - ChatPanel / CommandInput / ToolPanel / PermissionPrompt / Settings
  - Zustand store 管理项目、会话、消息、工具调用和设置

Preload Bridge
  - window.nexus 暴露类型化 IPC API
  - renderer 不直接访问 Electron ipcRenderer

Electron Main
  - SQLite DAO: projects / sessions / messages / permissions / settings
  - Prompt loader: CLAUDE.md / AGENTS.md / .claude/skills / built-in skills
  - Anthropic SDK stream + tool loop
  - Tool dispatcher: read_file / write_file / list_dir / search_files / exec
  - Permission gate + path guard
  - PTY terminal, tray, notification, global shortcut, multi-window
```

### 当前已接入的工具

| Tool | 用途 | 安全边界 |
| --- | --- | --- |
| `read_file` | 读取项目内 UTF-8 文本文件 | 必须位于当前项目根内 |
| `write_file` | 写入项目内 UTF-8 文本文件 | 需要 PermissionPrompt 授权 |
| `list_dir` | 列出项目内目录 | 必须位于当前项目根内 |
| `search_files` | 搜索项目内文件名和 UTF-8 内容 | 跳过 `.git`、`node_modules`、`dist` 等目录 |
| `exec` | 通过 `node-pty` 在项目内跑命令 | 需要 PermissionPrompt 授权，危险命令禁止始终允许 |

消息以 `!` 开头时会走 shell 快捷路径，例如 `!npm test`，底层仍通过 `exec` 工具和权限规则执行。

## 仓库结构

```text
.
├── Product-Spec.md                 # 产品范围、用户流程、验收标准事实源
├── Product-Spec-CHANGELOG.md       # 需求变更记录
├── Design-Brief.md                 # 视觉和交互设计约束
├── DEV-PLAN.md                     # Phase 0-21 开发计划和当前进度
├── react-vite/                     # 原始 UI 参考实现
├── nexus-agent/                    # Electron 桌面应用实现
│   ├── src/main/                   # Electron main process, IPC, DB, agent, tools
│   ├── src/preload/                # window.nexus bridge
│   ├── src/renderer/               # React + Zustand renderer
│   ├── src/shared/                 # main/preload/renderer 共享类型
│   ├── resources/builtin-skills/   # 内置 goal workflow 相关 skills
│   ├── scripts/                    # phase smoke、lint、打包脚本
│   ├── docs/                       # Phase 验收记录和 MVP 手测脚本
│   └── electron-builder.yml        # macOS DMG 打包配置
└── tasks/                          # 临时任务记录
```

## 快速启动

前置要求：

| 依赖 | 说明 |
| --- | --- |
| macOS | 当前优先支持 macOS，Phase 14 在 arm64 环境验证 |
| Node.js 20+ | `@types/node` 和 Electron native rebuild 以 Node 20 为基线 |
| npm | 当前仓库有 `package-lock.json`，Phase 14 验收命令使用 npm |
| Xcode Command Line Tools | native modules `better-sqlite3`、`node-pty` rebuild 可能需要 |

安装和启动：

```bash
cd nexus-agent
npm install
npm run electron:dev
```

首次使用：

1. 打开 Settings，配置 Anthropic API key。
2. 点击「添加项目」，选择一个本地项目目录。
3. 如果项目内有 `CLAUDE.md`、`AGENTS.md` 或 `.claude/skills/<name>/SKILL.md`，Nexus Agent 会自动加载。
4. 在输入框发消息，或用 `!npm test` 这类 shell 快捷命令。
5. 遇到写文件或执行命令时，在 PermissionPrompt 中选择拒绝、允许一次或始终允许。

## 常用命令

所有命令默认在 `nexus-agent/` 目录执行。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 只启动 Vite renderer |
| `npm run electron:dev` | 启动 Vite + Electron 开发模式 |
| `npm run build` | 构建 renderer |
| `npm run build:main` | 编译 main/preload 到 `dist-main/` |
| `npm run electron:build` | 构建 renderer + main/preload |
| `npm run tsc:check` | main + renderer TypeScript 类型检查 |
| `npm run lint` | 检查 `debugger`、残留 `DEMO_*`、硬编码 secret-like key |
| `npm test` | 当前等价于 `npm run lint && npm run tsc:check` |
| `npm run electron:package` | electron-builder 目录包 |
| `npm run build:mac` | 构建 macOS DMG |
| `npm run rebuild:native` | 重建 `better-sqlite3` 和 `node-pty` native modules |

## 验收和 smoke

Phase 14 最新验收入口：

```bash
cd nexus-agent
npm run tsc:check
npm run electron:build
node scripts/phase14-ui-smoke.cjs
node scripts/phase14-mvp-smoke.cjs
node scripts/phase14-package-check.cjs
```

打包验收：

```bash
cd nexus-agent
npm run build:mac
node scripts/phase14-package-check.cjs
```

完整 MVP 验收说明见 [`nexus-agent/docs/MVP_TEST.md`](nexus-agent/docs/MVP_TEST.md)。历史 Phase 记录在 [`nexus-agent/docs/`](nexus-agent/docs/) 下，命名为 `PHASE*-VERIFICATION.md`。

### Smoke 隔离变量

测试脚本会使用临时目录隔离生产数据，关键变量包括：

| 变量 | 用途 |
| --- | --- |
| `NEXUS_SMOKE_USER_DATA` | 覆盖 Electron `userData` |
| `NEXUS_DB_PATH` | 覆盖 SQLite DB 路径 |
| `NEXUS_CLAUDE_HOME` | 覆盖全局 `.claude` home |
| `NEXUS_ANTHROPIC_BASE_URL` | 指向本地 mock Anthropic SSE |
| `NEXUS_SMOKE_HIDE_WINDOW` | smoke 时隐藏 Electron 窗口 |

说明：部分早期 smoke 脚本仍会设置 `NEXUS_PERMISSIONS_PATH`，但当前实现的 `always-allow` 规则已经随 `permissions` 表落入 SQLite，隔离依赖 `NEXUS_DB_PATH`。

## 本地数据位置

生产运行默认写入：

```text
~/Library/Application Support/Nexus/
├── nexus.db
├── logs/main.log
└── skills/builtin/
```

说明：

| 数据 | 存储方式 |
| --- | --- |
| 项目、会话、消息、权限、设置 | SQLite: `nexus.db` |
| Anthropic API key | Electron `safeStorage` 加密后写入 `settings` |
| 内置 skills | 首次启动复制到 `skills/builtin/` |
| 日志 | `logs/main.log` |

卸载应用本体后，可以手动删除 `~/Library/Application Support/Nexus` 清理用户数据。

## 安全边界

| 边界 | 当前实现 |
| --- | --- |
| Renderer 隔离 | `contextIsolation: true`，`nodeIntegration: false` |
| IPC 暴露面 | 只通过 `window.nexus` 暴露显式 API |
| 项目路径 | `pathGuard` 使用 realpath 和相对路径校验，禁止越出项目根 |
| 写文件/执行命令 | 经过 PermissionPrompt |
| 危险命令 | `git push`、`rm -rf`、`sudo`、`git reset --hard`、`chmod 777`、`npm publish` 等禁止始终允许 |
| Skill 限权 | 当前 active skill 的 `allowed-tools` 会过滤可用工具 |
| 测试隔离 | smoke 使用临时 DB、userData、Claude home 和 mock API |

## 打包与发布边界

Phase 14 已完成本地 DMG 打包：

```bash
cd nexus-agent
npm run build:mac
```

已配置：

| 项 | 当前值 |
| --- | --- |
| `appId` | `com.nexus.agent` |
| `productName` | `Nexus Agent` |
| mac target | `dmg`, `arm64` |
| output | `nexus-agent/out/` |
| native unpack | `better-sqlite3`、`node-pty`、`*.node`、`*.dylib` |

未完成：

| 项 | 状态 |
| --- | --- |
| Apple Developer ID 签名 | 未配置 |
| 公证 notarization | 未执行 |
| GitHub Releases 上传 | 未执行 |
| clean macOS Sonoma 14.x 安装验收 | 未执行 |

## 后续路线

`DEV-PLAN.md` 中 Phase 15-21 是 v1.0 追加范围：

| Phase | 目标 |
| --- | --- |
| 15 | `messages` 表成本列、cost 估算、ToolPanel Session cost |
| 16 | cache read/write/hit% 显示 |
| 17 | 5xx / 529 / 408 指数退避重试 |
| 18 | Agent 卡死检测、`⌘⇧T` / `⌘⇧L` 快捷键 |
| 19 | `electron-updater` 自动更新 |
| 20 | Vitest 接入，safeStorage / pathGuard / dangerous / cost 单测 |
| 21 | v1.0 全量回归、DMG、Sonoma 手测文档 |

## 文档入口

| 文档 | 用途 |
| --- | --- |
| [`Product-Spec.md`](Product-Spec.md) | 产品事实源和验收标准 |
| [`Product-Spec-CHANGELOG.md`](Product-Spec-CHANGELOG.md) | 需求变更记录 |
| [`Design-Brief.md`](Design-Brief.md) | UI/视觉设计约束 |
| [`DEV-PLAN.md`](DEV-PLAN.md) | Phase 进度、交付物、后续路线 |
| [`nexus-agent/docs/MVP_TEST.md`](nexus-agent/docs/MVP_TEST.md) | MVP 自动 smoke 和手测脚本 |
| [`nexus-agent/docs/PHASE14-VERIFICATION.md`](nexus-agent/docs/PHASE14-VERIFICATION.md) | 最新 Phase 14 验收证据 |
