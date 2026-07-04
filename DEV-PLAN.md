# Development Plan — Nexus Agent

> 本文件记录项目的开发阶段划分、当前进度和剩余工作。
> 新 session 启动时应首先阅读此文件，了解项目状态后再继续开发。
>
> **前置阅读**：`Product-Spec.md` v0.1（功能边界）/ `Design-Brief.md` v0.1（视觉契约）

---

## Phase 0 · 准备工作

**交付内容：**
- 在 `nexus/` 下创建 `nexus-agent/` 子目录（与 `react-vite/` 平级）
- 把 `react-vite/` 里现有 UI 组件 copy 一份进 `nexus-agent/src/renderer/components/`（**只搬运，不重写**）
- 重命名为 `.tsx`，最小限度补类型标注（其余类型迁移在 Phase 8）
- 让 `npm run dev` 在 `nexus-agent/` 内仍能跑（沿用 vite + react 18，不引入 TS 编译到这步）

**关键文件：**
- `nexus-agent/package.json` — name=nexus-agent、type=module、scripts: dev / build / preview / electron:dev / electron:build
- `nexus-agent/.gitignore` — 排除 node_modules / dist / out / *.log
- `nexus-agent/src/renderer/components/ChatPanel.jsx` — 从 `react-vite/src/components/ChatPanel.jsx` 复制
- `nexus-agent/src/renderer/components/ToolPanel.jsx` — 复制
- `nexus-agent/src/renderer/components/CommandInput.jsx` — 复制
- `nexus-agent/src/renderer/components/PermissionPrompt.jsx` — 复制
- `nexus-agent/src/renderer/components/SettingsModal.jsx` — 复制
- `nexus-agent/src/renderer/components/StatusIndicator.jsx` — 复制
- `nexus-agent/src/renderer/components/DiffViewer.jsx` — 复制
- `nexus-agent/src/renderer/styles.css` — 从 `react-vite/src/styles.css` 复制
- `nexus-agent/src/renderer/main.jsx` — 从 `react-vite/src/main.jsx` 复制
- `nexus-agent/index.html` — 沿用 react-vite 的，预渲染 `<main>` 占位保留

**验收标准：**
- `cd nexus-agent && npm install && npm run dev` 启动后浏览器/electron 窗口出现，UI 与 react-vite 完全一致
- 现有 7 个组件渲染正常，DEMO_* 常量仍生效（**这步不动数据层**）
- 没有 TS 编译失败（暂不编译）

---

## Phase 1 · Electron 项目骨架

**交付内容：**
- 引入 Electron 主进程入口、preload 脚本、窗口创建逻辑
- TypeScript 全栈编译（main / preload / renderer 三层 tsconfig）
- vite 仅编译 renderer，主进程走 `tsc --project tsconfig.main.json`
- dev 模式：vite 跑 5173（renderer），electron 主进程拉远端 dev URL；prod 模式：vite build → dist，electron 加载 `file://`
- 创建主进程目录结构 `src/main/`：`index.ts` / `window.ts` / `ipc.ts` / `logger.ts`

**关键文件：**
- `nexus-agent/package.json` — 加 deps：`electron@^39.0.0`、`@electron/rebuild@^4.0.0`、`typescript@^5.5.0`、`vite@^5.4.0`；加 scripts：`electron:dev` / `electron:build`
- `nexus-agent/tsconfig.json` — 项目根 TS 配置（paths: "@/*": ["src/*"]）
- `nexus-agent/tsconfig.main.json` — 主进程 TS 配置（target: node, module: commonjs）
- `nexus-agent/tsconfig.renderer.json` — renderer TS 配置（target: esnext, jsx: react-jsx）
- `nexus-agent/src/main/index.ts` — Electron 入口：`app.whenReady()` → 创建窗口 → 加载 dev server 或 dist/index.html
- `nexus-agent/src/main/window.ts` — `BrowserWindow` 工厂：preload 注入、contextIsolation true、nodeIntegration false
- `nexus-agent/src/main/ipc.ts` — IPC handler 注册桩（空函数先占位，Phase 2 填）
- `nexus-agent/src/main/logger.ts` — 主进程日志（写 `~/Library/Application Support/Nexus/logs/main.log`）
- `nexus-agent/src/preload/index.ts` — `contextBridge.exposeInMainWorld('nexus', { ... })` 桩对象
- `nexus-agent/src/preload/api.ts` — 类型定义 + 空实现，作为 renderer 的 IPC 客户端
- `nexus-agent/vite.config.ts` — base: './'（让 prod 加载相对路径），server.port: 5173
- `nexus-agent/electron.vite.config.ts` — 或 inline 在 package.json：三段式 build 配置

**验收标准：**
- `npm run electron:dev` 启动一个真正的 Electron 窗口，渲染 react-vite/ 现有 UI（**完全不变**）
- 主进程 console 输出 "Nexus Agent v0.1 ready"
- TypeScript 三层编译均无错误（`tsc --noEmit`）
- 打开 DevTools，主进程 / preload / renderer 三端 console 都能写日志
- 主进程关闭时窗口关闭、再次开能恢复（macOS 标准行为）

---

## Phase 2 · IPC Bridge + Zustand Store 雏形

**交付内容：**
- 定义完整的 IPC 契约（types）：`getProjects` / `addProject` / `removeProject` / `sendMessage` / `stopAgent` / `getSessions` 等
- preload 把契约挂在 `window.nexus`
- renderer 侧 Zustand store：`agentStatus` / `currentProject` / `messages` / `pendingTools` / `permissions`
- App.jsx 接 Zustand 替代内嵌 state（DEMO_* 仍生效，不接 IPC）

**关键文件：**
- `nexus-agent/src/shared/types/ipc.ts` — IPC 契约类型（requests / responses / events）
- `nexus-agent/src/preload/index.ts` — 暴露 `window.nexus` 完整 API（先 stub 返回，Phase 3 起填真实现）
- `nexus-agent/src/preload/api.ts` — 类型安全的客户端封装
- `nexus-agent/src/renderer/store/appStore.ts` — Zustand store（`create<AppStore>((set, get) => ({...}))`）
- `nexus-agent/src/renderer/store/slices/agentSlice.ts` — agentStatus / messages / streaming token
- `nexus-agent/src/renderer/store/slices/projectSlice.ts` — projects / currentProject
- `nexus-agent/src/renderer/store/slices/toolsSlice.ts` — pendingTools / permissions
- `nexus-agent/src/renderer/App.tsx` — 接 store，删除原 useState（**保留 DEMO_* 作 fallback**）
- `nexus-agent/src/main/ipc.ts` — 注册 `ipcMain.handle('getProjects', ...)` 等 stub handler

**验收标准：**
- 主进程启动后，能在 renderer DevTools console 写 `await window.nexus.getProjects()` 并返回空数组
- Zustand DevTools 能看到 store state 变更
- `agentStatus` 改 `idle` 时 `StatusIndicator` 颜色变灰（视觉与 SPEC §11.3 对齐）
- App.tsx 编译无 TS error

---

## Phase 3 · SQLite 持久化（better-sqlite3）

**交付内容：**
- 主进程集成 better-sqlite3（同步 API，比 sqlite 简单）
- 5 张表建库：`projects` / `sessions` / `messages` / `permissions` / `settings`
- DAO 层封装 CRUD，所有 sqlite 操作经 DAO，对 renderer 不暴露原始 SQL
- IPC handler 接 DAO，渲染层 `window.nexus.*` 返回真实数据
- electron-rebuild 把 better-sqlite3 重新编译给 Electron 的 Node ABI
- electron-builder config 写 `asarUnpack` + `nativeDependency`

