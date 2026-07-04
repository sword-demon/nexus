# 产品需求规范：Nexus Agent

> 文档状态：v1.0 · 稳定版本
> 更新规则：迭代变更必须先更本文件，并写入 Product-Spec-CHANGELOG.md，再动代码。

---

## 0. AI 使用说明

- 本文档是产品功能、范围、行为和验收标准的事实来源。
- AI MUST 优先实现 P0。
- AI MUST NOT 实现「不在本版本范围」中明确排除的内容。
- AI MUST 根据「验收标准」判断功能是否完成。
- 如果信息不明确，AI MUST 使用「假设」中的假设；如果仍无法判断，应记录到「待确认问题」，而不是自行扩展需求。

---

## 1. 产品上下文

### 1.1 产品摘要

Nexus Agent 是一款基于 Electron 的桌面 AI Coding Agent 客户端，让开发者用「AGENTS.md / CLAUDE.md + 自定义 SKILL.md」三件套定义项目级 AI 工作流，在本地真实读写文件、跑命令、跑测试、调起内置工作流模板（如 goal 六步），无需订阅 IDE 供应商的高级 Agent 套餐。

### 1.2 用户问题

- **会员付费墙**：Cursor / Qoder / Claude Code 等将 Plan、Agent、Browser、Subagent 等关键能力锁在 Pro/Max 订阅层。一个独立开发者想长期使用，每月成本 50-200 美元，且部分功能是按 token 计费的不可控开支。
- **工作流不可复用**：每个项目都需要重复向 AI 解释一遍「先读 README → 列模块 → 写代码 → 写测试 → 跑 build」这套流程。没有项目级的标准文档载体，Agent 每次会话都从零学。
- **技能散落**：开发者积累的 prompt 技巧、检查清单、命令模板散落在笔记/书签/聊天历史里，无法被任意 Agent 会话复用。

### 1.3 目标用户

| 用户类型 | 描述 | 核心需求 |
|---|---|---|
| 独立开发者 | 一人做完产品前后端的工程师，自己用，不做 SaaS | 不被订阅墙绑架；项目级工作流可复用一次、终身受益 |
| 小团队 Tech Lead | 2-5 人技术团队，自动化项目里重复的工程动作（code review 清单、release 检查、git workflow） | 把团队约定文档化，让 AI 跑一致的流程，新人也能复用 |
| 开源维护者 | 维护多个开源项目，需要对新 issue 做 triage、对 PR 做 review | 通过技能模板统一处理 80% 的常见 issue/PR |

v0.1 第一版只服务第一类「独立开发者」。

### 1.4 核心价值

让用户用一份「AGENTS.md + CLAUDE.md + Skills」就能定义自己项目的 AI 工作流，Agent 在本地真实读写文件 + 执行命令 + 跑测试，不被任何 IDE 厂商锁死。

### 1.5 成功标准

| 判断标准 | 目标 / 信号 | 版本 |
|---|---|---|
| 能跑通示例工作流（goal 六步中的至少 1 步端到端） | v0.1 已达 | v0.1 |
| 用户能用一份示例工作流让 Agent 改 1 个文件并跑 npm test 通过 | v0.1 已达 | v0.1 |
| 用户从 Claude Code 项目把 `~/.claude/skills/` 直接复制即可被 Nexus Agent 识别 | v0.1 已达 | v0.1 |
| 内置至少 1 份完整工作流模板（goal 风格） | v0.1 已达 | v0.1 |
| 第一周内能在 macOS Sonoma 14+ 上原生运行 | v0.1 已达 | v0.1 |
| ToolPanel 实时显示 cache 命中（write/read/hit%）+ Session 累计 USD 成本 | v1.0 必须 | v1.0 |
| Anthropic 5xx / 529 / 408 自动指数退避重试（用户可见重试计数） | v1.0 必须 | v1.0 |
| Agent 卡死 / 循环检测（3 次同错 / 5 次无 progress / 60s 无响应） | v1.0 必须 | v1.0 |
| 快捷键 ⌘⇧T 切 project tab / ⌘⇧L focus CommandInput | v1.0 必须 | v1.0 |
| 4 类核心单测全绿（safeStorage / pathGuard / dangerous / cost） | v1.0 必须 | v1.0 |
| electron-updater 自动更新（GitHub Releases，默认开） | v1.0 必须 | v1.0 |

---

## 2. 范围

### 2.1 本版本范围（v1.0）

| 编号 | 内容 | 优先级 | 备注 |
|---|---|---|---|
| SCOPE-001 | Electron 桌面客户端（macOS 优先） | P0 | Win/Linux 占位不交付 |
| SCOPE-002 | Anthropic TypeScript SDK 直连（含流式、tool use、prompt caching） | P0 | BYO API key |
| SCOPE-003 | Claude Code SKILL.md 规范复用：`~/.claude/skills/<name>/SKILL.md`（全局）+ 项目根 `.claude/skills/`（项目级） | P0 | frontmatter 解析 `name`/`description`/`when_to_use`/`allowed-tools` |
| SCOPE-004 | CLAUDE.md / AGENTS.md 加载（项目根 + 用户目录）作为 system prompt 上下文 | P0 | 项目级覆盖全局 |
| SCOPE-005 | 内置示例工作流模板（goal 风格 6+ 步） | P0 | v0.1 已内置 6 sub-skill + 3 bonus |
| SCOPE-006 | 本地文件系统：read / write / exec（基于 fs + child_process + node-pty） | P0 | exec 走权限弹窗 |
| SCOPE-007 | 终端嵌入（node-pty + xterm.js） | P0 | 跑命令结果显示 |
| SCOPE-008 | React + Vite 渲染层（复用 react-vite/ 现有组件：ChatPanel / CommandInput / ToolPanel / SettingsModal / PermissionPrompt / StatusIndicator / DiffViewer） | P0 | DEMO_* 已替换为真实 agent stream |
| SCOPE-009 | SQLite 持久化（项目列表、对话历史、settings、API key 加密存储） | P0 | API key 用 Electron safeStorage |
| SCOPE-010 | Zustand 状态管理（renderer 进程） | P0 | 跨组件共享 agentStatus / 当前项目 / 设置 |
| SCOPE-011 | 多窗口 + 多项目 tab | P0 | 每项目独立 BrowserWindow 或独立 tab |
| SCOPE-012 | 系统托盘 + 通知中心 + 全局快捷键 | P0 | macOS 优先 |
| SCOPE-013 | Monaco 编辑器内嵌（用于显示文件 diff、查看） | P0 | 只读 + diff 对比（编辑能力砍掉，见 OUT-009） |
| SCOPE-014 | 权限弹窗（PermissionPrompt）：写文件 / 跑命令前人工确认 | P0 | 复用现有组件 |
| SCOPE-015 | 工具时间线面板（ToolPanel） | P0 | 显示 agent 调过的 skill/工具 |
| SCOPE-016 | electron-updater 自动更新（GitHub Releases） | P0 | v1.0 新增；默认开，Settings 可关 |
| SCOPE-017 | v0.1 P1 体验包：cache 显示 / 成本估算 / 5xx 重试 / 卡死检测 / 快捷键 ⌘⇧T⌘⇧L | P0 | v1.0 全部升级为 P0 |
| SCOPE-018 | 核心 4 类单测（safeStorage / pathGuard / dangerous / cost） | P0 | v1.0 工程化基线 |

