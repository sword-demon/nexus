# 设计规范：Nexus Agent

> 文档状态：v0.1 · 初始版本
> 视觉底座：复用 `react-vite/` 现有 design tokens（深青木 Celadon + 红橙 accent + Inter / JetBrains Mono）
> 跨文档对齐：TASK / FLOW / REQ 编号与 Product-Spec.md v0.1 完全一致

---

## 0. AI 使用说明

- 本文档定义产品的界面结构、视觉系统、组件、状态和交互规则。
- Product Spec 是功能范围的事实来源；本文档不得新增 Product Spec 没有定义的核心功能。
- 本产品属**叠加形态**（对话式 Agent + 终端型 + 界面型），按要求填 §2 §3 §5 §8.3（界面型口径）+ §A.1 ~ §A.5（Agent/终端口径）。
- AI MUST 优先设计 P0 flows 和 P0 screens。
- AI MUST 覆盖默认、加载、空、错误、成功、等待授权、被中断等关键状态。
- AI MUST 保持页面、组件、交互和视觉 tokens 的一致性，**token 取值与 react-vite/styles.css + tailwind.config.js 完全一致**。
- **视觉变更规则**：dark theme 已有完整 token，**禁止修改 seed token 值**；派生 token 通过 `color-mix(in srgb, ...)` 派生，不重新硬编码 hex。

---

## 1. 设计方向

### 1.0 产品形态

| 维度 | 方向 |
|---|---|
| 形态 | **对话式 Agent + 终端型 + 界面型（三轨叠加）** |
| 本体 | 对话流 + 终端流 + 三栏页面构成复合本体；本体的视觉轴是「会话流、状态机、工具调用时间线」 |
| 落地分轨 | 界面型走 §2 §3 §5 §8.3；Agent / 终端走 §A.1 ~ §A.5；交叉部分（MCP、节点样式）两边都填 |

### 1.1 设计目标

让一个独立开发者在 macOS 上打开 Nexus Agent 后，10 秒内看出「这是 Claude Code 的本地化复刻 + 工作流引擎」，30 秒内能跑通内置示例工作流。**视觉不是主角，主角是 Agent 的可观察性**——用户能看见 AI 在做什么、为什么、下一步是什么。

### 1.2 产品气质

| 维度 | 方向 |
|---|---|
| 语气 | 专业 + 工程感 + 直白不奉承（与 Product Spec 角色「废才」一致） |
| 信息密度 | 中等偏紧凑（信息流为主，不能太空） |
| 视觉风格 | 工具型 / Dashboard（参考 Claude Code Desktop / Goose / Cursor Chat 面板） |
| 情绪目标 | 「我看着 Agent 干活，我随时能叫停，我信得过它」——透明可信、可控、可中断 |

### 1.3 设计原则

