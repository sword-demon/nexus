# 变更记录

## [v1.0] - 2026-07-05

### 新增

- **SCOPE-016** `electron-updater` 自动更新（GitHub Releases，默认开，Settings 可关）
- **SCOPE-017** v0.1 P1 体验包，全部从 P1 升级到 P0：cache 显示 / 成本估算 / 5xx 重试 / 卡死检测 / 快捷键 ⌘⇧T ⌘⇧L
- **SCOPE-018** 核心 4 类单测（safeStorage / pathGuard / dangerous / cost）
- **REQ-003 v1.0 新增 AC-004/005/006**：cache hit 显示 / 5xx 重试 / messages 表 5 字段成本持久化
- **REQ-007 v1.0 新增 AC-002/003/004**：⌘⇧T 切 tab / ⌘⇧L focus / 快捷键可禁用
- **§1.5** v1.0 成功标准（cache 显示 / 重试 / 卡死 / 单测 / 自动更新）
- **§11.6 v1.0 成本与预算**：Anthropic 官方单价表（Sonnet 4.6 / Sonnet 5 / Haiku 4.5 / Opus 4.8 / Fable 5）+ cost 公式 `cost = (input × input_price + output × output_price + cache_creation × cache_5m_price + cache_read × cache_read_price) / 1_000_000` + assistant 消息点击展开看本条成本 + 不强制单任务熔断
- **§11.7 v1.0 卡死检测 3 规则**：同 tool_use id 连续 3 次错误 / 连续 5 次无 tool progress / 60s 无 tool_result
- **§11.8** session 列表累计成本回算（历史 session 按当前模型单价粗算）
- **§10.3** v1.0 主动砍掉的 v0.1 P1 残留及依据（P1-B/E/D/F/G）

### 修改

- **§1.5 成功标准**：v0.1 已有 5 项标 `[版本 v0.1]`，新增 v1.0 6 项标 `[版本 v1.0]`
- **§2.1 范围**：版本 v0.1 → v1.0；新增 SCOPE-016/017/018；SCOPE-005/008 备注更新到已达成
- **§2.2 OUT-005** 自动更新 → 从 OUT 移走，进 SCOPE-016
- **§2.2 新增** OUT-009 Monaco 编辑能力 / OUT-010 sub-agent / OUT-011 启动 < 2s / OUT-012 多币种（v1.0 主动砍掉项进 OUT）
- **§5 REQ-003**：prompt caching `SHOULD 显示到 ToolPanel` → `MUST 显示`；新增 5xx/529/408 重试规则 + cost 字段 + read/write 分开 + USD 单价硬公式
- **§5 REQ-007**：快捷键列表补 ⌘⇧T（切 tab）+ ⌘⇧L（focus）；新增 3 个 v1.0 AC
- **§6 messages 表字段**：`messages(id, sessionId, role, content, toolUseId, createdAt, updatedAt)` → 加 5 字段 `inputTokens` / `outputTokens` / `cacheCreationTokens` / `cacheReadTokens` / `costUsd`，需 migration `002_*`
- **§6.1 Message 实体**：关键字段 6 个 → 11 个
- **§6.1 Settings 实体**：key 列表加 `autoUpdateEnabled`
- **§8 非功能-可靠性**：原单行「Anthropic 5xx 自动重试」 → 升级为 4 行硬规则，明确错误集（5xx/529/408 重试；429/401/402/403 不重试）+ backoff 时长（1s/2s/4s）
- **§8 非功能-可靠性**：新增「Agent 卡死 / 循环检测」P0 强化行
- **§8 非功能-可观测性**：原 1 行 → 升级 2 行，加「API key 必须 mask」硬规则
- **§8 非功能-测试**：新增 4 类核心单测 P0 行
- **§8 非功能-兼容性**：原 2 行 → 升级 3 行，加 `.dmg + electron-updater`
- **§9 完成定义**：原 MVP 7 项保留存档为 v0.1 [x]；新增 v1.0 完成条件 11 项 [ ]，含 4 类单测 + migration + tsc 三层 + autoUpdate
- **§11.3 跨会话记忆**：v0.1 文案 → 改为 v1.0 仍关闭，明确 Settings 不提供开关
- **§11.4 sub-agent**：v0.1「P1 评估」 → v1.0 主动砍掉，加 OUT-010 引用
- **§11.5 评估与可观测**：v0.1「v0.1 不做正式测试集」 → v1.0 加 4 类核心单测；E2E/Playwright 明确 OUT 留 v1.1
- **§11.6 成本与预算**：v0.1 单行 → v1.0 强制显示 + 5 字段持久化 + 模型单价表
- **§11.7 失败与卡死**：v0.1「5 次无进展」 + 「工具失败 3 次」 → v1.0 拆分为 stream 错误重试 / tool 错误卡死检测两条
- **§10.2 待确认**：新增 Q-006/Q-007/Q-008（GitHub Releases / macOS 手测 / USD 单币种）

### 删除

- **§2.2 OUT-005** 自动更新（移至 SCOPE-016 P0）
- **v0.1 §11.6 成本与预算单行**（原 v0.1 文案，已被 §11.6 v1.0 版本替代）
- **v0.1 §11.7 失败与卡死单行**（原 v0.1 文案，已被 §11.7 v1.0 版本替代）

### 数据模型变更

- **新增 migration `002_*`**：`messages` 表加 5 列 `input_tokens` / `output_tokens` / `cache_creation_tokens` / `cache_read_tokens` / `cost_usd`；`settings` 表加 `autoUpdateEnabled` 键
- **DAO 层动**：`messages.ts` CRUD 全部更新签名，新增 `messages.ts` cost 计算 helper
- **从 v0.1 → v1.0 的迁移**：老用户启动时 SQLite 迁移自动跑（`ALTER TABLE messages ADD COLUMN` × 5），不丢历史

---

## [v0.1] - 2026-07-02
- 初始版本：从零访谈产出，定位为「基于 Electron 的桌面 AI Coding Agent，复用 Claude Code Skills 规范，主打订阅墙绕开 + 项目级工作流」
- 产品名称占位：Nexus Agent（[主 Agent 决断]，可改）
- 范围：
  - In（P0）：Electron + TS + React + Vite + Anthropic TS SDK + SQLite + Zustand + Monaco + node-pty/xterm.js
  - In（P1）：多项目 tab + 多窗口 + 系统托盘 + 通知中心 + 全局快捷键
  - Out：账号系统 / 云同步 / 团队协作 / 远程终端 / 内置 workflow DSL / 多模型路由 / Win & Linux 适配 / 自动更新
- 用户任务：6 条（TASK-001 ~ TASK-006），全部围绕「独立开发者用 Skills + AGENTS.md/CLAUDE.md 驱动 Agent」
- 用户流程：FLOW-001 端到端 MVP 路径（添加项目 → 加载 Skills → 跑内置 goal 工作流 → 改文件 → npm test 全绿）
- 功能需求：9 条（REQ-001 ~ REQ-009），覆盖项目管理 / Skills 加载 / Agent Loop / 内置 goal / 多窗口 / 权限 / 系统集成 / 渲染层 / 持久化
- AI 能力规格：4 项（Agent 对话流 / Skills 触发 / Goal 工作流 / 流式文本生成），护栏明列 6 条「绝不能做」
- Agent 系统规格：自主性与人在回路、工具集、上下文、编排、可观测、成本、失败兜底、会话恢复均已写
- 外部依赖 12 项（DEP-001 ~ DEP-012）
- 假设 6 条 + 待确认问题 5 条