### 2.2 不在本版本范围

| 编号 | 内容 | 原因 |
|---|---|---|
| OUT-001 | 账号系统 / 云同步 / 团队协作 / 远程终端 | 用户明示不要 |
| OUT-002 | 内置 workflow DSL（YAML recipe / DAG 引擎） | 用户选 A 路线（Skill 序列），不造 DSL |
| OUT-003 | 多模型路由（GPT / Gemini / DeepSeek 切换） | v0.1 仅 Anthropic；OpenAI Compatible 留接口不做 UI |
| OUT-004 | VSCode 兼容桥接（兼容 `.vscode/` 配置） | 桌面端定位，非 IDE |
| OUT-006 | Win / Linux 平台适配 | 用户明示 macOS 优先 |
| OUT-007 | MCP 多 server 编排 | 单 MCP 配置（P2），多 server 等用户提需求 |
| OUT-008 | 用户自定义编写 Skill（Skill 编辑器） | 用户从 Claude Code 复制现成 Skill，不做编辑器 |
| OUT-009 | Monaco **编辑能力**（v1.0 仍只读 + diff） | v0.1 P1 残留，v1.0 主动砍掉（见 §10.3） |
| OUT-010 | Sub-agent 编排 | v0.1 P1 评估项主动砍掉，复杂度爆炸（见 §10.3） |
| OUT-011 | 启动到首屏 < 2s（性能优化） | v0.1 P1 残留，物理上 Electron + Monaco bundle 不可能 2s（见 §10.3） |
| OUT-012 | 多币种成本显示（汇率换算） | v1.0 严守 USD，多币种留 v1.1 |

---

## 3. 用户任务

| 编号 | 用户任务 | 用户类型 | 优先级 |
|---|---|---|---|
| TASK-001 | 打开 Nexus Agent，添加本地项目路径，开始用内置工作流跟 AI 对话改代码 | 独立开发者 | P0 |
| TASK-002 | 在项目根写 AGENTS.md / CLAUDE.md，让 Agent 按约定工作 | 独立开发者 | P0 |
| TASK-003 | 复用 Claude Code 已有的 Skill（直接复制 ~/.claude/skills/） | 独立开发者 | P0 |
| TASK-004 | 在系统托盘开启 / 关闭 Agent session | 独立开发者 | P0 |
| TASK-005 | 用全局快捷键唤起 Nexus Agent 输入面板 | 独立开发者 | P1 |
| TASK-006 | 同时打开多个项目，每个项目独立对话 | 独立开发者 / Tech Lead | P1 |

---

## 4. 用户流程

### FLOW-001：首次打开 + 添加项目 + 跑第一份工作流（端到端 MVP）

**关联任务：** TASK-001, TASK-002, TASK-003  
**优先级：** P0  
**目标：** 用户 15 分钟内从零到看到 Agent 改了 1 个文件 + npm test 通过。

**入口：** macOS 启动台打开 Nexus Agent 应用，主窗口出现。

**主路径：**
1. 应用启动 → 显示主窗口（ChatPanel 空状态 + 引导文案）
2. 用户点击「添加项目」→ 选本地目录（如 `~/projects/my-app`）
3. 应用扫描项目根，若存在 `CLAUDE.md` / `AGENTS.md` / `.claude/skills/` → 自动加载，否则提示用户写
4. 用户在 CommandInput 输入：「用内置 goal 工作流帮我加一个 user 表的 migration」
5. Agent 识别意图 → 加载内置 goal boot skill → 按章节顺序读项目文件 → 输出第一步 `/prd` 产物（需求草案）
6. 用户 review 后回话：「继续」
7. Agent 进入 `/goal` 阶段 → 调用工具改文件 → 工具调用过程实时显示在 ToolPanel
8. 跑 `npm test` → 结果回显对话 + 终端 → 全部绿 → Agent 报告完成
9. 状态机从 `executing` → `done`，StatusIndicator 切绿
10. 用户可点击 DiffViewer 看具体改了什么

**分支路径：**
- 第 7 步若 Agent 调用 `write_file` 或 `exec`，PermissionPrompt 弹出，用户点允许/拒绝/始终允许；拒绝则 Agent 改方案重试
- 第 3 步项目无 CLAUDE.md 时，提示「项目无指令文档，是否创建模板？」；用户跳过则用内置默认指令

**边界情况：**
- 项目路径在沙盒外（用户取消授权） → Toast「需要文件系统权限」
- Anthropic API key 未配置 → 引导去 Settings 配置
- 网络断连 → 状态变 `error`，对话流保留，可重试
- API key 余额耗尽 → 状态变 `error`，回显具体 402 信息

**完成状态：**
- 项目列表新增 1 项
- 对话历史落 SQLite，可重启应用后恢复
- StatusIndicator 绿
- 用户看到至少 1 个文件被改 + npm test 全绿

---

## 5. 功能需求

### REQ-001：项目管理与加载（SCOPE-011 + SCOPE-006 + TASK-001）

**优先级：** P0  
**关联任务：** TASK-001  
**关联流程：** FLOW-001

**用途：**  
让用户添加本地项目路径并被 Agent 加载，作为后续所有工具调用和文件操作的根（working directory）。

**行为：**  
- 用户选目录 → 校验可读 → 写入 SQLite
- 启动时按「最近使用」排序，列出所有已添加项目
- 切换项目时切换当前 working dir、加载该项目根的 CLAUDE.md / AGENTS.md / .claude/skills/
- 多项目 tab 在主窗口渲染不同对话

**规则：**
- MUST 把项目绝对路径写入 SQLite（`projects` 表）
- MUST 启动时校验每个项目路径是否存在，不存在则标红但保留记录
- MUST 仅在用户明确授权的项目路径下执行文件操作（路径白名单）
- SHOULD 支持拖拽文件夹添加

**输入：**

| 字段 | 类型 | 必填 | 校验规则 |
|---|---|---:|---|
| projectPath | string（绝对路径） | Yes | 必须存在且可读 |
| displayName | string | No | 默认用目录名 |

**输出 / 结果：**
- SQLite `projects` 表新增记录
- UI 主窗口显示新项目 tab / 列表项
- 对话/工具的 working dir 切换

**状态：**
- 默认：空项目列表，显示「添加你的第一个项目」
- 加载：扫目录时显示 spinner
- 空状态：列表为空时的引导
- 错误：路径不存在 → 标红 + Toast；权限不足 → 引导授权
- 成功：路径写入，列表新增

