---
name: goal-workflow
description: goal 六步法驱动 PR
when_to_use: 用户想从需求到交付按 goal 六步推进一个代码任务时使用。
allowed-tools: [read_file, list_dir, search_files]
---

# Goal Workflow

按顺序引用 6 个核心 sub-skill：

1. `/prd`：把用户意图写成可验收需求草案。
2. `/prd-to-spec`：把 PRD 转成技术方案和边界。
3. `/to-issues`：把方案拆成可执行 issue。
4. `/goal`：按单个 issue 实现代码并验证。
5. `/review-it`：对照需求和改动做代码审查。
6. `/ship-it`：准备交付说明和提交前检查；不得执行 `git push`，不得 push 到 main/master。

只使用已有项目文件和已授权工具。不创建 workflow DSL。