**关键文件：**
- `nexus-agent/package.json` — 加：`better-sqlite3@^11.0.0`、`@types/better-sqlite3@^7.6.0`
- `nexus-agent/src/main/db/index.ts` — sqlite 初始化（`new Database(path)`）+ 迁移函数
- `nexus-agent/src/main/db/migrations/001_init.sql.ts` — 5 张表 + 索引 SQL 字符串
- `nexus-agent/src/main/db/dao/projects.ts` — `createProject` / `listProjects` / `getProject` / `deleteProject`
- `nexus-agent/src/main/db/dao/sessions.ts` — `createSession` / `listSessions` / `deleteSession`
- `nexus-agent/src/main/db/dao/messages.ts` — `appendMessage` / `listMessages` / `deleteMessages`
- `nexus-agent/src/main/db/dao/permissions.ts` — `addPermission` / `listPermissions` / `removePermission`
- `nexus-agent/src/main/db/dao/settings.ts` — `getSetting` / `setSetting`
- `nexus-agent/src/main/db/path.ts` — `~/Library/Application Support/Nexus/nexus.db` 解析
- `nexus-agent/src/main/ipc.ts` — 把 Phase 2 的 stub 替换成 DAO 调用
- `nexus-agent/electron.vite.config.ts` — `nativeDependency: ['better-sqlite3']`
- `nexus-agent/scripts/rebuild.ts` — `npx @electron/rebuild -f -w better-sqlite3`
- `nexus-agent/scripts/postinstall.ts` — 调用 rebuild

**验收标准：**
- 第一次启动自动建库到 `~/Library/Application Support/Nexus/nexus.db`
- 调用 `window.nexus.addProject('/tmp/test')` 返回新项目 → 重启应用 → `getProjects()` 仍有这条记录
- 用 `sqlite3 nexus.db ".schema"` 在终端能看到 5 张表
- `app.asar.unpacked` 内有 `better_sqlite3.node`（验证 asarUnpack）

---

## Phase 4 · safeStorage API key + Settings 接通

**交付内容：**
- 把 Anthropic API key 加密后存 settings 表（明文永不落盘）
- SettingsModal 接通真实 store：API key 输入/显示/重置
- 主进程拿 API key：用 safeStorage 解密 → 注入 Anthropic 客户端
- key 不存在时进入最小模式，不启动 Anget loop

**关键文件：**
- `nexus-agent/src/main/security/safeStorage.ts` — `encryptKey(plain)` / `decryptKey(blob)` 封装
- `nexus-agent/src/main/security/apiKey.ts` — `getApiKey()` / `setApiKey(plain)` / `clearApiKey()`
- `nexus-agent/src/main/db/dao/settings.ts` — 扩展：`setEncryptedApiKey(blob)`
- `nexus-agent/src/main/ipc.ts` — `ipcMain.handle('settings:setApiKey', ...)` / `settings:getApiKeyStatus`
- `nexus-agent/src/renderer/store/slices/settingsSlice.ts` — apiKeyStatus: 'unset' | 'configured'
- `nexus-agent/src/renderer/components/SettingsModal.tsx` — 改成接 store，密码输入框 + 保存按钮
- `nexus-agent/src/renderer/components/SettingsModal.tsx` — 「已配置 / 未配置」徽章

**验收标准：**
- API key 输入后 `nexus.db` 内存的是加密 blob（`sqlite3 nexus.db "select * from settings"` 看不懂）
- 重启应用后状态显「已配置」但明文不回显
- 「重置」按钮：清 blob + 弹二次确认 → 删后状态变「未配置」
- macOS Keychain（DPAPI）能在「钥匙串访问」里看到 Nexus 项

---

## Phase 5 · FS Loader（CLAUDE.md / AGENTS.md / SKILL.md）

**交付内容：**
- 扫描器：项目根 + 用户目录，找 4 类文件，**项目级覆盖全局**
- SKILL.md frontmatter 解析：name / description / when_to_use / allowed-tools
- 内存对象 `PromptContext`：CLAUDE.md + AGENTS.md + 所有 skill 的全文
- IPC handler `agent:loadContext(projectPath)` 返回 PromptContext
- renderer 启动时自动调一次，存 store

**关键文件：**
- `nexus-agent/src/main/skills/loader.ts` — `loadPromptContext(projectPath)` 主入口
- `nexus-agent/src/main/skills/parser.ts` — SKILL.md frontmatter 解析（用 `gray-matter` 或手写正则）
- `nexus-agent/src/main/skills/paths.ts` — 全局 vs 项目级路径优先级
- `nexus-agent/src/main/skills/types.ts` — `Skill` / `PromptContext` 类型定义
- `nexus-agent/src/main/skills/validator.ts` — 校验 frontmatter，缺 name/description 标 red 但不阻断
- `nexus-agent/src/main/skills/errors.ts` — 解析失败仅记 log，不抛
- `nexus-agent/src/main/ipc.ts` — 加 `agent:loadContext` handler
- `nexus-agent/src/renderer/store/slices/contextSlice.ts` — `promptContext` 状态
- `nexus-agent/src/renderer/components/Sidebar/SkillsList.tsx` — ToolPanel 加 skills 列表展示（用现有 ToolPanel 改造）

**验收标准：**
- 在测试项目根写 `CLAUDE.md` + `.claude/skills/refactor/SKILL.md` → 启动 Nexus → ToolPanel 列出「refactor」技能
- SKILL.md 缺 description → 该 skill 不进 prompt，但启动不报错（log 写错误）
- 全局 `~/.claude/skills/test/SKILL.md` 与项目 `.claude/skills/test/SKILL.md` 同名 → 项目级胜出

---

## Phase 6 · Anthropic SDK Client

**交付内容：**
- 主进程封装 Anthropic SDK client（懒加载，等 API key 配置后才实例化）
- 流式调用 + prompt caching（CLAUDE.md / AGENTS.md / Skills 顶部放 system prompt，cache_control: ephemeral）
- 工具集类型化定义（`ToolDef`）
- IPC handler `agent:sendMessage(text)` 开一个 turn，**返回 turnId**（流式 token 通过 `agent:event` event 推送）
- 主进程断网 / 401 / 5xx 错误转译成结构化事件流

**关键文件：**
- `nexus-agent/package.json` — 加 `@anthropic-ai/sdk@^0.30.0`
- `nexus-agent/src/main/agent/client.ts` — `getAnthropicClient()` 单例
- `nexus-agent/src/main/agent/stream.ts` — `streamMessage({ system, messages, tools })` 封装
- `nexus-agent/src/main/agent/types.ts` — `AgentEvent` 联合类型（text_delta / tool_use / tool_result / error / end_turn）
- `nexus-agent/src/main/agent/tools.ts` — 工具定义集合（Phase 9 实装，本 Phase 仅类型）
- `nexus-agent/src/main/agent/cache.ts` — prompt cache breakpoint 计算
- `nexus-agent/src/main/ipc.ts` — `agent:sendMessage` / `agent:stop` / `agent:event` 事件推送
- `nexus-agent/src/main/logger.ts` — 加 `logApiCall({model, inputTokens, outputTokens, cacheHit, error})`