**验收标准：**
- AC-001: Given 用户点击「添加项目」，when 用户选了一个有效本地目录，then 对话列表新增 1 项，tab 切换后 agentStatus 重置为 idle。
- AC-002: Given 项目根有 CLAUDE.md，when 用户切到该项目，then Agent 后续 system prompt 包含该文件内容。
- AC-003: Given 用户在白名单外路径下打开文件，when Agent 调用 read_file，then 工具被拒绝，PermissionPrompt 不弹（路径硬性拦截）但 ToolPanel 记录被拒事件。

---

### REQ-002：CLAUDE.md / AGENTS.md / Skills 加载（SCOPE-003 + SCOPE-004 + TASK-002 / TASK-003）

**优先级：** P0  
**关联任务：** TASK-002, TASK-003  
**关联流程：** FLOW-001

**用途：**  
把 Claude Code 已建立的「项目级指令 + 技能」规范直接复用，让用户不迁移就能用。

**行为：**  
- 启动时按以下顺序加载，**项目级覆盖全局**：
  1. `~/.claude/CLAUDE.md`（全局项目指令）
  2. `<project>/CLAUDE.md`（项目级）
  3. `~/.claude/AGENTS.md`（全局 agent 指令）
  4. `<project>/AGENTS.md`（项目级）
  5. `~/.claude/skills/<name>/SKILL.md`（全局 skills）
  6. `<project>/.claude/skills/<name>/SKILL.md`（项目级 skills）
- SKILL.md frontmatter 解析 `name`、`description`、`when_to_use`、`allowed-tools`
- `description` 作为 Agent 决定触发哪个 skill 的关键字段
- 加载到 system prompt 时按章节拼装：CLAUDE.md → AGENTS.md → 各 SKILL.md 全文

**规则：**
- MUST 项目级文件覆盖同名全局文件
- MUST 解析 frontmatter，缺 `name` 或 `description` 视为非法 skill，标红不入 prompt
- MUST `when_to_use` 字段作为优先级提示，但不强制按其触发
- SHOULD 解析 `allowed-tools` 限制 skill 内可调用的工具
- SHOULD 缓存解析结果，启动后改文件 5 分钟内 invalidate

**输入：**
路径集合（运行时扫描得出） + SKILL.md frontmatter 格式

**输出 / 结果：**
- 主进程的 `PromptContext` 对象：包含 CLAUDE.md/AGENTS.md 全文 + 所有 skill 的 description/name/body
- 启动 ChatPanel 时 system prompt 已带上下文

**状态：**
- 默认：所有文件不存在则仅带内置 boot skill
- 加载：扫描过程中显示项目加载状态
- 错误：单个 skill 解析失败不阻断，记录到 `~/.nexus/logs/skills-errors.log`
- 成功：prompt 注入完成

**验收标准：**
- AC-001: Given 用户有 `~/.claude/skills/refactor/SKILL.md`，when 启动 Nexus Agent，then ToolPanel 「技能列表」显示「refactor」。
- AC-002: Given 项目根 `CLAUDE.md` 写了「先 pnpm test」，when Agent 收到「优化登录页」，then 第一次工具调用包含 `pnpm test`。
- AC-003: Given SKILL.md 缺 `description`，when 启动扫描，then 该 skill 不进 prompt，日志记录错误。

---

### REQ-003：Anthropic TypeScript SDK 集成与 Agent Loop（SCOPE-002）

**优先级：** P0  
**关联任务：** TASK-001  
**关联流程：** FLOW-001

**用途：**  
驱动真实 Agent 对话流：流式接收、工具调用、上下文累积、prompt caching、错误恢复、成本可见、卡死兜底。

**行为：**  
- 主进程封装 `@anthropic-ai/sdk` 客户端
- 每次会话维护 `messages` 数组 + `system` 字符串
- 启用 prompt caching：把 CLAUDE.md/AGENTS.md/skills 全文放在 system prompt 顶部，标记 cache breakpoint
- 工具调用循环：模型返回 `tool_use` → 主进程执行本地工具 → 结果回写为 `tool_result` → 再调模型
- 流式输出 chunk 通过 IPC 推到 renderer，喂给 ChatPanel
- **5xx / 529 / 408 错误自动指数退避重试**（1s → 2s → 4s，最多 2 次），429 / 401 / 402 不重试，ToolPanel 显示当前重试计数
- **stream 错误与 tool 错误分离**：stream 错误触发整体 turn 重试，tool 错误走卡死检测
- **每次 Anthropic 调用结束把 usage 字段 + 计算出的 USD 成本写回 assistant 消息**，包含 `input_tokens` / `output_tokens` / `cache_creation_input_tokens` / `cache_read_input_tokens` / `cost_usd`
- **Cache 命中实时显示到 ToolPanel**：每次工具调用行带 `cache: read X / write Y / hit Z%`，turn 结束多一行本 turn 汇总

**规则：**
- MUST 使用流式（`stream: true`）让 UI 实时显示
- MUST 工具调用执行受 REQ-006 权限系统约束
- MUST 余额 / 401 / 403 / 5xx 区分错误码，UI 给具体文案
- MUST 主进程的 SDK 实例只读 API key from Electron safeStorage
- MUST prompt caching 命中显示到 ToolPanel（每工具调用一行 + 每 turn 一行汇总，**read 与 write 分开展示**）
- MUST USD 成本估算走实时计算：`cost = (input × $3 + output × $15 + cache_write × $3.75 + cache_read × $0.30) / 1_000_000`，按当前模型单价
- MUST 5xx / 529 / 408 触发指数退避重试（1s/2s/4s，最多 2 次）；429 不重试（防撞 rate limit）；401/402/403 立即报错
- MUST 重试期间 agentStatus 保持 `executing`；ToolPanel 显示 `重试 1/2` 文本
- MUST cost 持久化到 messages 表 5 个字段，session 累计实时计算

**输入：**
- 用户消息 / 项目当前状态 / skills 上下文
- API key（从 safeStorage 取）

**输出 / 结果：**
- 流式 text delta 到 ChatPanel
- 工具调用请求（tool_use）→ 工具执行 → 结果回写
- agentStatus 转 `streaming` → `executing` → `done`/`error`
- ToolPanel 实时显示 cache + 成本
- messages 表每条 assistant 消息持久化 5 个成本字段

**状态：**
- 闲置：`idle`
- 模型生成中：`streaming`
- 工具执行中：`executing`（含重试中）
- 完成：`done`
- 错误：`error`

**验收标准：**
- AC-001: Given 用户输入消息，when 模型 streaming，then ChatPanel 文本逐字出现，agentStatus 切 `streaming`。
- AC-002: Given 模型返回 `tool_use: write_file`，when 工具执行，then agentStatus 切 `executing`、PermissionPrompt 弹（如未授权）、ToolPanel 追加 1 条 + cache 行。
- AC-003: Given API 401，when 调用，then 状态切 `error`、ChatPanel 追加「API key 无效，去 Settings 重新配置」。401 不重试。
- AC-004（v1.0）: Given 模型第一次调用写入 5000 token cache，when 第二次调用同一 prompt，then ToolPanel 第二行显示 `cache: read 5.0k / write 0 / hit 100%`，session 累计 cost 只算 cache read 单价。
- AC-005（v1.0）: Given Anthropic 返回 500 错误，when stream 中断，then ToolPanel 显示 `重试 1/2`，间隔 1 秒；第二次仍 500 → `重试 2/2`，间隔 2 秒；第三次失败 → 切 error。**429 不重试，立即切 error + 显示「rate limit」**。
- AC-006（v1.0）: Given 一次对话产生 1 条 assistant 消息，when 流结束，then 该消息 messages 表行包含 `input_tokens=12000` / `output_tokens=850` / `cache_creation_input_tokens=5000` / `cache_read_input_tokens=0` / `cost_usd=0.050`（按公式计算）。

