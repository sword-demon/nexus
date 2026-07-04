# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目结构

整个仓库只有一个可运行项目：`react-vite/`（AI Agent UI 原型）。所有开发命令都在 `react-vite/` 下执行。

```
react-vite/
├── index.html                # 入口 HTML，挂载 <div id="root">
├── vite.config.js            # Vite 配置 + 路径别名 @ → ./src
├── tailwind.config.js        # Tailwind 扩展（celadon / redorange 色板，seed-* 动画）
├── postcss.config.js
├── components.json           # shadcn/ui 元数据（已配置 ui 别名）
└── src/
    ├── main.jsx              # ReactDOM.createRoot 挂载入口
    ├── App.jsx               # 顶层布局 + 全局状态 + 主题切换
    ├── styles.css            # 全局样式 + Seed Design Tokens（CSS 变量）
    ├── lib/
    │   ├── utils.js          # cn() — clsx + tailwind-merge
    │   └── syntax-highlight.jsx
    └── components/
        ├── ui/               # shadcn 风格基础组件（button.jsx、tooltip.jsx）
        ├── ChatPanel.jsx
        ├── CommandInput.jsx
        ├── ToolPanel.jsx
        ├── SettingsModal.jsx
        ├── PermissionPrompt.jsx
        ├── StatusIndicator.jsx
        └── DiffViewer.jsx
```

## 常用命令

```bash
cd react-vite

npm install                  # 安装依赖
npm run dev                  # 启动 Vite dev server（默认 5173）
npm run build                # 生产构建到 dist/
npm run preview              # 本地预览构建产物
```

无 lint / test 脚本（`package.json` 仅 dev/build/preview）。`vite build` 会暴露编译错误，是当前唯一可用的静态校验手段。

无单测覆盖。如需为某个组件加单测，倾向于引入 `vitest` + `@testing-library/react`，但应先与团队确认（本仓库目前未配测试栈）。

## 架构（大局）

**单页面 React 应用**，没有路由、没有后端、没有状态库。当前是 **UI 原型/演示**，所有数据都是模块顶部定义的 `DEMO_*` 常量（`App.jsx` 中的 `DEMO_CONVERSATIONS`、`CONTEXT_FILES`；`ChatPanel.jsx` 中的 `DEMO_MESSAGES`；`CommandInput.jsx` 中的 `DEMO_FILES`/`GITIGNORED`；`ToolPanel.jsx` 中的 `DEMO_TOOLS`）。

### 顶层布局（`App.jsx`）

三栏布局 + 模态框：

```
<Sidebar> | <main>
              ├─ <TopBar> (含 <StatusIndicator>)
              ├─ <ChatPanel>
              ├─ <PermissionPrompt> (条件渲染)
              └─ <CommandInput>
          | <ToolPanel>  | <SettingsModal>
```

`App.jsx` 是 **唯一的全局状态持有者**，没有用 Context/Redux/Zustand。状态包括：
- `toolPanelOpen` — 右侧 ToolPanel 开关
- `agentStatus` — `idle | thinking | executing | streaming | done | error`，被 ChatPanel / StatusIndicator / CommandInput 共用
- `settingsOpen` — 设置弹窗
- `sidebarCollapsed` — 侧边栏折叠
- `permissionRequest` — 工具调用前的权限请求对象
- `currentTheme` — 主题预设键（`dark | light | warm`），由 `useEffect` 写入 CSS 变量到 `document.documentElement`

主题由 `THEME_PRESETS` 控制 7 个 `--seed-*` CSS 变量；派生变量（`--color-bg-elevated` 等）在 `styles.css` 通过 `color-mix()` 计算。**改主题必须同时考虑 seed 与派生 token**。

`App.jsx` 中有一段 4s 周期的 `setInterval`，用于演示状态机循环，并在 `executing` 时弹一个伪造的 `PermissionPrompt`。

### 设计系统 / 样式约定

- **所有颜色走 CSS 变量**，不要硬编码 hex。变量前缀：`--seed-*`（由主题控制）和 `--color-*`（派生/语义）。
- **Tailwind 调色板** `celadon` / `redorange` 在 `tailwind.config.js` 中定义，仅用于填充色阶；运行时 UI 应当用 `var(--seed-*)` 而非色阶 key。
- 路径别名 `@` 指向 `src/`（见 `vite.config.js`）。`shadcn` 风格，UI 组件位于 `src/components/ui/`。
- 全局类合并器：`cn()` from `@/lib/utils` = `clsx` + `tailwind-merge`，覆盖顺序按 tailwind-merge 解决。
- 动效统一走 framer-motion（`motion.*` + `AnimatePresence`）。
- 全局 keyframes（`breathe`、`pulse-soft`、`slide-in-right` 等）在 `tailwind.config.js` 注册，使用 `animate-breathe` 这类 Tailwind 工具类。

### 组件角色一览

| 组件 | 职责 |
|---|---|
| `Sidebar` | 内嵌在 `App.jsx` 的折叠侧边栏，对话列表 / 上下文文件切换 |
| `ChatPanel` | 消息流；`DEMO_MESSAGES` 中的代码块由 `@/lib/syntax-highlight` 渲染 |
| `CommandInput` | 输入框 + `@` 触发的 `FileSelector`（键盘上下/Enter 选择，含 .gitignore 过滤） |
| `ToolPanel` | 工具调用时间线，可展开项；`hasDiff` 项挂载 `<DiffViewer>` |
| `DiffViewer` | 代码 diff 渲染 |
| `StatusIndicator` | 状态点 + 呼吸光晕，由 `agentStatus` 驱动 |
| `PermissionPrompt` | 工具调用前的人工确认弹窗 |
| `SettingsModal` | 主题切换（dark / light / warm） |

### 状态机

`agentStatus` 的合法值与默认颜色见 `StatusIndicator.jsx` 顶部的 `STATUS_CONFIG`。**改状态语义时同时更新 `App.jsx` 的 `setInterval` 循环、`handleSend` 的 setTimeout 序列、以及 `StatusIndicator` 的 config 表**，否则动画/颜色会不一致。

### 注意

- 仓库根 `dist/` 不存在；构建产物在 `react-vite/dist/`。
- `index.html` 在 `<div id="root">` 上预渲染了 `<main>`（含 `data-component` / `data-od-id` 属性），这是 SSR 占位风格，React 挂载会覆盖。
- 多数组件接收 `...qoderProps` 并把 `data-qoder-id` / `data-qoder-source` / `data-od-id` 透传到根节点 —— 这是外部 IDE 跟踪用的，**不要删**。
- 项目没有 `.env`、没有后端、没有持久化，所有交互都是组件内部状态。