**验收标准：**
- 配置完 API key 后，renderer 调 `sendMessage` 能收到流式 token（即使此时 tool 还没装，模型会返回 text）
- 在 SDK 客户端 → renderer event 流中间插 debug log，能看到 `text_delta` 事件 + 首字延后时长
- prompt caching：CLAUDE.md > 1024 tokens 时第二个 turn 的 usage.input_tokens 出现 `cache_creation_input_tokens` 字段
- 把网络断开 → `error: 'network'` 事件推到 renderer

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE6-VERIFICATION.md`
- 当前环境已通过 typecheck、Electron build、本地 SSE `text_delta`、missing key / 401 / 500 / network smoke；真实 Anthropic prompt cache 行为因缺 `ANTHROPIC_API_KEY` 未执行。

---

## Phase 7 · Agent Loop + 工具分发

**交付内容：**
- 核心 loop：`while (true) { stream → if tool_use → 执行 → 写 tool_result → 继续 }`，直到 `end_turn`
- AgentEvent → renderer IPC 推送
- 状态机：`idle` → `thinking` → `streaming` → `executing`（有 tool）→ 继续 / `done` / `error`
- **本 Phase 不实装工具本身**，只把 tool_use 分发到「工具 stub」返回 mock 结果，让 loop 跑通

**关键文件：**
- `nexus-agent/src/main/agent/loop.ts` — `runTurn(promptContext, messages, signal)` 主循环
- `nexus-agent/src/main/agent/dispatcher.ts` — `dispatchToolCall(toolUse)` 调度器（Phase 9 接真工具）
- `nexus-agent/src/main/agent/state.ts` — agentStatus 转移表 + reducer
- `nexus-agent/src/main/agent/signals.ts` — `AbortController` 包装，Esc / stop 按钮触发 cancel
- `nexus-agent/src/main/ipc.ts` — 加 `agent:status` event 推送
- `nexus-agent/src/main/logger.ts` — 加 loop step log（每步 input/output tokens）

**验收标准：**
- 单 turn：用户问「ping」→ 模型返 text → 状态机 idle/thinking/streaming/done 走完整圈
- 多 turn with stub tool：模型调 `write_file` → dispatcher 返回 mock `tool_result` → 第二轮 stream → end_turn
- Esc / 顶栏停止按钮触发 → stream 立即 abort（验证 `AbortController.aborted`）
- 状态变更通过 `agent:status` event 推到 renderer，Zustand store 同步

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE7-VERIFICATION.md`
- 当前环境已通过 typecheck、Electron build、单 turn、本地 stub tool 多 turn、abort、renderer/Zustand 状态同步 smoke；真实工具执行留到 Phase 9。

---

## Phase 8 · UI 壳子迁移（jsx → tsx + DEMO_* → IPC）

**交付内容：**
- 现有 7 个组件 .jsx → .tsx，补类型（props / state / 事件对象）
- DEMO_CONVERSATIONS / DEMO_MESSAGES / DEMO_TOOLS / DEMO_FILES / CONTEXT_FILES 全删，换 Zustand store 真实数据
- Zustand store 子 connect 到每个组件
- IPC event 订阅 hook：`useAgentEvent('text_delta')` / `useAgentEvent('tool_use')`

**关键文件：**
- `nexus-agent/src/renderer/components/ChatPanel.tsx` — `useAppStore(s => s.messages)` 替换 DEMO
- `nexus-agent/src/renderer/components/CommandInput.tsx` — 接 `sendMessage` action
- `nexus-agent/src/renderer/components/ToolPanel.tsx` — 接 `pendingTools`
- `nexus-agent/src/renderer/components/StatusIndicator.tsx` — 接 `agentStatus`
- `nexus-agent/src/renderer/components/PermissionPrompt.tsx` — 接 `permissions`，**Phase 10 实装逻辑**
- `nexus-agent/src/renderer/components/SettingsModal.tsx` — 早已接 store
- `nexus-agent/src/renderer/components/DiffViewer.tsx` — 接 `pendingTools[].diff`，**Phase 11 实装 Monaco**
- `nexus-agent/src/renderer/App.tsx` — 加 event 订阅生命周期 `useEffect`
- `nexus-agent/src/renderer/hooks/useAgentEvent.ts` — IPC event 订阅封装
- `nexus-agent/src/renderer/types/electron.d.ts` — `window.nexus` 类型补全