---

### REQ-004：内置 Goal 工作流模板（SCOPE-005）

**优先级：** P0  
**关联任务：** TASK-001  
**关联流程：** FLOW-001

**用途：**  
提供一份开箱即用的示例工作流，让用户不用从零写。完整工作流参照 [goal.rpcx.io](https://goal.rpcx.io/index_cn.html) 的 6+ 步闭环：/prd → /prd-to-spec → /to-issues → /goal → /review-it → /ship-it。

**行为：**  
- 在 `src/builtin-skills/goal-workflow/SKILL.md` 内置一份 goal 风格的 boot skill
- Skill 的 `description` 写明：「以 goal 六步法驱动 PR，从需求到交付」
- Skill 的 body 按章节依次描述每步：每个章节里再引用 sub-skill（如 /prd /goal /review-it 等）
- Skill 子文件夹里再放独立的 `prd/SKILL.md`、`goal/SKILL.md` 等 6+ 个 sub-skill（每个内置 skill 一个目录）

**规则：**
- MUST 把 6 个核心 sub-skill（/prd, /prd-to-spec, /to-issues, /goal, /review-it, /ship-it）全部内置
- SHOULD 至少再内置 3 个 bonus：/refactor, /note-it, /code-to-spec
- SHOULD 内置 skill 加 `allowed-tools` 字段限制外部工具（如 /ship-it 不允许直接 push）

**输入：** 用户对话意图（Agent 决定是否调用该 boot skill）

**输出 / 结果：**
- Agent 按章节推进对话流
- 每步产物（PRD 草案 / 代码 diff / review 报告）实时显示到 ChatPanel

**状态：**
- 默认闲置 / 启动后被显式触发

**验收标准：**
- AC-001: Given 用户输入「用 goal 工作流帮我加 user 表」，when Agent 处理，then 至少连续完成 /prd → /goal 两步并产出实际代码改动。
- AC-002: Given goal skill 内 `/ship-it`，when 模型尝试调用 git push，then PermissionPrompt 弹（不允许默认 push）。

---

### REQ-005：Electron 多窗口 + 多项目 Tab（SCOPE-001 + SCOPE-011）

**优先级：** P0  
**关联任务：** TASK-006

**用途：**  
支持用户同时管理多个项目，每个项目独立 tab 或独立窗口。

**行为：**  
- 主窗口用 `BrowserWindow`，菜单栏/快捷键/系统托盘统一
- 项目列表点击 → 切 tab（renderer 内单窗口多 tab）
- 用户从菜单 / 快捷键 / 拖拽触发「新建窗口」 → 独立 BrowserWindow，可拖到第二个屏幕
- 每个窗口独立会话（独立 messages、独立 SQLite session id）

**规则：**
- MUST 主进程持有所有 BrowserWindow 引用，关闭时统一清理
- MUST 切项目 tab 时只切 working dir + system prompt，不破坏对话历史
- SHOULD 支持「分离到新窗口」
- SHOULD 全局快捷键 ⌘⇧N（macOS）打开新窗口

**输入：** 用户菜单点击、快捷键、tab 切换

**输出 / 结果：**
- 窗口/tab 切换完成
- 状态栏切项目信息

**状态：**
- 默认单窗口
- 已打开 N 个窗口（macOS Dock 显示）

**验收标准：**
- AC-001: Given 当前有项目 A tab 打开，when 用户在菜单选「新建窗口」并选项目 B，then 第二个 BrowserWindow 出现，两个窗口可同时操作。
- AC-002: Given 主窗口关闭，when 所有窗口都关，then 应用退出（macOS 默认行为遵循，不强制）。

---

### REQ-006：本地文件系统 + 终端 + 权限（SCOPE-006 + SCOPE-007 + SCOPE-014）

**优先级：** P0  
**关联任务：** TASK-001  
**关联流程：** FLOW-001

**用途：**  
Agent 真实读写文件、跑命令，所有危险操作前弹 PermissionPrompt。

**行为：**  
- 工具集：
  - `read_file(path)` → `fs.readFileSync` 限项目根
  - `write_file(path, content)` → 校验路径在白名单 + 弹 PermissionPrompt
  - `exec(cmd, cwd)` → `child_process.exec` 或 node-pty，弹 PermissionPrompt
  - `list_dir(path)` → `fs.readdirSync`
  - `search_files(pattern)` → `glob`
- PermissionPrompt 三档：允许一次 / 始终允许 / 拒绝
- 始终允许的规则写入 SQLite（`permissions` 表）

**规则：**
- MUST 所有写操作前 PermissionPrompt（如规则已「始终允许」则跳过）
- MUST exec 前 PermissionPrompt
- MUST read 操作仅限 projectPath 及其子目录
- SHOULD 显示完整命令（不要截断，避免用户被骗）
- MUST 终端嵌入走 node-pty + xterm.js（不要 child_process 套 stdout）

**输入：** 模型工具调用请求

**输出 / 结果：**
- 文件 / 命令执行结果回写到对话
- PermissionPrompt 显示「Agent 想写 X / 跑 Y」+ 命令全文 + 路径全文

**状态：**
- 工具执行中：ToolPanel 状态 → `running`
- 等待用户授权：状态 → `awaiting-permission`
- 完成：状态 → `done`
- 拒绝：状态 → `rejected`，调用方模型收到拒答消息

**验收标准：**
- AC-001: Given 模型调用 `write_file`，when 用户第一次看到这个工具调用，then PermissionPrompt 出现并展示完整 path + content；用户点「允许一次」后写文件完成。
- AC-002: Given 用户选「始终允许 `npm test`」，when 模型再次调用 `npm test`，then 不弹 PermissionPrompt，直接执行。
- AC-003: Given 模型调 `read_file("/etc/passwd")`，when 文件路径在白名单外，then 工具被拒绝，ToolPanel 显示「拒绝：路径不在项目白名单」。

---

### REQ-007：系统托盘 + 通知中心 + 全局快捷键（SCOPE-012 + TASK-004 / TASK-005）

**优先级：** P0  
**关联任务：** TASK-004, TASK-005

**用途：**  
让 Agent 不抢编辑器窗口也能用——快速状态查看、低噪音通知、无焦点启动。

**行为：**  
- 系统托盘图标 + 菜单（启动/退出 + 当前项目状态摘要）
- 通知中心：Agent 完成 / 报错时调 macOS Notification
- 全局快捷键：
  - **⌘⇧A** 唤起主窗口并自动 focus 到 CommandInput（普通提问入口）
  - **⌘⇧T**（v1.0）切换到下一个 project tab（仅切焦点，不开新窗口）
  - **⌘⇧L**（v1.0）focus 主窗口 + focus CommandInput，不预填文本

**规则：**
- MUST 托盘图标跟随 agentStatus 变色（idle 灰 / executing 橙 / done 绿 / error 红）
- MUST 三个快捷键全部在 Settings 中可禁用（v0.1 已支持禁用，v1.0 全部接入）；不允许重绑（避免与系统冲突）
- SHOULD 通知不打扰：用户已 focus 主窗口时不发通知

**输入：** 快捷键、托盘菜单点击

**输出 / 结果：**
- 主窗口 focus
- 通知 banner
- 项目 tab 切换

**验收标准：**
- AC-001: Given agentStatus 从 `idle` 切 `executing`，when 状态变化，then 托盘图标换色（无需主窗口 focus）。
- AC-002（v1.0）: Given 当前在 project A tab，when 用户按 ⌘⇧T，then 主进程收到 `project:switch:next`，renderer 切到下一个 project tab 且 workingDir 同步更新；只有一个 project 时快捷键无效，不报错。
- AC-003（v1.0）: Given 主窗口未 focus，when 用户按 ⌘⇧L，then 主窗口置顶 + CommandInput 获得焦点，光标在输入框内，不预填任何文本。
- AC-004（v1.0）: Given Settings 取消勾选「启用 ⌘⇧T」，when 重启后按 ⌘⇧T，then 系统无响应（快捷键未注册），但 ⌘⇧A 和 ⌘⇧L 仍生效。

---

### REQ-008：React + Vite 渲染层 + DEMO_* 替换（SCOPE-008 + SCOPE-013 + SCOPE-015）

**优先级：** P0  
**关联任务：** TASK-001, TASK-006

**用途：**  
复用 react-vite/ 已写好的 7 个组件，把 DEMO_* 常量替换为真实 agent stream。

**行为：**  
- `App.jsx` 接主进程 IPC bridge（用 preload 暴露的 `window.nexus`）
- `ChatPanel.jsx`：订阅流式 text delta，渲染消息气泡
- `CommandInput.jsx`：用户输入回车 → IPC 推主进程 → 主进程发起新对话 turn
- `ToolPanel.jsx`：订阅 tool_use/tool_result 流，渲染工具调用时间线 + hasDiff 挂 DiffViewer
- `StatusIndicator.jsx`：按 agentStatus 切色
- `PermissionPrompt.jsx`：订阅主进程「等待权限」事件
- `SettingsModal.jsx`：API key / 全局快捷键 / 主题（dark/light/warm）
- `DiffViewer.jsx`：用 Monaco diff editor 展示模型写的代码

**规则：**
- MUST 把所有 DEMO_* 常量（DEMO_CONVERSATIONS / DEMO_MESSAGES / DEMO_TOOLS / DEMO_FILES / GITIGNORED / CONTEXT_FILES）替换为 IPC 真实数据
- MUST Zustand store 集中持有：currentProject / agentStatus / messages / pendingTools / permissions
- SHOULD Monaco 用只读 + diff 模式，避免破坏模型输出
- SHOULD 保留现有 CSS 变量主题系统（dark/light/warm）

**验收标准：**
- AC-001: Given 主进程 push 一条消息，when renderer 订阅到，then ChatPanel 出现一条用户/助手气泡，状态机同步切 `streaming` / `done`。
- AC-002: Given 模型返回 `tool_use: write_file`，when 工具执行前，then ToolPanel 追加 1 项，点开展开 diff 视图。

---

### REQ-009：SQLite 持久化 + 加密 API key（SCOPE-009）

**优先级：** P0

**用途：**  
项目列表、对话历史、设置、API key 的本地持久化。

**行为：**  
- 用 `better-sqlite3`（或 `sqlite3`），数据库文件 `~/Library/Application Support/Nexus/nexus.db`
- 表：
  - `projects(id, path, displayName, createdAt, lastOpenedAt)`
  - `sessions(id, projectId, createdAt, updatedAt)`
  - `messages(id, sessionId, role, content, toolUseId, createdAt, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, costUsd)`（v1.0 后 5 字段新增，见 migration `002_*`）
  - `permissions(id, projectId, rule, scope)`（scope: once / always）
  - `settings(key, value)`（theme / globalShortcutsDisabled / defaultModel / autoUpdateEnabled）
- API key 用 Electron `safeStorage`（用系统 Keychain / DPAPI 加密）→ SQLite 只存加密后的 blob

**规则：**
- MUST API key 加密，绝不存明文
- MUST 启动时校验 sqlite 文件可读，损坏则备份并新建
- SHOULD 对话历史定期 vacuum，防止无限增长

**验收标准：**
- AC-001: Given 用户配 API key 后退出应用，when 重启，then 设置页 API key 显示「已配置」不可见明文。

---

### AI 能力规格（每个 AI 功能必填）

| AI 功能 | 能力类型 | 质量条 | 触发方式 | 不确定时 | 服务降级 |
|---|---|---|---|---|---|
| Agent 对话流（Anthropic API） | Agent + 工具调用 | 90% 工具调用格式正确率（手动 spot check） | 自动（每次用户输入） | 返回说明 + 提示用户重新表述 | 切 `error` 状态，显示具体 API 错误码 |
| Skills 触发判断 | 文本理解 | 用户说「用 refactor」应触发 `refactor/SKILL.md` | 自动（模型基于 description 决定） | 调错 skill 时用户可手动指定 `/<skill-name>` | 提示「未匹配 skill，作为普通对话回复」 |
| 内置 goal 工作流编排 | Agent + 多步骤 | 6 步闭环完整跑通 1 次 | 自动（用户输入匹配 description） | 单步失败 → 提示用户决定是否继续 | 单步失败不阻断后续，回退到自由对话 |
| 流式文本生成 | 文本生成 | 首字延迟 < 1.5s（macOS Sonoma，本地网络） | 自动 | 显示部分结果 | 网络断 → 切错误态保留已生成文本 |

**AI 护栏（绝不能做）：**
- **绝不允许修改白名单外文件**——路径校验必须在主进程执行，不依赖 UI。
- **绝不允许「始终允许」规则静默扩展到危险操作**（如 `rm -rf`、push 到 main、`git reset --hard`）：PermissionPrompt 在用户设「始终允许」时必须明示范围，**不能一键白名单所有 exec**。
- **绝不允许把 API key 日志化**——主进程任何 logger 都必须 mask key。
- **绝不允许 skills 里写的 `allowed-tools` 被 UI 绕过**——主进程在执行工具前必须再次校验 skill 范围。
- **绝不允许内置 skill 调用 `git push` 到 main / master**——hard rule 在主进程。
- **绝不允许模型 free-form 给出「已删除 X 文件」却未真实删除**——所有 fs 操作在 IPC 返回真实成功/失败。

---

## 6. 数据模型

### 6.1 核心实体

| 实体 | 描述 | 关键字段 |
|---|---|---|
| Project | 一个被 Agent 加载的本地项目 | id, path, displayName, lastOpenedAt |
| Session | 一次连续对话，绑定一个项目 | id, projectId, createdAt, updatedAt |
| Message | 一条消息（用户/助手/工具调用/工具结果） | id, sessionId, role, content, toolUseId, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, costUsd |
| PermissionRule | 用户授权的工具调用规则 | id, projectId, rule（命令/路径模式）, scope（once/always/never） |
| Skill | 从 .claude/skills/ 加载的能力 | name（来自 frontmatter）, description, whenToUse, allowedTools, source（global/project）, path |
| Settings | KV 设置 | key, value（含加密的 API key blob / autoUpdateEnabled / theme / globalShortcutsDisabled） |

### 6.2 实体关系

| 关系 | 描述 |
|---|---|
| Session belongs to Project | 一个 session 只服务一个项目，项目切换创建新 session |
| Message belongs to Session | message 持久化以 session 为锚 |
| PermissionRule scoped to Project | 「始终允许」规则按项目区分 |
| Skill 内存对象 | 不入库，每次启动扫描重建 |

### 6.3 数据规则

- **创建**：用户添加项目 → 立即写 `projects`；用户发起对话 → 立即写 `sessions`；每条消息 → 写入 `messages`。
- **更新**：`projects.lastOpenedAt` 每次项目切回更新；`permissions` 写入 = 「始终允许」生效。
- **删除**（可建必可删）：
  - 项目列表支持「移除项目」（删除 `projects` 记录 + 提醒用户是否一并删除历史 sessions）
  - 对话历史支持「清空本会话」+「清空所有」+ 单条删除
  - 「始终允许」规则支持单条撤销（按 id）
  - 设置项支持「清空 API key」（删除 settings 中的加密 blob）
- **权限**：本应用为单用户本地应用，无多账号；`apiKey` 必须加密。
- **范围红线**：本 Spec 不引入 team / cloud / billing 任何字段。

---

## 7. 外部依赖

| 编号 | 依赖 | 用途 | 是否必需 | 备注 |
|---|---|---|---:|---|
| DEP-001 | `@anthropic-ai/sdk`（TypeScript SDK） | Agent 对话、工具调用、流式 | Yes | v0.1 看 npm 最新稳定版 |
| DEP-002 | Electron | 桌面壳 | Yes | v0.1 最新稳定 |
| DEP-003 | React + Vite | renderer UI | Yes | 复用现有 react-vite/ |
| DEP-004 | Zustand | renderer 状态管理 | Yes | 简单 store，替代 Context |
| DEP-005 | Monaco Editor | 代码 diff 展示 | Yes | 用 `monaco-editor` 或 `@monaco-editor/react` |
| DEP-006 | node-pty + xterm.js | 真终端嵌入 | Yes | `node-pty` 需要 native rebuild，electron-builder 配置 |
| DEP-007 | better-sqlite3 | 本地数据库 | Yes | 同步 API，比 sqlite3 简单 |
| DEP-008 | framer-motion | 现有 react-vite/ 已用 | Yes | 沿用 |
| DEP-009 | tailwindcss + CSS 变量 | 现有主题系统 | Yes | 沿用 |
| DEP-010 | Electron `safeStorage` | API key 加密 | Yes | 系统 Keychain 集成 |
| DEP-011 | Claude Code skill 规范（`~/.claude/skills/<name>/SKILL.md`） | 加载 SKILL.md | Yes | frontmatter：`name`、`description`、`when_to_use`、`allowed-tools` |
| DEP-012 | `[goal.rpcx.io](https://goal.rpcx.io/index_cn.html)` 工作流定义 | 内置 boot skill 蓝本 | Yes | 6+ 步：/prd → /prd-to-spec → /to-issues → /goal → /review-it → /ship-it |

---

## 8. 非功能需求

| 类别 | 要求 | 优先级 |
|---|---|---|
| 性能 | 流式首字延迟 < 1.5s（macOS Sonoma 本地网络） | P0 |
| 性能 | 启动到首屏 < 2s（不含 SDK 加载） | **OUT-011**（v1.0 主动砍） |
| 安全 | API key 用 `safeStorage` 加密，**禁止明文落盘** | P0 |
| 安全 | 所有 fs 操作走主进程 IPC，renderer 不直访问 | P0 |
| 安全 | `git push` 到 main / master 必须人工确认，不可被允许规则放行 | P0 |
| 隐私 | 不上传任何用户代码或对话历史到第三方（仅发到 Anthropic API） | P0 |
| 兼容性 | macOS Sonoma 14.0+ 原生跑 | P0 |
| 兼容性 | macOS 打包格式：`.dmg` / `.app` + `electron-updater` 自动更新 | P0（v1.0 新增） |
| 兼容性 | Win / Linux 不在本版本交付，但代码层不强制 macOS-only API | P2 |
| 可靠性 | Anthropic 5xx / 529 / 408 自动指数退避重试（1s/2s/4s，最多 2 次）；429 不重试 | P0 |
| 可靠性 | 工具调用失败不破坏主对话流 | P0 |
| 可靠性 | Agent 卡死 / 循环检测：同 tool_use id 连续 3 次错误 / 5 次无 tool progress / 60s 无 tool_result → 切 error + 报告 | P0（v1.0 强化） |
| 可观测性 | 主进程日志到 `~/Library/Application Support/Nexus/logs/`，含 API 调用 model / tokens / cache hit / 错误码，**API key 必须 mask** | P0 |
| 测试 | 4 类核心单测全绿（safeStorage 加密 round-trip / pathGuard 越界 5 case / dangerous 命令 6 case / cost 公式 3 case） | P0（v1.0 新增） |
| 可访问性 | 键盘可达所有核心操作（CommandInput / ToolPanel / PermissionPrompt） | P1 |

---

## 9. 完成定义

### v1.0 完成条件（必须全绿）

- [ ] SCOPE-001 ~ SCOPE-018 全部 P0 已实现（§2.1）
- [ ] REQ-001 ~ REQ-009 全部 AC 验证通过，包括 v1.0 新增 AC-004/005/006（REQ-003）、AC-002/003/004（REQ-007）
- [ ] FLOW-001 端到端可走完（§4）
- [ ] 内置 goal boot skill 可加载，6 个 sub-skill 至少 /prd + /goal 跑通
- [ ] 在 macOS Sonoma 14+ 原生启动 + Electron 打包成功（`out/Nexus Agent-1.0.0.dmg`）
- [ ] `electron-updater` 接 GitHub Releases：`https://github.com/sword-demon/nexus/releases`，默认启用，Settings 可关
- [ ] 4 类核心单测全绿：safeStorage 加密 round-trip / pathGuard 越界 5 case / dangerous 命令 6 case / cost 公式 3 case
- [ ] `npm run electron:build` + `npm run build:mac` 双双通过
- [ ] `npm run tsc:check` 三层（main / preload / renderer）全绿
- [ ] messages 表新增 5 字段的 migration `002_*` 执行成功，老用户启动自动迁移
- [ ] vite build 无 error

### v0.1 完成条件（已达成，存档）

- [x] v0.1 SCOPE-001 ~ SCOPE-015 全部 P0 已实现
- [x] REQ-001 ~ REQ-009 v0.1 AC 全通过
- [x] FLOW-001 端到端可走完
- [x] 内置 goal boot skill 可加载，6 个 sub-skill 至少 /prd + /goal 跑通
- [x] 在 macOS 26.5.1 原生启动 + Electron 打包成功（`out/Nexus Agent-0.1.0.dmg`，136M）
- [x] 跑通用户验收硬指标三项
- [x] vite build 无 error

---

## 10. 假设与待确认问题

### 10.1 假设

| 编号 | 假设 | 假设依据 | 错误风险 |
|---|---|---|---|
| ASM-001 | 用户能拿到 Anthropic API key 并接受 BYO 模式 | 用户本身就是 Cursor/Qoder/Claude Code 重度用户，必然已有 | 用户不愿为 API key 单独付 token 费 → 必须兼容 OpenAI Compatible 也行，但 v0.1 不做 UI |
| ASM-002 | 用户接受「订阅墙绕过」定位，但仍遵守 Anthropic 服务条款 | 用户用现成付费工具，对费用敏感 | 低风险，Anthropic ToS 允许第三方客户端 |
| ASM-003 | Claude Code SKILL.md frontmatter 格式稳定（`name` / `description` / `when_to_use` / `allowed-tools`） | 搜索到的多份教程一致；项目根 `.claude/skills/` 已存在 | 升级到 Claude Code 新版格式可能 break → 解析失败仅记录日志，不阻断 |
| ASM-004 | macOS 用户愿意授权 Electron 文件访问（首次启动系统会弹） | macOS 通用做法 | 用户拒授权 → 退化为「只能读，写需手动复制」 |
| ASM-005 | node-pty 在 Electron + electron-builder 上能正常 rebuild | 社区常见组合 | rebuild 失败 → 退化为 `child_process` 套 stdout |
| ASM-006 | 用户能接受 v0.1 只支持 macOS | 用户明示 | Win/Linux 用户拿不到 → 暂不发布，代码层避免 macOS-only API |

### 10.2 待确认问题

| 编号 | 问题 | 是否阻塞 | 备注 |
|---|---|---:|---|
| Q-001 | 产品名称是否就用 **Nexus Agent**？仓库目录叫 nexus，但「Nexus Agent」还是「Nexus Coding」或别的 | No | [主 Agent 决断] 默认 Nexus Agent，dev-planner / design-brief 阶段可改 |
| Q-002 | 内置 sub-skill 是用项目级 `.claude/skills/nexus-builtin/` 还是打到 `~/Library/Application Support/Nexus/skills/` | No | [主 Agent 决断] 默认打到 `~/Library/Application Support/Nexus/skills/`，跟用户文件分开 |
| Q-003 | 是否要 Plan Mode 按钮（让 Agent 先出方案再实现） | No | v0.1 用自然对话（用户问「先 plan 一下」Agent 走对应 skill）→ 暂不做专用按钮 |
| Q-004 | 是否支持 OpenAI / OpenRouter 等 Anthropic Compatible API | No | v0.1 严守 Anthropic，OpenAI 兼容留作 P2；用户可在 Settings 直接改 baseURL 但不保证能跑 |
| Q-005 | react-vite/ 的样式系统（CSS 变量主题 dark/light/warm）是否保留 | No | [主 Agent 决断] 保留，对外展示效果一致 |
| Q-006（v1.0）| 自动更新通道是 GitHub Releases 还是自建服务器？ | No | 用户已确认 GitHub Releases（`https://github.com/sword-demon/nexus/releases`） |
| Q-007（v1.0）| v1.0 是否做干净 macOS Sonoma 14+ 手测验收？ | No | 用户已确认 v1.0 不强制，feature 全做完后再手动跑 MVP_TEST.md |
| Q-008（v1.0）| 成本显示币种 | No | 用户已确认 v1.0 仅 USD，多币种留 v1.1（OUT-012） |

### 10.3 v1.0 主动砍掉的 v0.1 P1 残留（含依据）

| 编号 | v0.1 P1 项 | 砍掉理由 | 后续路径 |
|---|---|---|---|
| P1-B | sub-agent 能力评估 | 评估本身就要 1-2 周；接入要 PDF / sandbox / 联网下载，复杂度爆炸 | 留 OUT-010，等用户明确提需求再开 |
| P1-D | Monaco 编辑能力 | 动 4+ 文件 + 持久化 + 撤销栈，工作量大；用户主用 DiffViewer 看 diff，编辑需求弱 | 留 OUT-009，v1.1 再评估 |
| P1-E | 启动到首屏 < 2s | Electron + native rebuild + Monaco bundle 物理上不可能 2s，强行做要重写启动流程 | 留 OUT-011，永不做（接受现状） |
| P1-F | 键盘可达所有核心操作 | v1.0 时间窗不够补系统化验收，spec 写明 P1 | v1.1 跟可访问性专项一起做 |
| P1-G | Settings「导出最近 50 轮对话」JSON | 低频功能，bug report 场景手动复制即可 | v1.1 评估 |

---

## 11. Agent 系统规格

### 11.1 自主性与人在回路

| 动作类别 | 自主级别 | 审批 / 回滚 |
|---|---|---|
| `read_file`（白名单内） | 自动 | 无 |
| `list_dir` / `search_files` | 自动 | 无 |
| `write_file` | **建议确认** | PermissionPrompt 弹「允许一次 / 始终允许 / 拒绝」；支持 git 自动 commit 但写后回显 diff |
| `exec`（白名单内） | **建议确认** | PermissionPrompt 弹 + 显示完整 cmd；「始终允许」必须按命令前缀精确匹配，不允许 `*` 通配放行所有 |
| exec 特定危险操作：`git push`、`rm -rf`、`git reset --hard`、`chmod 777`、`sudo` | **必须人工** | 不允许「始终允许」硬规则 |
| 切项目 / 删项目 / 清空对话 | 必须人工 | UI 确认弹窗，Undo 不支持但保留二次确认 |
| 调 Anthropic API | 自动 | 无（API key 已授权则视为已同意计费） |

### 11.2 工具与能力集

| 工具 / 能力 | 用途 | 权限级别 | 扩展机制 |
|---|---|---|---|
| `read_file(path)` | 读项目文件 | 读 | REQ-006 路径校验 |
| `write_file(path, content)` | 写文件 | 写 | REQ-006 PermissionPrompt |
| `list_dir(path)` | 列目录 | 读 | 无 |
| `search_files(pattern)` | glob 搜 | 读 | 无 |
| `exec(cmd, cwd)` | 跑命令 | 执行 | REQ-006 PermissionPrompt |
| 内置 skill：/prd /prd-to-spec /to-issues /goal /review-it /ship-it /refactor /note-it /code-to-spec | 工作流 6+ 步 + bonus | 与父 skill `allowed-tools` 限定一致 | SKILL.md frontmatter |
| MCP（实验性，预留接口） | 扩展外部工具 | 读 / 写 / 执行按 server config | 标准 MCP 协议；v0.1 仅支持 1 个 server |

### 11.3 上下文与记忆

- **单任务上下文上限**：Claude Sonnet 4.6 默认 200K，按 prompt caching 把 CLAUDE.md + AGENTS.md + skills 全文置顶并锁定 cache control；session 内消息到 80% 上限触发压缩（前 70% 摘要 + 后 30% 原文）。
- **跨会话记忆**：每个 session 独立 SQLite 记录；项目级「跨 session 记忆」v1.0 仍关闭（避免跨会话累积 prompt 膨胀），写入项目根 `/.nexus/memory/` 路径预留但默认关闭，Settings 不提供开关。
- **全局 skill 池**：用户级 `~/.claude/skills/` 永远加载；项目级 `.claude/skills/` 覆盖同名；新 skill 文件改后 5 分钟内重新加载。

### 11.4 编排与多 agent

- **单 agent 主线**：v1.0 仍不拆 sub-agent；所有对话 1 个 Anthropic SDK client 跑 loop
- **sub-agent 状态**：v0.1 的「P1 评估」项主动砍掉（见 OUT-010），理由：要接 sub-agent 会引入 PDF / sandbox / 联网下载，复杂度爆炸，独立大型 phase；如未来用户明确要求，重新评估
- **orchestration**：tool_use → 工具执行 → tool_result 回写，循环直到模型返回 `end_turn`

### 11.5 评估与可观测（Eval）

- **评估方式（v1.0）**：4 类核心单测 + 现有 smoke 脚本（phase14-mvp-smoke 等）
  - 单测范围：safeStorage 加密 round-trip / pathGuard 越界 5 case / dangerous 命令 6 case / cost 公式 3 case
  - E2E / Playwright：**v1.0 不引入**（项目未配 Playwright，留 v1.1 评估）
  - 手动验证：FLOW-001 端到端 + 5 个 SCOPE-017 子项手动 spot check
- **可观测**：主进程日志到 `~/Library/Application Support/Nexus/logs/`，内容包括：每次 API 调用的 model、input tokens、output tokens、cache hit、错误码、重试计数；**API key 必须 mask，不允许日志化任何明文**
- **质量退化**：用户在 Settings 可一键「导出最近 50 轮对话」（JSON）用于 bug report（v1.0 仍 P1 残留，未实现）

### 11.6 成本与预算

- **单任务成本上限（v1.0）**：ToolPanel 顶部**强制**显示 Session 累计 USD 成本，按 Anthropic 官方单价实时计算：`cost = (input_tokens × model.input + output_tokens × model.output + cache_creation_tokens × model.cache_5m + cache_read_tokens × model.cache_read) / 1_000_000`
- **当前模型单价表（2026-07-05 官方报价）**：

| 模型 | input $/MTok | output $/MTok | 5m cache write $/MTok | cache read $/MTok |
|---|---|---|---|---|
| Claude Sonnet 4.6 | 3.00 | 15.00 | 3.75 | 0.30 |
| Claude Sonnet 5 | 3.00 | 15.00（9/1/2026 前 2/10） | 3.75 | 0.30 |
| Claude Haiku 4.5 | 1.00 | 5.00 | 1.25 | 0.10 |
| Claude Opus 4.8 | 5.00 | 25.00 | 6.25 | 0.50 |
| Claude Fable 5 | 10.00 | 50.00 | 12.50 | 1.00 |

- **熔断**：v1.0 不强制单任务上限，**但 assistant 消息气泡点击展开后能看到本条成本**，用户可手动停
- **多币种**：v1.0 严守 USD，本地货币换算 + 离线汇率缓存留 OUT-012，v1.1 再评估
- **持久化**：每条 assistant 消息写入 `messages` 表 5 字段（`input_tokens` / `output_tokens` / `cache_creation_tokens` / `cache_read_tokens` / `cost_usd`），session 累计 = 该 session 所有 assistant 消息 cost_usd 之和
- **模型路由**：单一模型（默认 Sonnet 4.6），用户可在 Settings 切 Haiku 4.5 / Opus 4.8 / Fable 5；不允许按任务自动路由

### 11.7 失败与卡死

- **5xx / 529 / 408 重试**：stream 中断时指数退避 1s → 2s → 4s，最多 2 次；ToolPanel 显示「重试 N/2」；3 次仍失败切 error + 报告
- **429 不重试**：立即切 error + ToolPanel 显「rate limit」，避免撞穿 limit
- **401 / 402 / 403 立即报错**：不回退、不重试，回 Settings 改 key / 充值
- **stream 错误 vs tool 错误**：
  - **stream 错误**（网络 / SDK 异常 / 5xx）：整 turn 重试
  - **tool 错误**（权限拒绝 / 命令失败 / 路径越界）：不重试，按卡死检测处理
- **卡死检测（v1.0 强化）**：
  - **同 tool_use id 连续 3 次错误**（session 内累积，无时间窗口，session 重启清零）→ 切 error
  - **连续 5 次无 tool progress**（tool_use 没有对应 tool_result，或文本未推进）→ 弹「是否继续？」
  - **60s 内无 tool_result 响应**（已发出 tool_use 60s 未回）→ ToolPanel 警告「agent 卡死？」
- **交回人的条件**：
  - 401/402/403 → 配置问题，回 Settings
  - 429 → rate limit，提示等 1 分钟
  - 同 tool_use id 错误 3 次 → 报告错误详情
  - 用户主动按 Esc / 输入「stop」
  - 应用关闭 / 系统休眠

### 11.8 会话与状态

- **中断恢复**：当前对话流可被「停止」按钮中断；中断后 messages 已落库（含 5 字段成本数据），重启应用可继续（session 列表页点击恢复）
- **历史 / transcript**：本地 SQLite 全留；不支持跨设备同步；用户可导出 / 删除单条 / 删除整 session
- **session 累计成本**：每次 app 启动渲染 session 列表时，按当前模型单价实时计算所有 assistant 消息 `cost_usd` 之和（即便历史 session 用别的模型，也按用户当前选的模型回算，作为粗略估算）

---

## 写作备忘

- [主 Agent 决断] 标注了三处：产品名 Q-001、内置 skill 路径 Q-002、保留 react-vite/ 主题 Q-005。这些是用户未答但开发必须决断的点，进 design-brief / dev-planner 时若用户提出，按用户改；否则维持默认。
- 编号 ID（TASK / FLOW / REQ / SCOPE / OUT / DEP / ASM / Q）在 design-brief.md / DEV-PLAN.md 跨文档对齐。
- 内置 goal skill 的代码层产物在 Phase 2 写；本 Spec 只锁范围、行为、验收，不锁实现细节。