- **DP-001 · 透明可信优先**：Agent 在做什么永远可见；不可见的 Agent 是不可信的 Agent。技术依据：[Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- **DP-002 · 可中断即安全感**：用户在任何运行态都能用 Esc / 停止按钮打断，技术依据：[Claude Code Docs](https://docs.claude.com/en/docs/claude-code/overview)
- **DP-003 · 流式优先于批处理**：首字延迟 < 1.5s，后逐字渲染，**绝不批量渲染**；技术依据：[Mux: Designing Streaming UIs](https://mux.com/blog/designing-streaming-uis)
- **DP-004 · 状态冗余编码**：颜色 + 图标 + 文字三重表达，禁绝「仅颜色表意」；技术依据：[NN/g: Status Indicators](https://www.nngroup.com/articles/)
- **DP-005 · 视觉一致性服从主题系统**：所有颜色用 `var(--seed-*)` 或 `var(--color-*)`，禁止硬编码 hex；圆角统一走 `--seed-radius: 10px`
- **DP-006 · 危险动作视觉显著**：写文件 / 跑命令 / 删文件 / `git push` 必须 PermissionPrompt，且视觉上与普通操作明显区分

### 1.4 参考与反参考

**正向参考：**

| 参考产品 | 具体喜欢哪一点（拆成属性） | 必须保留 |
|---|---|---|
| Claude Code Desktop | 极简文字流 / 终端原生气质 / 状态机外显 | Yes |
| Goose (Block) | 工具调用时间线显式 / MCP panel 透明 | Yes |
| Continue.dev | 工具调用折叠卡 + 状态角标（running/done/error） | Yes |
| Cursor Chat | 流式 inline diff / 文件锚跳转 | Yes |
| Linear | 信息密度 / 紧凑表 / 弱强调色 | 局部（settings 列表用 Linear 的紧凑思路） |
| iTerm2 | 终端 ANSI true-color / 等宽 | Yes |

**反参考：**

- **任何「拟物化 AI 助手」UI**（带卡通头像 / 表情气泡 / 卡通气泡尾巴）——本产品是工具，不是聊天陪伴
- **「大屏 dashboard 风」**（一堆 KPI 卡 + 巨大字号 + 居中 logo）——产品主路径是对话，不是数据看板
- **「纯白色 SaaS 风」**（白底 + 浅蓝 accent + 巨大留白）——深青木是本产品的品牌色，改白底等于改品牌

> 反参考当边界 fence：任何决策前对照这三类「不要」，命中即拒。

---

## 2. 信息架构

### 2.1 导航结构

主窗口采用**左 sidebar + 中对话区 + 右 tool panel（可隐藏）三栏 + 顶部 top bar**；多项目通过 sidebar tab 切换；全局交互还有**系统托盘 + 全局快捷键**两条快捷入口。**无路由（单页应用）**，无页面切换动画（直接 swap 视图）。

### 2.2 页面清单

| 页面编号 | 页面名称 | 页面目的 | 关联流程 / 需求 | 优先级 |
|---|---|---|---|---|
| SCREEN-001 | 主窗口（侧栏 + 对话 + 工具面板） | 项目列表 + 对话流 + 工具时间线（三栏合一） | FLOW-001 / REQ-001, REQ-003, REQ-008 | P0 |
| SCREEN-002 | 权限弹窗（PermissionPrompt 浮层） | Agent 调用写文件 / 跑命令前人工确认 | REQ-006 | P0 |
| SCREEN-003 | 设置弹窗（SettingsModal 浮层） | API key / 主题 / 快捷键 / 数据管理 | REQ-009 + REQ-007 | P0 |
| SCREEN-004 | 系统托盘菜单（macOS menubar） | 全局访问点，看 status + 唤起主窗口 | REQ-007 | P0 |
| SCREEN-005 | 添加项目向导（modal） | 选目录 + 加载 Skills 预览 + 确认添加 | REQ-001 | P1 |
| SCREEN-006 | DiffViewer 全屏（Monaco diff） | 大文件 diff 阅读 | REQ-008 + REQ-006 | P1 |

### 2.3 页面关系

- 主窗口（SCREEN-001）是**唯一长期可见容器**；其余都是其上的浮层 / 系统级
- 权限弹窗（SCREEN-002）和设置弹窗（SCREEN-003）走 modal，**互斥展示**（不同时打开）
- 系统托盘菜单（SCREEN-004）独立于主窗口——主窗口关闭时仍存活
- 多项目 tab 切在 SCREEN-001 内部完成，**不切页面**

---

## 3. 页面规格

> 此节针对界面型叠加的部分；对话流 / 终端流的核心视觉规格见 §A。

### SCREEN-001：主窗口

**页面目的：** 承载 Agent 对话流 + 项目切换 + 工具时间线；完成 FLOW-001 端到端。

**主要操作：** 输入消息（CommandInput focus）、查看工具调用（ToolPanel）、切项目 tab、查看 diff（DiffViewer）

**次要操作：**
- 切换 ToolPanel 显隐（顶栏右侧按钮）
- 唤起设置（顶栏齿轮）
- 停止当前 Agent（顶栏停止按钮，运行时可见）
- 全局快捷键 ⌘K 搜索

**布局结构：**
1. 顶部 TopBar（48px 高）：项目名 / tab 切换 / StatusIndicator / 停止按钮 / 设置齿轮 / ToolPanel 开关
2. 左侧 Sidebar（240px 可折叠到 56px）：项目列表 + 「添加项目」按钮
3. 中间 ChatPanel（自适应宽度，min 480）：消息流 + CommandInput 固定底部
4. 右侧 ToolPanel（300px 可隐藏）：工具调用时间线 + DiffViewer 内嵌
5. 无底部固定 bar（CommandInput 在 ChatPanel 底部）

**内容层级：**

| 优先级 | 元素 | 说明 |
|---|---|---|
| 1 | StatusIndicator + 当前消息 stream | 用户首要关注 Agent 状态 |
| 2 | 最新一条用户消息 + Agent 回复 | 视线停留区 |
| 3 | ToolPanel 当前运行项 | 用户想看 Agent 在做什么 |
| 4 | Sidebar 项目列表 | 切换上下文 |
| 5 | 顶栏设置 / 停止 | 必要时操作 |

**使用的组件：** CMP-001（消息卡）、CMP-002（CommandInput）、CMP-003（ToolPanel）、CMP-004（StatusIndicator）、CMP-007（SettingsModal 触发器）

**必需状态：**
- 默认：空项目列表 + ChatPanel 引导「添加你的第一个项目」
- 加载：项目扫描 + Skills 加载时 Sidebar 顶部 spinner
- 空状态：项目列表空 / 消息列表空各自显示独立空态文案
- 错误：API 错误 / 路径不存在 / Skills 解析失败 → Toast + 状态栏红
- 成功：项目添加 / 消息发送 → 短暂 Toast + 列表更新
- 禁用 / 权限受限：Agent 调用越权时 PermissionPrompt（CMP-005）

**响应式表现：** 仅桌面端（macOS），窗口尺寸 ≥ 1024×640 起步；窗口缩到 < 900 宽时 Sidebar 自动折叠

**可访问性说明：**
- 所有按钮 `aria-label` 完整
- StatusIndicator 用 `role="status"` + `aria-live="polite"`
- CommandInput focus 时整个 ChatPanel 视口滚到底
- 流式 token 区域用 `aria-live="polite"`，错误用 `aria-live="assertive"`
- 全键盘可达：Tab 走 Sidebar → ChatPanel → ToolPanel → 顶栏

### SCREEN-002：权限弹窗（CMP-005）

见 CMP-005 规格。其状态涵盖「等待授权」一项主路径 + 「危险动作二次确认」分支。

### SCREEN-003：设置弹窗（CMP-007）

见 CMP-007 规格。

### SCREEN-004：系统托盘菜单

菜单项：当前项目名（灰显） / 分隔符 / 显示主窗口 / 切下一个项目 / 设置 / 退出。图标随 agentStatus 变色（用 Tray.setImage 4 张 PNG 切）。

### SCREEN-005：添加项目向导

3 步：
1. 选目录（NSOpenPanel 触发的 fs 选择）
2. 预览加载到的 CLAUDE.md / AGENTS.md / Skills 数量（只读列表）
3. 确认 + 自动切到该项目 tab

### SCREEN-006：DiffViewer 全屏

Monaco diff editor 双栏布局，仅只读 + 折叠 + 复制路径。触发：ToolPanel 内 hasDiff 项点「展开全屏」。

---

## 4. 组件规格

### CMP-001：消息卡（ChatPanel 单元）

**组件用途：** 承载用户消息 / Agent 回复 / 工具调用折叠块。

**使用位置：** SCREEN-001 ChatPanel

**变体：**

| 变体 | 用途 |
|---|---|
| user | 用户消息气泡，右对齐 |
| assistant-text | Agent 纯文本回复，左对齐 |
| assistant-tool | Agent 工具调用折叠卡，左对齐 |
| tool-result | 工具执行结果摘要卡，左对齐缩进 |
| error | 错误回显，红边框 |
| system | 系统消息（Skill 加载完成等），灰底 |

**状态：**

| 状态 | 视觉表现 | 交互表现 |
|---|---|---|
| 默认 | 见变体表 | 不可点击（除复制按钮） |
| 悬停 | 右侧显「复制」按钮（hover 才出） | 鼠标移上 200ms 显 |
| 流式中 | assistant-text 末尾 caret 闪烁 | 不可手动停止（除顶栏停止） |
| 完成 | caret 消失 + 「复制」可见 | 可复制全文 |
| 折叠 | 标题 + 「▸ 展开」 | 点击展开 |
| 展开 | 标题 + 「▾ 收起」+ 内容 | 点击收起 |
| 错误 | 红边框 + 错误图标 | 点击查看完整堆栈 |

**内容规则：**
- assistant-text 用 `font-sans` + 等宽内嵌
- 工具调用标题格式：`<tool-name> <input-path-or-cmd>` 截断 80 字符
- 代码块用 `JetBrains Mono`，背景 `--color-surface-card`，圆角 6px
- 行内代码用等宽 + 浅背景

**可访问性要求：**
- 每张卡 `role="article"`，嵌套 `role="group"` 表展开区域
- 折叠按钮 `aria-expanded`
- 流式 token 容器 `aria-live="polite"`

### CMP-002：CommandInput（含 @ 文件选择）

**组件用途：** 用户输入消息 + @ 引用文件触发 FileSelector。

**使用位置：** SCREEN-001 ChatPanel 底部

**变体：**

| 变体 | 用途 |
|---|---|
| idle | 默认空状态，按钮 disable |
| typing | 有输入，主操作按钮 enable |
| thinking | 发送中，input 灰 + 「停止」按钮替换发送 |
| awaiting-permission | 等 PermissionPrompt 期间 input 锁 |
| file-selector-open | @ 触发下拉浮层 |

**状态：**

| 状态 | 视觉表现 | 交互表现 |
|---|---|---|
| 默认 | 占位符「问点什么...」 | 可输入 |
| 聚焦 | 边框颜色变 `--seed-primary`（focus ring） | cursor 闪烁 |
| 输入中 | 显示字符数（> 5000 警告） | 字数实时显示 |
| 提交后 | input 清空 + 立即出现用户消息气泡 | 流式状态开启 |
| streaming | input 灰 + caret 持续闪烁 | 不可编辑 |
| blocked | PermissionPrompt 阻塞时 input 全灰 | 等用户授权 |
| 错误 | 边框红 + 错误 toast | 重试 |

**内容规则：**
- 占位符短：「问点什么...」或「输入 @ 引用文件」
- 输入超过 5000 字符后底部出现警告
- @ 触发的文件选择浮层走键盘上下 + Enter

**可访问性要求：**
- `<textarea aria-label="输入消息给 Agent">`
- FileSelector `role="listbox"`，选中项 `aria-selected`

### CMP-003：ToolPanel 工具时间线

**组件用途：** 显示 Agent 一轮内调过的工具顺序、状态、用时。

**使用位置：** SCREEN-001 右侧栏

**变体：**

| 变体 | 用途 |
|---|---|
| empty | 无工具调用，引导用户「工具调用会出现在这里」 |
| compact | 工具标题列表，仅显状态色点 |
| expanded | 单项展开 input/output（默认 fold） |
| hasDiff | 展开项内嵌 Monaco diff（≥ 50 行才展开 Monaco） |

**状态：**

| 状态 | 视觉表现 | 交互表现 |
|---|---|---|
| 等待 | 灰色「○ 等待」 | 不可点击 |
| 运行中 | 橙点呼吸（`animate-breathe`）+ 「运行中…」 | 不可点击（运行中可停） |
| 完成 | 绿点 + 「完成」 | 点击展开 |
| 失败 | 红点 + 「失败：<原因>」 | 点击查看错误 |
| 跳过 | 灰点 + 「跳过（用户拒绝）」 | 只读 |

**内容规则：**
- 单项格式：`<状态点> <工具名> <input 摘要 80 字>`
- 输出 / error 默认折叠，仅标题可见
- 用时显示在右下角：「200ms」

**可访问性要求：**
- 列表 `role="list"`，项 `role="listitem"`
- 状态用图标 + 文字，不只靠颜色

### CMP-004：StatusIndicator 状态点

**组件用途：** 单点状态指示，颜色 + 图标 + 文字三重编码。

**使用位置：** 顶栏 + 系统托盘 + 权限弹窗头部

**变体：**

| agentStatus | 颜色 | 图标 | 文字 |
|---|---|---|---|
| idle | `--seed-muted` 灰 | ○ | 闲置 |
| thinking | `--seed-primary` 青木 + 呼吸 | ◐ | 思考中 |
| streaming | `--seed-primary` 青木 + 流动 caret | ▍ | 生成中 |
| executing | `--seed-accent` 红橙 + 脉冲 | ▶ | 执行工具 |
| awaiting-permission | 黄 + 闪烁 | ⚠ | 等你授权 |
| done | `--seed-primary` 实色 | ● | 完成 |
| error | 红 | ✕ | 出错 |

**状态视觉差异：**
- 「thinking」用 `animate-breathe` 动画（已有）
- 「streaming」用新增的 `streaming-caret` 动画
- 「executing」用 `animate-pulse-soft` 动画（已有）

### CMP-005：PermissionPrompt 权限弹窗

**组件用途：** Agent 调用写文件 / 跑命令前人工确认。

**使用位置：** SCREEN-002 浮层

**变体：**

| 变体 | 用途 | 视觉权重 |
|---|---|---|
| write-file | 写文件，展示路径 + diff | 中（红橙强调） |
| exec | 跑命令，展示完整命令 | 中 |
| dangerous-exec | `git push` / `rm -rf` / `git reset --hard` / `sudo` | **高**（红边框 + 粗体警示） |
| read-out-of-bounds | 读白名单外（已被主进程拦截，无须弹） | N/A |
| connect-network | Agent 想联网（v0.1 不主动联网） | 高 |

**按钮（按危险等级递进）：**
- 普通：拒绝 / 允许一次 / 始终允许
- 危险：**永远没有「始终允许」按钮**，仅「拒绝」/「复制命令退出」/「允许这一次」

**内容规则：**
- 标题：「Agent 想 <write_file>"
- 主体：路径 + 全文命令 + 若是写文件显示 diff（read 前后）
- warning 文案直白（「这会修改 `src/index.ts` 不可撤销」）
- 「始终允许」必须明示范围文案（如「此项目内 `pnpm test`」）

**可访问性要求：**
- 模态 + `aria-modal="true"`
- 焦点默认在「拒绝」按钮，方向键切换
- Esc 等于「拒绝」

### CMP-006：DiffViewer Monaco

**组件用途：** 展示 Agent 改的代码 diff。

**使用位置：** SCREEN-001 ToolPanel + SCREEN-006

**变体：**

| 变体 | 用途 |
|---|---|
| inline-diff | 小改动（< 30 行） |
| side-by-side | 大改动（≥ 30 行） |
| read-only | 全屏查看用 |
| editable (P1) | 用户编辑 |

**视觉规则：**
- 背景切 `--color-surface-card`，与 ChatPanel 区分
- 行号 + 改动色（绿加 / 红减）
- 字体 JetBrains Mono 13px
- 不可编辑时 Monaco `readOnly: true`

### CMP-007：SettingsModal 设置

**组件用途：** 全局设置入口。

**使用位置：** SCREEN-003 浮层

**5 个分区：**
1. **API & 模型** — Anthropic API key（密码输入 + 保存）、默认模型（下拉）
2. **主题** — Dark / Light / Warm（v0.1 仅 Dark 可用）
3. **快捷键** — 全局快捷键开关（macOS 列表）+ 重新绑定
4. **数据** — 清空对话 / 导出对话 / 删除项目 / 重置 API key
5. **关于** — 版本号 + 链接到文档

**风格规则：**
- 左侧 tab 切换 5 区
- 右侧表单
- 保存按钮右下「保存」（有改动才 enable）
- 危险操作（「重置 API key」「删除项目」走二次确认）

### CMP-008：SystemTray 托盘

**组件用途：** macOS menubar 入口。

**图标：** 4 张 PNG（idle 灰 / executing 橙 / done 绿 / error 红）；状态变更时切换。

**菜单项：** 当前项目 / 显示窗口 / 切换项目 / 设置 / 退出

---

## 5. 视觉系统

> 全部 token 值来自 `react-vite/src/styles.css` 与 `react-vite/tailwind.config.js` 的事实，不重新编写。

### 5.1 色彩变量

| 变量 | 用途 | 值（取自 styles.css） |
|---|---|---|
| `var(--seed-bg)` | 页面背景 | `#0f2a1f`（深青木 / celadon-900） |
| `var(--seed-surface)` | 卡片、面板 | `#162f24`（celadon-800 + 一档） |
| `var(--seed-primary)` | 主操作 / agentStatus 主色 | `#5b8a72`（celadon-400） |
| `var(--seed-accent)` | 强调 / executing 状态 | `#e85d3a`（redorange-400） |
| `var(--seed-fg)` | 主文本 | `#d4e8dc`（celadon-100） |
| `var(--seed-muted)` | 次级文本 / 未激活 | `#7a9e8a`（celadon-300） |
| `var(--seed-border)` | 默认边框 | `rgba(91, 138, 114, 0.2)` |
| `var(--color-bg-elevated)` | 抬升层背景（modal、popover） | `color-mix(in srgb, var(--seed-surface) 80%, var(--seed-primary) 8%)` |
| `var(--color-bg-hover)` | hover 背景 | `color-mix(in srgb, var(--seed-surface) 90%, var(--seed-primary) 20%)` |
| `var(--color-text-primary)` | 文本 | `var(--seed-fg)` |
| `var(--color-text-secondary)` | 次文本 | `var(--seed-muted)` |
| `var(--color-text-accent)` | 链接 / 强调文本 | `var(--seed-primary)` |
| `var(--color-accent-glow)` | accent 周边光晕 | `color-mix(in srgb, var(--seed-accent) 30%, transparent)` |
| `var(--color-primary-glow)` | primary 周边光晕 | `color-mix(in srgb, var(--seed-primary) 25%, transparent)` |
| `var(--color-border-subtle)` | 弱分割 | `rgba(91, 138, 114, 0.12)` |
| `var(--color-border-active)` | 激活态边框 | `color-mix(in srgb, var(--seed-primary) 50%, transparent)` |
| `var(--color-surface-card)` | 卡片描边层 | `color-mix(in srgb, var(--seed-bg) 70%, var(--seed-surface) 30%)` |
| 错误红 | 错误状态 | `#e85d3a`（复用 accent，或独立 `--color-error: #d44a28`，看 dev-builder 实现） |
| 警告黄 | awaiting-permission | [主 Agent 决断：用 `--color-warning: #f5a524`，未在 styles.css 已有，dev-builder 新增] |

> **派生规则**：所有新派生 token 必须通过 `color-mix(in srgb, ...)` 计算，禁硬编码 hex。dark theme 已配齐；light / warm 主题 token P1 填。

### 5.2 字体排版

| 变量 | 用途 | 字号 / 字重 / 行高 |
|---|---|---|
| `font-sans` | UI 默认 | Inter / system-ui / -apple-system, sans-serif |
| `font-mono` | 代码、终端、diff | JetBrains Mono / Fira Code / Cascadia Code, monospace |
| 文本 - 页面标题 | SCREEN-001 标题等 | Inter 18px / 600 / 1.4 |
| 文本 - 区块标题 | 侧栏分组、tool 项名 | Inter 14px / 500 / 1.4 |
| 文本 - 正文 | 消息正文 | Inter 14px / 400 / 1.6 |
| 文本 - caption | 帮助文字、元信息 | Inter 12px / 400 / 1.4 |
| 文本 - 终端 / 代码 | 命令、文件路径 | JetBrains Mono 13px / 400 / 1.5 |
| 文本 - 状态 | StatusIndicator 文字 | Inter 11px / 500 / 1 / letter-spacing: 0.05em |

### 5.3 间距系统

8px 步进：

| 变量 | 用途 | 值 |
|---|---|---|
| `space-1` | 紧密元素 | 4px |
| `space-2` | 表单内 | 8px |
| `space-3` | 表单 / 按钮内 | 12px |
| `space-4` | 卡片内 padding | 16px |
| `space-5` | 控件间 | 20px |
| `space-6` | 区块间 | 24px |
| `space-8` | 大区块 | 32px |
| `space-10` | 模态框内 padding | 40px |
| `space-12` | 页面最大间距 | 48px |

### 5.4 形状与层级

| 变量 | 用途 | 值 |
|---|---|---|
| `radius-sm` | 工具项 / 状态点 | 6px |
| `radius-md` / `radius-seed` | 卡片、输入框、按钮 | `var(--seed-radius): 10px` |
| `radius-lg` | 弹窗、模态框 | 14px |
| `radius-pill` | 状态徽章 | 999px |
| shadow-sm | 工具时间线 hover | `0 1px 2px rgba(0,0,0,0.2)` |
| shadow-md | 弹窗、权限确认 | `0 8px 24px rgba(0,0,0,0.4)` |
| shadow-lg | 系统级 modal | `0 16px 48px rgba(0,0,0,0.5)` |

**禁绝**：渐变（除 `var(--color-primary-glow)` 类光晕）；大阴影遮罩；模糊背景（与品牌气质不符）。

### 5.5 图标与图像风格

- **图标来源**：现有 `src/components/ui/` 已有图标，统一走 lucide-react（[主 Agent 决断]）
- **风格**：24×24，1.5px 描边，色用 `currentColor`
- **禁用**：拟物图标 / 卡通插画 / 头像 / 装饰性图像
- **空态插图**：用纯色块 + 单色符号（如「▢」表示空 project list），不用 SVG 插图

---

## 6. 交互与反馈规则

> 见 [Mux: Streaming UIs](https://mux.com/blog/designing-streaming-uis) / [Vercel AI SDK: Chatbot Tool Usage](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-tool-usage)

### 6.1 全局交互规则

| 模式 | 规则 |
|---|---|
| 主操作 | 发送消息 = CommandInput Enter；危险操作必须 PermissionPrompt |
| 次要操作 | 切 tab、开关 ToolPanel：单击立即生效，无确认 |
| 危险操作 | 写文件 / 跑命令 / 删项目 / 清空对话：必须弹窗二次确认 |
| 保存行为 | Settings 改动 = 显式「保存」按钮；项目添加 / Skill 加载 = 自动保存 |
| 导航 | 单页内 tab 切换；模态关闭 = Esc / 点遮罩 / 点关闭按钮 |
| 弹窗 | 模态走 `aria-modal`，遮罩半透黑 `rgba(0,0,0,0.5)`；权限弹窗特权 modal（不遮罩其他） |
| 中断 | **任何运行时 Esc / 停止按钮立即停** |
| 撤销 | Agent 单步有 tool_use 但未确认前可撤销（工具还没跑）；已跑的工具靠 git revert / 用户手动 |

### 6.2 反馈规则

| 场景 | UI 反馈 | 文案规则 |
|---|---|---|
| 成功 | 短暂 Toast（3s 自动消失）+ 状态切 `done` | 文案直白：「项目已添加」「消息已发送」 |
| 错误 | 顶部红色 Toast（不自动消失，需手动关闭）+ StatusIndicator 红 + 错误回显到 ChatPanel | 文案带具体原因：「API key 无效，去 Settings 重新配置」「文件不存在：/foo/bar」 |
| 警告 | 黄色边框 / awaiting-permission 闪烁 | 「Agent 想写 5 个文件，请确认」「API 余额将尽（剩余 $2.10）」 |
| 空状态 | 居中文字 + 单图标 + 主操作 CTA | 「还没有项目，添加一个开始」→「添加项目」 |
| 加载 | spinner + 「正在加载…」 | 项目扫描 / Skills 加载 |
| 流式 | 末尾 caret 闪烁 + StatusIndicator streaming | 无文案 |

**文案规则（与废才风格一致）：**
- 直白、不奉承：「失败：网络断了」而非「哎呀，出错了哦！」
- 短句：单行 ≤ 30 字
- 永远带「下一步」：错误文案必带「去 Settings」「重试」「跳过」之一

### 6.3 动效规则

**保留**（来自 tailwind.config.js）：
- `animate-breathe`（2.4s ease-in-out infinite） — 状态点呼吸
- `animate-pulse-soft`（2s ease-in-out infinite） — executing 状态
- `animate-slide-in-right`、`animate-slide-in-up`、`animate-fade-in` — 工具卡 / 消息出场

**新增**：
- `streaming-caret` — 末端 caret 闪烁（0.8s step blink）
- `glow-pulse` — 执行中 accent 周边的光晕

**禁绝**：超过 400ms 的转场；装饰性装饰动画（背景粒子 / 渐变扫光）；bouncy spring（已用 ease-spring 但仅在 popover 弹出用，不滥用）

### A.1 交互骨架与模式

| 维度 | 方向 |
|---|---|
| 驱动方式 | 自然语言（CommandInput）+ slash command（`/prd`、`/goal`、`/refactor` 等）+ 全局快捷键（⌘⇧A 唤起 / ⌘K 搜索 / Esc 停） |
| 模式 | 默认「Execute」单模式；v0.1 不做 Plan/Act 双模按钮（用户问「先 plan 一下」Agent 自调用对应 skill） |
| 一轮交互 | 用户消息 → 流式 token 渲染 → 工具调用（如有）→ PermissionPrompt → 工具执行 → 工具结果回写 → 继续生成 → end_turn |
| 状态机 | agentStatus ∈ {idle, thinking, streaming, executing, awaiting-permission, done, error}（Spec §11.3） |

### A.2 呈现单元与技术内容

| 呈现单元 | 呈现方向 |
|---|---|
| 用户消息 | 右对齐气泡，深色稍亮（`var(--color-bg-elevated)`），等宽无衬线 fallback |
| Agent 回复 | 左对齐，无气泡（直接接消息卡），首字延后 < 1.5s，逐字渲染 |
| 工具调用 | **单独成块折叠卡**（CMP-003）；不与正文混 |
| 代码 / diff | 等宽字体，行内 highlight；diff 用绿加红减，行内/分栏按行数切换 |
| 命令输出 | 长输出默认折叠（> 100 行折叠），展开后保留 ANSI 色彩（true-color） |
| 思考 / 计划 / 待办 | 默认折叠（`▼ 思考（点击展开）`），展开后单色等宽 |
| 错误 / 堆栈 | 红色边框卡片，堆栈默认折叠，避免吓用户 |

**为什么不用 inline 工具调用而用折叠卡**：[Continue.dev 可折叠 step card](https://docs.continue.dev/) 已被验证有效；用户能一眼看出「这是工具不是模型说的」。

### A.3 Agent 运行态

| 运行态 | 显示方向 |
|---|---|
| 流式输出中 | StatusIndicator `streaming` + 消息末尾 caret 闪烁 |
| 思考中 | StatusIndicator `thinking`（呼吸）；思考内容单独折叠卡 |
| 跑工具中 | ToolPanel 该项 `executing`（橙点呼吸 + 「运行中…」）；ChatPanel 不显示工具内部输出（除已完成结果） |
| 等待授权 | StatusIndicator `awaiting-permission`（黄闪烁）+ PermissionPrompt 弹出 + 顶栏闪烁 |
| 被中断 | StatusIndicator 切 `idle` + 消息末尾「[已中断]」标记 + Toast「已停止当前 Agent」 |
| 长任务进度 | 多工具链 → ToolPanel 显示「已完成 3 / 共 7 步」；Plan skill 走流式文本列表 + 实时打勾 |

### A.4 透明度与授权（必填，绝不漏）

| 维度 | 规则方向 |
|---|---|
| 推理展示 | **全展示**（不隐藏 Agent 思考），折叠 / 展开由用户决定 |
| 动作可回溯 | ToolPanel 永远显示本 session 所有工具调用历史；点击可展开查看 input / output |
| 授权粒度 | 三档：「拒绝」「允许一次」「始终允许」（仅普通操作，危险操作无第三档） |
| 动作分级 | 见 Spec §11.1，不再重复 |
| 危险动作拦截 | `write_file` / `exec` 走 PermissionPrompt；`git push` 到 main / `rm -rf` / `git reset --hard` / `sudo` 必须 PermissionPrompt 且**禁始终允许**；`read_file` 白名单外路径主进程硬拦截 |
| 可中断 | Esc / 顶栏「停止」按钮 / 顶栏快捷键 → 立即停 Anthropic API stream + 中断已起的 child_process |

**视觉对应**：所有授权动作都在 ChatPanel 留痕（包括被拒的工具）——用户事后能看清 Agent 想做什么。

### A.5 终端视觉系统与多 surface

| 维度 | 方向 |
|---|---|
| 渲染基元 | xterm.js；box-drawing 精致；等宽对齐 |
| 色彩深度 | **true-color 24-bit**；ANSI 16 / 256 fallback 由 xterm.js 自动 |
| 语义色 | 成功绿 `#a4d4ae`（复用 celadon-200）；警告黄 `#f5a524`；错误红 `#e85d3a`（复用 accent）；强调同 primary |
| 字体 | JetBrains Mono 13px，行高 1.3；与 DiffViewer 同字 |
| 列宽 degrade | 默认 120 列；窗口缩到 < 800 宽时 xterm 自适应窄屏（xterm.js 内置）；无独立窄模式 |
| 多 surface | 桌面（Electron window）= 主；系统托盘 = 状态入口；终端嵌入在 ChatPanel 内 ToolPanel 展开项 = 命令结果展示；不在独立 tab 跑 |

**终端与 ChatPanel 同色系**：背景切 `--color-surface-card`（已在 §5.1），让终端嵌入不喧宾夺主。

### 8.3 响应式规则（叠加形态专用）

| 断点 | 规则 |
|---|---|
| 桌面宽 ≥ 1280 | 三栏全展开；ToolPanel 默认开 |
| 桌面 1024-1280 | 三栏全展开；ToolPanel 默认关，按钮开 |
| 桌面 < 1024 | Sidebar 自动折叠为图标列；ToolPanel 默认关；主对话区不小于 480 宽 |
| 移动端 / 平板 | **不做**（Spec OUT 不在 v0.1） |

---

## 9. 实现说明

- **样式实现**：Tailwind CSS（已配）+ CSS 变量主题系统（已配）+ framer-motion（已用）。新增组件遵守同一套 token。
- **组件库**：shadcn 风格（`src/components/ui/` 已用），新组件继续按同一变体 / 状态表风格。
- **暗色模式**：v0.1 仅 dark；light/warm P1。
- **品牌资产**：暂无 logo / favicon / 启动画面，P1 补。
- **禁止模式**：
  - 不引入 Material UI / Ant Design（与现有风格冲突）
  - 不引入彩色 emoji（用单色 `lucide-react` 图标替代）
  - 不修改 `--seed-*` 值（用户锁死）
  - 不写硬编码 hex（除 styles.css 中已存在的 seed 值）

---

## 10. 假设与待确认问题

### 10.1 假设

| 编号 | 假设 | 假设依据 | 错误风险 |
|---|---|---|---|
| DASM-001 | dark theme 唯一起作用，light/warm 占位即可 | 用户说「保留现有样式」，现有仅有 dark 实色 | 用户后面切到 light 看到一堆空值 → 写 Brief 时仅承诺 dark P0 |
| DASM-002 | 终端嵌入使用现有 `--color-surface-card` 背景，不独立配色 | 与 ChatPanel 同色系更整齐；保持单 surface | 终端用户偏好纯黑底 → P1 增设可选「真黑底」toggle |
| DASM-003 | 使用 lucide-react 图标库 | `src/components/ui/` shadcn 默认即 lucide-react | 用户偏好 Heroicons → 在 dev-planner 阶段可改但 diff 小 |
| DASM-004 | 流式 token 区用 `aria-live="polite"`，错误区用 `aria-live="assertive"` | WAI-ARIA Status Pattern + MDN Live Regions | 长流式 + 屏幕阅读器对短更新仍会念出 → P1 测试 a11y 加 throttle |
| DASM-005 | StatusIndicator 状态点 6 态直接搬现有 `STATUS_CONFIG`（在 `StatusIndicator.jsx` 已有） | react-vite/ 已有事实 | 新加 `awaiting-permission` 态需要扩展 config → dev-builder 同步改 |
| DASM-006 | 长输出（> 100 行）默认折叠 | 防止单工具输出把 ChatPanel 撑成无限滚 | 用户想强制看原始输出 → P1 加 「always show raw」 toggle |

### 10.2 待确认问题

| 编号 | 问题 | 是否阻塞 | 备注 |
|---|---|---:|---|
| DQ-001 | PermissionPrompt 是否要图标（lucide `AlertTriangle` 等） | No | [主 Agent 决断] 加，有助危险动作视觉权重 |
| DQ-002 | DiffViewer 全屏触发方式：ToolPanel 内嵌点击展开 vs 右键菜单选全屏 | No | [主 Agent 决断] 嵌点击展开，标题右侧放 ↗ 图标 |
| DQ-003 | 系统托盘 4 张 PNG 图标谁来画：自己 SVG / 占位 / 用户提供 | No | [主 Agent 决断] v0.1 dev-builder 用 SVG 临时占位 + `Tray.setImage` 切；不用额外图片资源 |
| DQ-004 | 全局快捷键 ⌘⇧A 唤起后是否自动 focus CommandInput | No | [主 Agent 决断] 自动 focus，省一步点击 |
| DQ-005 | 是否在主窗口顶部加 context-window meter（Aider 风格的 token 计数 footer） | No | [主 Agent 决断] v0.1 不加，P1 评估；先保住 p99 流式延迟 |

---

## 写作备忘

- **形态**：§1.0 写明三轨叠加；§A 全填不 N/A
- **样式承接**：所有 token 值都是 `styles.css` / `tailwind.config.js` 既有事实
- **AI 护栏视觉化**：§A.4 直接落「危险动作必须 PermissionPrompt + 禁始终允许」规则
- **跨文档**：CMP-005 ↔ Spec REQ-006 / CMP-008 ↔ Spec REQ-007 / SCREEN-001 ↔ FLOW-001
- **设计稿**：用户明示不要，Brief 即可；如需视觉验证，`cd react-vite && npm run dev` 跑现有 demo 看
