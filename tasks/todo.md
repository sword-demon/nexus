# DEV-PLAN v0.1 写作规划

## 目标
按 dev-planner 模板生成 `nexus/DEV-PLAN.md`，落 `nexus/DEV-PLAN.md`。

## 约束（已锁，不重新问用户）
- 项目位置：暂名 `nexus-agent/`，与 react-vite/ 平级
- 技术栈已锁：Electron + TS + React + Vite + Anthropic TS SDK + SQLite(better-sqlite3) + Zustand + Monaco + node-pty/xterm.js + framer-motion（沿用）
- 形态已锁：Electron 桌面客户端，macOS 优先，多窗口 + 多 tab
- 复用 react-vite/ 现有 UI 组件壳子
- 复用 Claude Code SKILL.md 规范
- 内置 goal 6 步工作流模板

## 关键风险（前置验证）
- node-pty 在 Electron + electron-builder 上的 native rebuild（macOS Sonoma）
- better-sqlite3 在 Electron 主进程的 native 模块兼容性
- Monaco + xterm.js 在 Electron renderer 进程的真彩与字体配置
- @anthropic-ai/sdk 提示缓存与 tool_use 现行 API

## Phase 拆分策略
1. 骨架层（地基）：Electron 项目 + 目录结构 + TypeScript + Vite + 现有 react-vite 集成
2. 数据层：SQLite + 实体表 + 持久化
3. 核心域：Skills / CLAUDE.md / AGENTS.md 加载器
4. Agent Loop：Anthropic SDK + 流式 + tool_use + prompt caching
5. 工具集：read / write / list / search / exec（node-pty）
6. 终端嵌入：xterm.js + node-pty 桥
7. 权限系统：PermissionPrompt（3 档）+ 「始终允许」规则 + 危险动作拦截
8. UI 壳子真接通：DEMO_* 替换为 IPC 真实 stream + Zustand store
9. 工作流模板：内置 goal 6 sub-skill + boot skill
10. 系统集成：多窗口 / 多 tab / 系统托盘 / 通知中心 / 全局快捷键
11. Monaco 集成：DiffViewer 真接通
12. 持久化 + 数据管理：API key 加密（safeStorage）+ 清空对话
13. 打包与验收：electron-builder + .dmg + 跑通 MVP 验收硬指标

## 自检（写 DEV-PLAN 时遵守）
- [ ] Phase ≤ 13，每个有交付清单（≤ 5 项）+ 关键文件 + 验收标准
- [ ] 无 TBD / 待补充 / 类似 Phase N 占位
- [ ] 技术栈版本经 WebSearch 验证（写实际版本号）
- [ ] 数据库表分到具体 Phase
- [ ] 用户原话 MVP 验收硬指标：「能跑通 1 份示例 workflow、能看到 agent 工具调用过程、能改 1 个文件后跑 npm test 全绿」落在最后一个 Phase 或完成定义
- [ ] 现有 react-vite/ 组件在 Phase 8 出现，明示迁移方式

## 自驱原则
- 不再问用户（所有决策已锁）
- 技术栈版本必须 WebSearch 实时查
- 不替 dev-builder 决定函数签名 / CSS 方案
- 写完直接报告，不写散文

## 下一步
- 写 DEV-PLAN.md 后引导用户进 /dev-builder（按 Phase 走，按 [开发测试规则] 四步走）
