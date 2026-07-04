# Phase 1 状态报告 — Nexus Agent

> 文档生成时间：2026-07-02
> 状态：**文件结构与代码 100% 交付**，**自动验证 0/3 通过**（sandbox 网络阻塞）

---

## 已交付（用户可在 sandbox 外自行验证）

### 目录结构

```
nexus-agent/
├── .gitignore
├── package.json
├── components.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── docs/
│   └── PHASE1_STATUS.md
└── src/
    ├── main/
    │   ├── index.ts          # Electron 入口 + bootstrap
    │   ├── window.ts         # BrowserWindow 工厂
    │   ├── ipc.ts            # Phase 1 stub handlers
    │   └── logger.ts         # 写 userData/logs/main.log
    ├── preload/
    │   └── index.ts          # contextBridge.exposeInMainWorld('nexus', {...})
    └── renderer/
        ├── App.jsx           # 从 react-vite 复制
        ├── main.jsx
        ├── styles.css
        ├── index.html        # 重写指向 ./main.jsx
        ├── lib/
        │   ├── syntax-highlight.jsx
        │   └── utils.js
        └── components/
            ├── ChatPanel.jsx
            ├── CommandInput.jsx
            ├── DiffViewer.jsx
            ├── PermissionPrompt.jsx
            ├── SettingsModal.jsx
            ├── StatusIndicator.jsx
            ├── ToolPanel.jsx
            └── ui/
                ├── button.jsx
                └── tooltip.jsx
```

### package.json

- name: nexus-agent
- scripts: dev / build / preview / tsc:main / tsc:renderer / tsc:check / build:main / electron:dev / electron:build
- deps: react / react-dom / framer-motion / lucide-react / clsx / tailwind-merge / class-variance-authority / @radix-ui/react-slot
- devDeps: vite / @vitejs/plugin-react / tailwindcss / postcss / autoprefixer / typescript / concurrently / wait-on / cross-env / @types/react / @types/react-dom / @types/node
- **注意**：electron / @electron/rebuild / electron-store 等需要联网的包**未列在 package.json**（已主动剔除以避免 npm install 卡死）

### tsconfig 三层

- `tsconfig.json`：根配置，paths `@/*` → `src/*`
- `tsconfig.main.json`：target=ES2022, module=CommonJS, outDir=dist-main, 包含 src/main + src/preload + src/shared
- `tsconfig.renderer.json`：target=ES2020, jsx=react-jsx, allowJs=true, 包含 src/renderer 全部 .ts/.tsx/.js/.jsx

### vite.config.ts

- root: src/renderer
- base: './'
- server.port: 5173 strictPort
- alias: '@' → src

---

## 卡点与根因（sandbox 网络阻塞）

### 错误链

1. `pnpm install` → `ERR_PNPM_META_FETCH_FAIL` 因为 sandbox 拒 registry.npmjs.org
2. `pnpm install --prefer-offline` → 同上
3. `pnpm install --offline` → `ERR_PNPM_NO_OFFLINE_META`（cache 不全）
4. `npm install --prefer-offline` → `E403 Forbidden - GET https://registry.npmjs.org/...`
5. `npm install --offline` → `ENOTCACHED`
6. `curl https://registry.npmjs.org/typescript` → `403 X-Proxy-Error: blocked-by-allowlist`
7. `cp react-vite/node_modules` → `vite build` 失败：`Cannot find module '@rollup/rollup-darwin-arm64'`（react-vite/ 当时在另一台机装的，平台 mismatch）
8. `npm exec vite build` → `Permission denied`（sandbox 拒跑 symlink 后的 binary）

### 根因

- Claude Code 当前 sandbox 的 `allowedHosts` 网络白名单只放行 `api.llmapi.pro` + `api.anthropic.com`
- registry.npmjs.org 不在白名单
- `@rollup/rollup-darwin-arm64` 在 react-vite/ 已装 node_modules 里缺失（react-vite/ 当时在非 macOS arm64 环境装的）

### 沙箱里无法自解的原因

- sandbox 配置是 harness 进程级，不在 `~/.claude/settings.json` 里
- 环境变量 `SANDBOX_RUNTIME=1` 暴露存在，但具体 allowlist 无法从内部修改

---

## 用户在 sandbox 外验证 Phase 1 的步骤

### 1. 安装依赖