**验收标准：**
- `tsc --noEmit` 全绿
- Phase 7 stub 工具下，Demo 用户在主窗口输入 → ChatPanel 出现消息气泡 + 流式渲染
- 状态机切换时 StatusIndicator 颜色过渡可见（呼吸 / 脉冲）
- vite build 无 error
- 没有任何 DEMO_* 常量残留代码（grep 验证）

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE8-VERIFICATION.md`
- 当前环境已通过 typecheck、Electron build、Phase 7 回归 smoke、Phase 8 主窗口 DOM 输入 smoke；renderer 已清空 `DEMO_*` / `CONTEXT_FILES` 常量，ChatPanel/ToolPanel/StatusIndicator 改为 Zustand + IPC 事件驱动。

---

## Phase 9 · 工具集实装 + node-pty exec

**交付内容：**
- 5 个工具：`read_file` / `write_file` / `list_dir` / `search_files` / `exec`
- read 系列仅项目白名单内；write/exec 走 PermissionPrompt（**Phase 10 接**）
- exec 走 `node-pty`（不是 `child_process`），跑命令返回 Promise+stdout 流
- electron-rebuild `node-pty`
- electron-builder `asarUnpack` 加 `**/node_modules/node-pty/**` + `.dylib` 依赖

**关键文件：**
- `nexus-agent/package.json` — `node-pty@^1.0.0`
- `nexus-agent/src/main/agent/tools/readFile.ts` — `path` 校验白名单 → `fs.readFile`
- `nexus-agent/src/main/agent/tools/writeFile.ts` — `path` 校验 + Permission gate → `fs.writeFile`
- `nexus-agent/src/main/agent/tools/listDir.ts` — `fs.readdir`
- `nexus-agent/src/main/agent/tools/searchFiles.ts` — 原生 `fs` 递归搜索（跳过 `.git` / `node_modules` / `dist` 等）
- `nexus-agent/src/main/agent/tools/exec.ts` — `node-pty.spawn` 返回 `Promise<{stdout, exitCode}>`
- `nexus-agent/src/main/agent/dispatcher.ts` — 接 Phase 7 stub，调用真工具
- `nexus-agent/src/main/security/pathGuard.ts` — `resolveProjectPath(projectRoot, inputPath)` 校验不超出
- `nexus-agent/electron-builder.yml` — 加 `node-pty` 到 `asarUnpack`

**验收标准：**
- 模型调 `read_file` 读项目内文件 → 返回内容
- 模型调 `read_file('/etc/passwd')` → dispatcher 抛 `OUT_OF_BOUNDS`，ToolPanel 拒绝
- 模型调 `write_file` → Phase 10 接通前：写文件不弹窗直接写（**这是 Phase 10 前临时状态**，必须下 Phase 立即接 PermissionPrompt）
- 模型调 `exec('ls', cwd)` → node-pty 跑 → 返 stdout

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE9-VERIFICATION.md`
- 当前环境已通过 `npm run tsc:check`、`npm run electron:build`、`node scripts/phase9-pathguard-smoke.cjs`、`node scripts/phase8-smoke.cjs`、`node scripts/phase9-smoke.cjs`。
- `phase9-smoke` 使用隔离 `NEXUS_DB_PATH`、Electron `userData`、临时 project、临时 `NEXUS_CLAUDE_HOME`、mock API key 和本地 mock Anthropic SSE；覆盖 5 个工具、`/etc/passwd` 越界拒绝、真实写入文件、`node-pty` 执行命令、ToolPanel `tool_use/tool_result` 展示和模型续传 `tool_result`。
- Phase 9 未实现危险命令策略和 PermissionPrompt 授权规则；`write_file` / `exec` 是 Phase 10 前临时直通能力，已由 `pathGuard` 限制在 project root 内，下一 Phase 必须接 PermissionPrompt。

---

## Phase 10 · PermissionPrompt + 危险动作拦截

**交付内容：**
- 3 档授权 UI：「拒绝」「允许一次」「始终允许」按钮
- dangerous 命令黑名单：`git push`、`rm -rf`、`sudo`、`git reset --hard`、`chmod 777`、`npm publish` 等：禁「始终允许」
- 「始终允许」按命令 / 路径 pattern 精确匹配（不入数据库用通配 `*`）
- PermissionPrompt UI 接通 store，3 档按钮点击写 IPC
- 主进程收到「拒绝」→ 工具返 `{error: 'rejected'}` 给模型

**关键文件：**
- `nexus-agent/src/main/security/permissions.ts` — `requestPermission(toolName, input)` 主流程
- `nexus-agent/src/main/security/dangerous.ts` — 危险模式正则（已有，扩展）
- `nexus-agent/src/main/security/permissionMatch.ts` — `~/.nexus/permissions.json` 读写 + 精确匹配
- `nexus-agent/src/main/agent/dispatcher.ts` — write_file / exec 之前先过 permissions
- `nexus-agent/src/main/ipc.ts` — `permission:request` / `permission:respond` 双向 IPC
- `nexus-agent/src/renderer/components/PermissionPrompt.tsx` — 接 store，显示完整 input
- `nexus-agent/src/renderer/store/slices/toolsSlice.ts` — 复用 `permissions` 队列承载 `awaitingPermission` 请求
- `nexus-agent/src/renderer/components/PermissionPrompt.tsx` — 危险动作变体（红边框 + 取消 always-allow 按钮）

**验收标准：**
- 用户首次见 `write_file` 弹窗 → 「允许一次」→ 写成功 + 不写 rule
- 同工具反复调用 → 不再弹（rule 命中）
- 「始终允许 `pnpm test`」→ 设规则后只放 pnpm test，其它仍弹
- 调 `git push -u origin main` → 弹窗 + **无**「始终允许」按钮
- 弹窗期间 Esc = 「拒绝」
- ToolPanel 显示 rejected 状态

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE10-VERIFICATION.md`
- 当前环境已通过 `npm run tsc:check`、`npm run electron:build`、`node scripts/phase9-pathguard-smoke.cjs`、`node scripts/phase9-smoke.cjs`、`node scripts/phase10-smoke.cjs`。
- `phase10-smoke` 使用隔离 `NEXUS_DB_PATH`、Electron `userData`、临时 project、临时 `NEXUS_CLAUDE_HOME`、mock API key、本地 mock Anthropic SSE 和临时 `NEXUS_PERMISSIONS_PATH`；覆盖允许一次不写 rule、`pnpm test` 始终允许精确命中、`git push -u origin main` 无「始终允许」、拒绝/ESC 返回 `rejected`、ToolPanel 显示 `已拒绝`。
- Phase 10 未进入 xterm/Monaco/终端嵌入；规则默认存储路径为 `~/.nexus/permissions.json`，smoke 使用临时路径隔离。

---

## Phase 11 · 终端嵌入（xterm.js + node-pty）+ DiffViewer（Monaco）

**交付内容：**
- xterm.js 接 node-pty 实时 stdout（renderer 订阅 IPC event `pty:data`）
- Monaco diff editor 接 `toolUse.diff` 数据
- ToolPanel `hasDiff` 项展开时内嵌 Monaco，小 diff inline / 大 diff side-by-side
- 全屏 DiffViewer（SCREEN-006）入口 ↗ 按钮

**关键文件：**
- `nexus-agent/package.json` — `@xterm/xterm@^5.5.0`、`@xterm/addon-fit@^0.10.0`、`monaco-editor@^0.52.0`
- `nexus-agent/src/main/pty/manager.ts` — `spawnPty(cmd, cwd, sessionId)` 主进程 spawn
- `nexus-agent/src/main/pty/ipc.ts` — `pty:spawn` / `pty:write` / `pty:data` 双向流
- `nexus-agent/src/renderer/components/Terminal/PtyTerminal.tsx` — xterm.js mount + IPC 订阅
- `nexus-agent/src/renderer/components/Terminal/XtermTheme.ts` — xterm theme 走 `--color-surface-card`/`--seed-fg`
- `nexus-agent/src/renderer/components/DiffViewer.tsx` — Monaco diff editor mount
- `nexus-agent/src/renderer/components/DiffViewer/MonacoTheme.ts` — Monaco theme 同色系
- `nexus-agent/src/renderer/components/DiffViewer/DiffView.tsx` — fullscreen SCREEN-006

**验收标准：**
- 模型调 `exec('ls -la', cwd)` → ToolPanel 展开看到 xterm 真终端，ANSI 色彩保留
- 输入命令到 xterm（交互）→ 真在主进程 child_process 跑 → stdout 双向
- 模型 `write_file` 产生 diff → ToolPanel 点开 → Monaco diff 显示绿加红减，行号在
- `↗` 按钮 → 全屏 SCREEN-006，Esc 关闭
- xterm 字体 JetBrains Mono 13px，背景 `--color-surface-card`

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE11-VERIFICATION.md`
- 当前环境已通过 `npm run tsc:check`、`npm run electron:build`、`node scripts/phase10-smoke.cjs`、`node scripts/phase11-smoke.cjs`。
- `phase11-smoke` 使用隔离 `NEXUS_DB_PATH`、Electron `userData`、临时 project、临时 `NEXUS_CLAUDE_HOME`、临时 `NEXUS_PERMISSIONS_PATH`、mock API key 和本地 mock Anthropic SSE；覆盖 ANSI xterm stdout、交互输入返回 stdout、`write_file` diff、Monaco 行号/加减计数、小 diff inline、全屏 DiffViewer 打开和 Esc 关闭。
- Phase 11 未进入 Phase 12 builtin skills、boot skill、发布打包。

---

## Phase 12 · 内置 Goal 6 Sub-skill + Boot Skill

**交付内容：**
- 在 `~/Library/Application Support/Nexus/skills/builtin/` 内置 6+ 个 sub-skill：
  - `prd/SKILL.md` — 需求草案生成
  - `prd-to-spec/SKILL.md` — PRD 转技术方案
  - `to-issues/SKILL.md` — 拆解 issue
  - `goal/SKILL.md` — 实现功能
  - `review-it/SKILL.md` — 代码审查
  - `ship-it/SKILL.md` — 提交
  - bonus: `refactor/SKILL.md`, `note-it/SKILL.md`, `code-to-spec/SKILL.md`
- 1 份 boot skill：`goal-workflow/SKILL.md`，description 写「goal 六步法驱动 PR」
- Phase 5 loader 已支持加载，只验证内置路径可扫到

**关键文件：**
- `nexus-agent/resources/builtin-skills/goal-workflow/SKILL.md` — boot skill frontmatter + body 引用 6 sub-skill
- `nexus-agent/resources/builtin-skills/prd/SKILL.md`
- `nexus-agent/resources/builtin-skills/prd-to-spec/SKILL.md`
- `nexus-agent/resources/builtin-skills/to-issues/SKILL.md`
- `nexus-agent/resources/builtin-skills/goal/SKILL.md`
- `nexus-agent/resources/builtin-skills/review-it/SKILL.md`
- `nexus-agent/resources/builtin-skills/ship-it/SKILL.md`（`allowed-tools` 不含 push 到 main）
- `nexus-agent/resources/builtin-skills/refactor/SKILL.md`
- `nexus-agent/resources/builtin-skills/note-it/SKILL.md`
- `nexus-agent/resources/builtin-skills/code-to-spec/SKILL.md`
- `nexus-agent/src/main/skills/builtin.ts` — 首次启动拷贝到 `~/Library/Application Support/Nexus/skills/builtin/`
- `nexus-agent/src/main/skills/paths.ts` — 扩展扫内置目录

**验收标准：**
- 首次启动 → 内置 skill 出现在 `~/Library/Application Support/Nexus/skills/builtin/`
- 用户输入「用 goal 工作流帮我加 user 表」 → Agent 跑 `/prd` → 生成 PRD → 进入 `/goal` → 改文件
- ToolPanel 显示 `/ship-it` 触发了，但 git push 命令被拦（PermissionPrompt 弹出，因为 ship-it 不允许 push 到 main）

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE12-VERIFICATION.md`
- 当前环境已通过 `npm run tsc:check`、`npm run electron:build`、`node scripts/phase5-smoke.cjs`、`node scripts/phase11-smoke.cjs`、`node scripts/phase12-smoke.cjs`。
- `phase12-smoke` 使用隔离 Electron `userData`、临时 project 和临时 `NEXUS_CLAUDE_HOME`；覆盖首次复制 10 个内置 skill、重复启动不覆盖用户已改文件、`loadContext` 读取 builtin skills、项目 `prd` 覆盖 builtin `prd`、`goal-workflow` 引用 6 个核心 sub-skill、`ship-it` 不在 `allowed-tools` 授权 push。
- Phase 12 未进入 Phase 13 多窗口/托盘/通知/快捷键，也未进入 Phase 14 打包/MVP 验收。

---

## Phase 13 · 系统集成（多窗口 / 多 tab / 托盘 / 通知 / 快捷键）

**交付内容：**
- 多项目 tab：sidebar 切项目 → Zustand `currentProject` 变更 → IPC 通知主进程切换 workingDir
- 多窗口：「新建窗口」菜单 → 新 BrowserWindow，每窗口独立 session
- 系统托盘：4 张 SVG 图标按 agentStatus 切色，菜单含显示/退出
- 通知中心：Agent 完成 / 报错走 Electron Notification API
- 全局快捷键：`globalShortcut.register('CommandOrControl+Shift+A', showMainWindow + focus input)`
- Settings 可禁用 / 重绑快捷键

**关键文件：**
- `nexus-agent/src/main/window.ts` — BrowserWindow 工厂
- `nexus-agent/src/main/window/manager.ts` — 所有 BrowserWindow 注册 + 关闭清理
- `nexus-agent/src/main/tray/index.ts` — `Tray` 实例化 + 菜单 + 4 色 SVG/nativeImage
- `nexus-agent/src/main/notifications/index.ts` — `notify({title, body})` 封装
- `nexus-agent/src/main/shortcuts/global.ts` — `globalShortcut.register` + 配置加载
- `nexus-agent/src/main/shortcuts/config.ts` — settings 存快捷键 schema
- `nexus-agent/src/main/menu/index.ts` — 应用主菜单（macOS 第一项）
- `nexus-agent/src/main/ipc.ts` — `window:new`、`window:focus`、`project:switch`
- `nexus-agent/src/preload/index.ts` / `src/preload/api.ts` — Phase 13 IPC bridge
- `nexus-agent/src/renderer/App.tsx` / `src/renderer/components/SettingsModal.tsx` — 项目 tab 切换、快捷键 focus、Settings 快捷键控制

**验收标准：**
- 菜单「新建窗口」→ 第二个窗口出现
- 菜单切换项目 → 主窗口 workingDir 切换
- agentStatus 切 executing 时托盘图标变橙
- Agent 完成 → macOS 通知中心出现通知
- ⌘⇧A 全局快捷键 → 主窗口 focus + input 自动 focus
- Settings 关掉快捷键 → 不再生效

**验收记录（2026-07-04）：**
- `nexus-agent/docs/PHASE13-VERIFICATION.md`
- 当前环境已通过 `npm run tsc:check`、`npm run electron:build`、`node scripts/phase12-smoke.cjs`、`node scripts/phase13-smoke.cjs`。
- `phase13-smoke` 使用隔离 Electron `userData`、临时 DB、临时 project A/B、临时 `NEXUS_CLAUDE_HOME`、临时 `NEXUS_PERMISSIONS_PATH`；覆盖菜单新建窗口数为 2、关闭后窗口注册表回到 1、项目 tab 切换后主进程 window projectPath 更新、托盘 executing 为橙色 `#f59e0b`、done/error 通知封装触发、快捷键 focus CommandInput、快捷键重绑后重新注册、Settings 禁用后 `enabled:false` 且 `registered:false`。
- `rg -n "electron-builder|dmg|Phase 14|mac.target" "src" "scripts" "docs/PHASE13-VERIFICATION.md"` 返回无匹配。
- Phase 13 未新增依赖，未改 release packaging 配置。

---

## Phase 14 · electron-builder 打包 + MVP 验收

**交付内容：**
- electron-builder 配置：`appId` / `productName` / `mac.target: dmg` / `mac.category: public.app-category.developer-tools`
- asarUnpack 列表加 `better-sqlite3` + `node-pty` + 它们的 `.dylib`
- `postinstall` 脚本跑 `electron-builder install-app-deps`
- 跑用户原话 MVP 验收硬指标：
  - 能跑通 1 份示例 workflow（goal 6 步中至少完成 /prd + /goal → 改 1 个文件）
  - 能看到 agent 工具调用过程（ToolPanel 全程可见）
  - 能改 1 个文件后跑 `npm test` 全绿
- 修测试中暴露的 bug，进 code-review

**关键文件：**
- `nexus-agent/electron-builder.yml` — 完整打包配置（mac target + asarUnpack + nativeDependency）
- `nexus-agent/scripts/build-mac.sh` — `electron-builder install-app-deps && electron-builder --mac`
- `nexus-agent/docs/MVP_TEST.md` — 用户原话验收脚本（手测步骤）
- `nexus-agent/scripts/phase14-ui-smoke.cjs` — 真实 Electron UI smoke：添加项目、发送消息、重启恢复、skill allowed-tools 拒写、SQLite 始终允许规则
- `nexus-agent/out/` — 产出 `.dmg`

**验收标准：**
- `npm run build:mac` 产出 `out/Nexus Agent-0.1.0.dmg`（内部先跑 `npm run electron:build`）
- 在干净 macOS Sonoma 上 mount dmg → 拖入 Applications → 启动 → 用户原话验收硬指标三项全通过：
  - **能跑通 1 份示例 workflow**
  - **能看到 agent 工具调用过程**
  - **能改 1 个文件后跑 npm test 全绿**
- vite build 无 error
- 卸载干净：把 app 拖到回收站 → 所有用户数据 `~/Library/Application Support/Nexus` 可单独删

**验收记录（2026-07-04）：**
- `nexus-agent/docs/MVP_TEST.md`
- `nexus-agent/docs/PHASE14-VERIFICATION.md`
- `nexus-agent/electron-builder.yml` 已配置 `appId: com.nexus.agent`、`productName: Nexus Agent`、`mac.category: public.app-category.developer-tools`、`mac.target: dmg`、`asarUnpack` 覆盖 `better-sqlite3`、`node-pty`、`**/*.node`、`**/*.dylib`。
- `nexus-agent/package.json` 新增 `build:mac`，`postinstall` 执行 `electron-builder install-app-deps && npm run rebuild:native`；`nexus-agent/scripts/build-mac.sh` 执行 `npm run electron:build`、`electron-builder install-app-deps`、`electron-builder --mac`。
- `npm run tsc:check` 通过。
- `npm run build:mac` 通过，产出 `nexus-agent/out/Nexus Agent-0.1.0.dmg`（136M）和 `out/Nexus Agent-0.1.0.dmg.blockmap`；electron-builder 日志确认 `better-sqlite3` 与 `node-pty` 对 Electron 39.8.10 arm64 rebuild，未做签名/公证/上传。
- `node scripts/phase14-package-check.cjs` 通过，确认 `app.asar.unpacked` 内存在 `better_sqlite3.node` 与 `node-pty`/`pty.node`。
- `node scripts/phase14-mvp-smoke.cjs` 通过：隔离 `userData`、DB、临时 project、`NEXUS_CLAUDE_HOME`、`NEXUS_PERMISSIONS_PATH`，本地 mock SSE 触发 `/prd` + `/goal`，ToolPanel 展示 `write_file`/`exec`，写入 `generated/mvp.txt`，`npm test` 返回 `exitCode:0` 且 stdout 包含 `PHASE14_NPM_TEST_GREEN`。
- `node scripts/phase12-smoke.cjs`、`node scripts/phase13-smoke.cjs` 回归通过。
- 打包后的 `.app` 使用隔离环境无界面启动 5 秒稳定，stderr 仅有 Node `DEP0040 punycode` deprecation warning。
- 生产 `userData` 已收敛到 `~/Library/Application Support/Nexus`，用于卸载后的单目录清理；测试仍可通过 `NEXUS_SMOKE_USER_DATA` 隔离。
- 干净 macOS Sonoma 14.x 安装验收未在当前机器执行：当前环境是 macOS 26.5.1 arm64，不是干净 Sonoma；`docs/MVP_TEST.md` 已补手测清单。

**补充验收记录（2026-07-05）：**
- `npm run tsc:check` 通过。
- `npm run electron:build` 通过；Vite 仍只有既有 Monaco chunk size warning。
- `node scripts/phase14-ui-smoke.cjs` 通过：真实 Electron BrowserWindow 点击 `添加项目`，发送 `write_file` 消息，点击 `始终允许`，重启后用同一 SQLite DB / `userData` 恢复历史，再发送 `/readonly` 触发 project skill 的 `allowed-tools: [read_file]`，主进程拒绝 `write_file` 且未写入 `generated/denied.txt`。
- `phase14-ui-smoke` 读取 SQLite `permissions`，确认存在 `write_file:generated/allowed.txt` 且 `scope:"always"`；mock Anthropic 第 3/4 次请求只暴露 `read_file`。
- `node scripts/phase10-smoke.cjs`、`node scripts/phase14-mvp-smoke.cjs` 回归通过。
- 针对 smoke 暴露的问题，已修正 agent stream 过滤工具路径导入为 `./tools/index`，并补主进程 agent turn 失败日志，便于定位不再只看到 `unknown`。

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 桌面壳 | electron | ^39.0.0 | 2026 当前稳定线；macOS 优先 |
| 打包 | electron-builder | ^25.0.0 | 配 asarUnpack + nativeDependency + electron-updater 预留 |
| native rebuild | @electron/rebuild | ^4.0.0 | 给 better-sqlite3 / node-pty 用 Electron Node ABI 重建 |
| 语言 | typescript | ^5.5.0 | 主进程 + preload + renderer 全栈 TS；jsx → tsx 迁移 |
| 主进程构建 | tsc | 内置 | 不上 webpack，主进程 tsconfig 走 tsc --project |
| renderer 构建 | vite | ^5.4.0 | 沿用 react-vite 版本，避免升级炸现有组件 |
| UI 框架 | react | ^18.2.0 | react-vite 现状版本，不升级到 19（避免生态 break） |
| 状态管理 | zustand | ^5.0.0 | v5 + React 18 兼容；用 `useShallow` 选 slice |
| 动效 | framer-motion | ^11.0.0 | 沿用 react-vite |
| UI 图标 | lucide-react | ^0.263.1 | 沿用 |
| 样式 | tailwindcss | ^3.4.0 | 沿用 |
| Markdown 渲染 | react-markdown | ^9.0.0 | 消息里代码块高亮（替换现有 syntax-highlight） |
| 代码高亮 | shiki 或 highlight.js | shiki ^1.0.0 | 延迟选择 |
| 终端 | @xterm/xterm + @xterm/addon-fit + node-pty | ^5.5.0 / ^0.10.0 / ^1.0.0 | 终端嵌入必备三件套 |
| 编辑器 | monaco-editor | ^0.52.0 | DiffViewer（编辑能力 v1.0 砍掉，见 OUT-009） |
| 模型 SDK | @anthropic-ai/sdk | ^0.30.0 | 裸 SDK 自管 loop；sub-agent v1.0 砍掉，见 OUT-010 |
| 数据库 | better-sqlite3 | ^11.0.0 | 主进程同步 API；asarUnpack + electron-rebuild |
| 路径守卫 | - | - | 自写 pathGuard.ts，**不引第三方** |
| 文件搜索 | node:fs / node:path | 内置 | search_files 工具，Phase 9 已决定不新增 fast-glob |
| frontmatter | gray-matter | ^4.0.3 | 解析 SKILL.md frontmatter |
| 系统集成 | electron safeStorage / Tray / Notification / globalShortcut / Menu | 内置 | 不引第三方 |
| **自动更新**（v1.0） | electron-updater | ^6.0.0 | GitHub Releases 通道；Settings 可关 |
| **测试**（v1.0） | vitest + @vitest/coverage-v8 | ^2.0.0 / ^2.0.0 | 4 类核心单测 |

## 数据库表

| 表名 | 所属 Phase | 用途 |
|------|-----------|------|
| `projects` | Phase 3 | 项目列表 + workingDir |
| `sessions` | Phase 3 | 对话 session（绑项目） |
| `messages` | Phase 3 + **15** | session 内消息持久化；**v1.0 加 5 列**：input_tokens / output_tokens / cache_creation_tokens / cache_read_tokens / cost_usd |
| `permissions` | Phase 10 | 「始终允许」规则（按 project + pattern） |
| `settings` | Phase 3 + 4 + 13 + **15** | KV 设置；其中 key `api_key` 存 safeStorage 加密 blob；**v1.0 加 `autoUpdateEnabled`** 键 |

## 开发规则

- 每完成一个 Phase 执行四步走：Code Review → 测试完整性 → 编译验证 → 功能测试
  - Phase 14 之前不强制单测（项目未配 vitest），但每个 Phase 至少留一个**手动验证清单**（通过/不通过）
  - **Phase 15 起强制单测**（vitest 接入，4 类核心测试：safeStorage / pathGuard / dangerous / cost）
  - vite build 必须每 Phase 都过；主进程 `tsc --noEmit` 必须每 Phase 都过
- 四步走全部通过后才能进下一 Phase
- Commit message 用 feat / fix / refactor / chore 前缀
- 包管理器：**pnpm**（macOS Sonoma 系统已带，比 npm 严格）
- 不在 phase 间修改已完成阶段的文件（仅追加依赖）
- **Phase 14 之后必须进 code-review**（项目状态检测路由会提示）
- **Phase 15 起每次 commit 前确认 messages 表 schema 与代码里 DAO 签名一致**

## 启动开发必读

新 session 进 `nexus-agent/` 后：
1. `pnpm install`（首次会触发 postinstall rebuild native modules）
2. `pnpm electron:dev`（启动 vite + electron 两个进程）
3. 每次重启从 Phase 1 验收清单跑起，确认未回归
4. **Phase 15+ 跑 `pnpm test`（vitest）必须全绿**

---

## Phase 15 · messages 表 migration + 成本估算（v1.0 P0）

**交付内容：**
- 新增 migration `002_cost_tracking.sql.ts`：`ALTER TABLE messages ADD COLUMN input_tokens / output_tokens / cache_creation_tokens / cache_read_tokens / cost_usd`（5 列）；`settings` 表加 `autoUpdateEnabled` 键（默认 `true`）
- 主进程 `agent/cost.ts`：`computeCost(model, usage): number` 按 Spec §11.6 公式；`MODEL_PRICING` 表（Sonnet 4.6 / Sonnet 5 / Haiku 4.5 / Opus 4.8 / Fable 5）
- `messages.ts` DAO：`appendMessage` / `updateMessageCost` 接受 5 字段
- agent loop：`assistant_message` 写入时把 `usage` 解析后填 5 列，`cost_usd` 实时算
- ToolPanel 顶部「Session $X.XX」钉行：实时累计当前 session 所有 assistant 消息 cost_usd
- ChatPanel assistant 气泡：默认不显示 cost，点击展开后展示「本条 cost $0.012 · input 850 / output 120 / cache read 0」
- 老用户启动自动跑 migration（不动已有数据，新列默认 NULL）

**关键文件：**
- `nexus-agent/src/main/db/migrations/002_cost_tracking.sql.ts` — ALTER TABLE 5 列
- `nexus-agent/src/main/agent/cost.ts` — `computeCost` + `MODEL_PRICING`
- `nexus-agent/src/main/agent/types.ts` — `AgentUsage` 类型加 4 字段
- `nexus-agent/src/main/db/dao/messages.ts` — `updateMessageCost(messageId, cost)` 增量更新
- `nexus-agent/src/main/agent/loop.ts` — assistant 消息写完时同步 cost_usd
- `nexus-agent/src/renderer/store/slices/agentSlice.ts` — `sessionCostUsd` selector
- `nexus-agent/src/renderer/components/ToolPanel.tsx` — 顶部钉「Session $X.XX」行
- `nexus-agent/src/renderer/components/ChatPanel.tsx` — assistant 气泡点击展开 cost

**验收标准：**
- `npm run tsc:check` 全绿
- 跑过一次老库（v0.1 的 nexus.db）启动后 `messages` 表有 5 个新列，已有数据不动
- 跑一条 assistant 消息后 SQLite 里 `cost_usd` 字段 = `computeCost` 结果（精度 6 位小数）
- ToolPanel 顶部稳定显示当前 session cost，跑第二条消息后累加正确
- assistant 气泡点击展开 → 看到本条 5 字段明细
- 新增 smoke 脚本 `phase15-cost-smoke.cjs`：mock SDK 返 usage → 验 messages 5 字段 + ToolPanel event

---

## Phase 16 · cache 命中显示到 ToolPanel（v1.0 P0）

**交付内容：**
- agent/stream.ts 把 `usage` 通过 `agent:event` 推 renderer（新增事件类型 `usage_delta`）
- ToolPanel 每条工具调用行追加：「cache: read X.Xk / write Y.Yk / hit Z%」（read / write 分开展示，按 SPEC §11.6）
- 每 turn 结束追加一行汇总：本 turn 总 cache read / write / hit%
- ChatPanel 输入框旁 badge 显示当前 Session 总 hit%（轻量、节省感更强）

**关键文件：**
- `nexus-agent/src/main/agent/stream.ts` — `usage_delta` event 推送
- `nexus-agent/src/renderer/store/slices/agentSlice.ts` — `currentTurnCache` state
- `nexus-agent/src/renderer/components/ToolPanel.tsx` — 工具行追加 cache 子行
- `nexus-agent/src/renderer/components/ToolPanel/CacheRow.tsx` — 新组件，read/write 分两段
- `nexus-agent/src/renderer/components/CommandInput.tsx` — 旁加 hit% badge

**验收标准：**
- mock SDK 返 `cache_read_input_tokens=5000, cache_creation_input_tokens=0` → ToolPanel 显示「cache: read 5.0k / write 0 / hit 100%」
- mock SDK 返无 cache 字段 → ToolPanel 显示「cache: read 0 / write 0 / hit 0%」
- turn 结束 ToolPanel 末尾多一行「turn total: cache read 12.3k / write 1.2k / hit 91%」
- 多次 turn 累计 hit% 在 CommandInput 旁 badge 正确刷新
- smoke `phase16-cache-smoke.cjs` 全绿

---

## Phase 17 · 5xx 指数退避重试（v1.0 P0）

**交付内容：**
- agent/loop.ts 包一层重试：stream 中断时分类错误码
- **重试规则**：5xx / 529 / 408 → 1s/2s/4s 指数退避，最多 2 次；429 → 不重试立即 error；401/402/403 → 立即 error 回 Settings
- ToolPanel 流期间显示「重试 1/2」「重试 2/2」（agentStatus 保持 `executing` 不切 retrying）
- 每次重试重新发起完整 turn（messages 数组不丢，但 push `retry_marker` 标记）
- logger 记录每次重试：reason / attempt / backoff_ms / final_outcome

**关键文件：**
- `nexus-agent/src/main/agent/loop.ts` — `runTurnWithRetry(promptContext, messages, signal)`
- `nexus-agent/src/main/agent/retry.ts` — `classifyError(error)` 分类 + `computeBackoff(attempt)`
- `nexus-agent/src/main/agent/types.ts` — `AgentEvent` 加 `retry_started` / `retry_succeeded`
- `nexus-agent/src/main/logger.ts` — `logRetryAttempt({reason, attempt, backoffMs})`
- `nexus-agent/src/renderer/store/slices/agentSlice.ts` — `currentRetryAttempt` state
- `nexus-agent/src/renderer/components/ToolPanel.tsx` — 重试行渲染

**验收标准：**
- mock SDK 第一次返 500，第二次 200 → ToolPanel 显示「重试 1/2」+ 1s 后成功，无错误态
- mock SDK 三次连续 500 → ToolPanel 显示「重试 1/2」「重试 2/2」+ 切 error
- mock SDK 返 429 → 立即切 error，无重试
- mock SDK 返 401 → 立即切 error，ChatPanel 显「API key 无效，去 Settings」
- 网络断开 → `error: 'network'` 事件，分类为可重试
- smoke `phase17-retry-smoke.cjs` 全绿

---

## Phase 18 · 卡死检测 + ⌘⇧T / ⌘⇧L 快捷键（v1.0 P0）

**交付内容：**
- agent/state.ts 加卡死检测 reducer：
  - 同 tool_use id 错误次数 ≥ 3 → 切 error
  - 连续 5 次 turn 无 tool progress → 弹「是否继续？」
  - 60s 内无 tool_result → 警告「agent 卡死？」
- 快捷键注册：⌘⇧T 切下一个 project tab、⌘⇧L focus CommandInput
- ⌘⇧T 单 project 时无效（不发 IPC）；⌘⇧L focus 后输入框清空、不预填
- 三个快捷键全部接入 Phase 13 的 Settings 禁用开关

**关键文件：**
- `nexus-agent/src/main/agent/state.ts` — `detectStuck(toolUseId, errorHistory, noProgressCount)` reducer
- `nexus-agent/src/main/agent/loop.ts` — 调用卡死检测，每次 tool_result 后清零 60s 计时
- `nexus-agent/src/main/shortcuts/config.ts` — `SHORTCUT_KEYS` 加 `SwitchTabNext: 'CommandOrControl+Shift+T'` 和 `FocusCommandInput: 'CommandOrControl+Shift+L'`
- `nexus-agent/src/main/shortcuts/global.ts` — 注册新快捷键 + 调 `window.nexus.project.switchNext()` / `window.nexus.window.focusInput()`
- `nexus-agent/src/main/ipc.ts` — `project:switchNext` handler（仅切 currentProject，不动 SQLite）
- `nexus-agent/src/preload/index.ts` — `window.nexus.project.switchNext` 暴露
- `nexus-agent/src/renderer/components/SettingsModal.tsx` — 加 ⌘⇧T / ⌘⇧L 启用开关

**验收标准：**
- mock SDK 连续 3 次对同 tool_use id 返 error → 第 3 次切 error，ChatPanel 显示「agent 反复调用同工具失败」
- 工具调用连续 5 次但无文本 progress → 弹 PermissionPrompt 风格「agent 无进展，是否继续？」
- 已发出 tool_use 60s 内未收 tool_result → ToolPanel 警告气泡
- 按 ⌘⇧T → 多 project 时切到下一个 tab，workingDir 同步更新；单 project 时系统无响应
- 按 ⌘⇧L → 主窗口 focus + CommandInput focus + 输入框清空，光标在末尾
- Settings 勾掉 ⌘⇧T → 重启后按 ⌘⇧T 无响应，但 ⌘⇧A / ⌘⇧L 仍生效
- smoke `phase18-stuck-smoke.cjs` + `phase18-shortcut-smoke.cjs` 全绿

---

## Phase 19 · electron-updater 自动更新（v1.0 P0）

**交付内容：**
- 接入 `electron-updater` ^6.0.0
- main/updater.ts：`checkForUpdates()` 启动时调一次 + 每 6 小时一次；`downloadUpdate()` 后弹「立即重启 / 下次再说」；`applyUpdate()` 在用户确认时调
- Settings 加开关：`autoUpdateEnabled` 默认 true；UI 显「检查更新」「立即更新」「上次检查于 XX」
- electron-builder.yml 配 `publish: provider: github, owner: sword-demon, repo: nexus`
- 启动时检测到 major version 变更弹一次性迁移提示
- **macOS 公证**：v1.0 不强制（无 Apple Developer ID 时 dmg 也能装，会弹 Gatekeeper 警告；用户首次右键打开即可），留 v1.1 评估

**关键文件：**
- `nexus-agent/package.json` — 加 `electron-updater@^6.0.0` + `build.publish` 段
- `nexus-agent/electron-builder.yml` — `mac.target: dmg` + `publish` 段
- `nexus-agent/src/main/updater/index.ts` — `checkForUpdates` / `downloadUpdate` / `applyUpdate`
- `nexus-agent/src/main/updater/state.ts` — `UpdateStatus`（idle / checking / available / downloading / ready / error）
- `nexus-agent/src/main/ipc.ts` — `update:check` / `update:download` / `update:apply` / `update:status` event
- `nexus-agent/src/renderer/store/slices/settingsSlice.ts` — `autoUpdateEnabled`
- `nexus-agent/src/renderer/components/SettingsModal.tsx` — 加「更新」分区

**验收标准：**
- `npm install` 不报错（electron-updater 兼容当前 electron 39）
- `npm run build:mac` 产物 dmg 在 dev 环境能跑（无签名/公证弹警告但能装）
- Settings 开关能控制 `app.getVersion()` 启动时是否调 `checkForUpdates`
- 启动 6 小时后自动 check 一次（手动 mock 时间或写脚本验证）
- 无网络时不报错，仅日志「update check failed」
- smoke `phase19-updater-smoke.cjs` 全绿（隔离 env 测 mock GitHub releases）

---

## Phase 20 · 4 类核心单测 + vitest 接入（v1.0 P0）

**交付内容：**
- 装 `vitest@^2.0.0` + `@vitest/coverage-v8@^2.0.0` 到 devDependencies
- `vitest.config.ts` 配置：jsdom 环境 + `src/main/**/*.test.ts` 匹配 + `src/renderer/**/*.test.tsx` 匹配
- 4 类测试文件：
  - `nexus-agent/src/main/security/safeStorage.test.ts` — encrypt/decrypt round-trip + 不同明文 → 不同 blob + 空字符串处理
  - `nexus-agent/src/main/security/pathGuard.test.ts` — 5 case：相对路径越界 / `/etc/passwd` / 符号链接逃出 / 含 `..` 越界 / 边界恰好等于 project root
  - `nexus-agent/src/main/security/dangerous.test.ts` — 6 case：`git push -u origin main` / `rm -rf /` / `sudo xxx` / `git reset --hard` / `chmod 777` / `npm publish`
  - `nexus-agent/src/main/agent/cost.test.ts` — 3 case：纯 input/output 无 cache / cache read 100% / cache write + read 混合 + 5 个 model 单价各一 case
- `package.json` 加 `test` / `test:coverage` script
- `npm run test` 必须全绿，作为 Phase 21 收尾前置

**关键文件：**
- `nexus-agent/vitest.config.ts` — 配置
- `nexus-agent/package.json` — scripts + devDeps
- `nexus-agent/src/main/security/safeStorage.test.ts`
- `nexus-agent/src/main/security/pathGuard.test.ts`
- `nexus-agent/src/main/security/dangerous.test.ts`
- `nexus-agent/src/main/agent/cost.test.ts`

**验收标准：**
- `pnpm test` 全绿（至少 20 个 test case）
- `pnpm test:coverage` 4 个被测文件 100% 行覆盖（其他文件不强求）
- CI 可直接跑（macOS Sonoma 14+，Node 20+）
- 跑测时不开 Electron，纯 Node 跑（用 happy-dom 或 jsdom + 主进程模块独立 import）

---

## Phase 21 · 收尾 + v1.0 打包 + 手测文档（v1.0 P0）

**交付内容：**
- 跑 Phase 1–20 全量回归：smoke 全部不破
- `npm run electron:build` + `npm run build:mac` 双双通过，产出 `out/Nexus Agent-1.0.0.dmg`
- 更新 `nexus-agent/docs/MVP_TEST.md`：v1.0 手测清单（clean macOS Sonoma 14+ 装 dmg 后）
  - 用户原话验收三项：跑通 1 份 workflow / 看 tool 调用 / 改文件 + npm test 全绿
  - v1.0 新增手测：cache hit 显 / cost 显 / 5xx 重试 / 卡死检测 / ⌘⇧T ⌘⇧L / 自动更新
- Phase 14-ui-smoke + Phase 15–19 smoke 全绿
- `tsc:check` 三层 + `vite build` + `pnpm test` 三件套必须全绿
- Phase 21 验收记录写到 `nexus-agent/docs/PHASE21-VERIFICATION.md`

**关键文件：**
- `nexus-agent/docs/MVP_TEST.md` — v1.0 版
- `nexus-agent/docs/PHASE15-VERIFICATION.md` ~ `PHASE20-VERIFICATION.md` — 各 Phase 验收记录
- `nexus-agent/docs/PHASE21-VERIFICATION.md` — 收尾全量回归

**验收标准：**
- v1.0 完成条件清单（Product-Spec §9）全打勾
- dmg 产物在干净 Sonoma 14+ 上启动 → 渲染主窗口 + 添加项目 + 发消息 + npm test 全绿
- `pnpm test` 全绿（Phase 20 落地）
- Phase 14 既有验收记录 + Phase 15-19 新增验收记录 + Phase 21 收尾记录齐全

---

## v1.0 变更摘要（相对 v0.1 DEV-PLAN）

| 增量 | 来源 Spec 章节 | 新 Phase |
|---|---|---|
| messages 表 5 列 + autoUpdateEnabled 键 | §6 / §REQ-009 | Phase 15 |
| ToolPanel cost 显示 + ChatPanel cost 展开 | §11.6 | Phase 15 |
| ToolPanel cache 显示 + Session hit% | §REQ-003 AC-004 | Phase 16 |
| 5xx 指数退避重试 + 错误码分类 | §11.7 / §REQ-003 AC-005 | Phase 17 |
| 卡死检测 3 规则 | §11.7 | Phase 18 |
| ⌘⇧T / ⌘⇧L 快捷键 | §REQ-007 AC-002/003 | Phase 18 |
| electron-updater 自动更新 | §SCOPE-016 | Phase 19 |
| vitest 接入 + 4 类单测 | §SCOPE-018 | Phase 20 |
| 收尾 + 文档 + 全量回归 | §9 完成定义 | Phase 21 |