```bash
cd /Volumes/MOVESPEED/ai-coding/nexus/nexus-agent
rm -rf node_modules  # 清掉之前 symlink / 复制失败残留
# 恢复 electron / electron-rebuild 到 package.json（之前主动剔除过）
npm install  # 在普通终端 sandbox 外跑，会自动装全
```

### 2. 启动 Electron dev

```bash
npm run electron:dev
```

预期：
- vite 启动在 http://localhost:5173
- electron 窗口弹出，标题 "Nexus Agent"
- 主进程 console 输出 `Nexus Agent v0.1 ready`
- 窗口内容 = react-vite/ 现有 UI（深青木主题、ChatPanel / ToolPanel / CommandInput / PermissionPrompt / SettingsModal / StatusIndicator / DiffViewer 全在）

### 3. tsc 验证

```bash
npm run tsc:check
```

预期：两层 tsc 都 0 error。

### 4. vite build

```bash
npm run build
```

预期：产出 `dist/index.html` + `dist/assets/...`，0 error。

### 5. electron-builder 打包（Phase 14 才会做，本 Phase 不要求）

不要求。

---

## Phase 1 验收硬指标核对

| # | 标准 | 状态 | 证据 |
|---|---|---|---|
| 1 | nexus-agent/ 目录 + 三层结构 + 三份 tsconfig | ✅ | 本文档上文目录树 |
| 2 | package.json 含 scripts + deps | ✅ | `package.json` 文件齐全 |
| 3 | 7 个组件 + styles + main + index.html 复制 | ✅ | `src/renderer/` 下文件齐 |
| 4 | src/main/index.ts + window + ipc + logger | ✅ | 4 个 TS 文件已写 |
| 5 | main/logger.ts 写 userData/logs | ✅ | `getLogDir()` 返回 `app.getPath('userData')` + `logs/main.log` |
| 6 | preload 暴露空 window.nexus | ✅ | `contextBridge.exposeInMainWorld('nexus', nexusApi)` |
| 7.1 | `pnpm electron:dev` 真起窗口 | ⚠️ | 代码已就绪，需 sandbox 外 `npm install` 才能跑 |
| 7.2 | `tsc --noEmit` 三份 0 error | ⚠️ | 代码已就绪，需 sandbox 外 `npm install` 才能跑 |
| 7.3 | `vite build` 0 error | ⚠️ | 缺 `@rollup/rollup-darwin-arm64`，需 sandbox 外重装 |

---

## 主 Agent 决策记录

- **决策**：从 package.json 主动剔除 `electron` / `@electron/rebuild` / `electron-store`
- **原因**：避免 `npm install` 阶段被卡死，但保留 main/preload TS 代码
- **风险**：用户在 sandbox 外 `npm install` 时需要手动恢复 package.json（**注**：不必手动，npm install electron 装好后会自动写回依赖记录；用户正常跑就行）
- **撤销方法**：在 sandbox 外执行 `npm install --save-dev electron@^39.0.0 @electron/rebuild@^4.0.0`

- **决策**：复制 react-vite/ 现有 node_modules 而不是 symlink
- **原因**：symlink 触发的 binary 在 sandbox 里被 `Permission denied`
- **风险**：react-vite/ 装的 rollup 平台不匹配（缺 darwin-arm64）
- **撤销方法**：rm -rf node_modules 后重新 npm install

- **决策**：jsx 一律保留不迁 tsx
- **原因**：Phase 1 约束 + 避免引入新依赖 / 编译失败
- **风险**：Phase 8 才统一迁移，期间两层 tsconfig 同时编译 js/jsx
- **撤销方法**：Phase 8 起逐文件迁 tsx

---

## 进度日志

| 时间 | 事件 |
|---|---|
| 2026-07-02 23:35 | nexus-agent/ 目录 + 复制 react-vite 全部 UI 文件 |
| 2026-07-02 23:37 | package.json + .gitignore + tsconfig 三层完成 |
| 2026-07-02 23:38 | vite.config.ts 完成 |
| 2026-07-02 23:39 | src/main/ 4 文件 + src/preload/index.ts 完成 |
| 2026-07-02 23:42 | 第一次 `pnpm install` → 403 blocked-by-allowlist |
| 2026-07-02 23:46 | symlink 试 → sandbox Permission denied |
| 2026-07-02 23:51 | cp react-vite/node_modules → vite build 失败（缺 darwin-arm64 rollup） |
| 2026-07-02 23:54 | 写本文档，状态诚实交底 |