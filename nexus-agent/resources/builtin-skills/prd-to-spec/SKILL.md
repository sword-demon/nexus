---
name: prd-to-spec
description: PRD 转技术方案
when_to_use: 已有 PRD 或需求草案，需要转成工程可执行方案时使用。
allowed-tools: [read_file, list_dir, search_files]
---

# PRD To Spec

把需求转成技术规格：

- 现有代码入口和相关模块
- 数据结构 / API / UI 变更
- 错误态和边界条件
- 验证方式
- 不做的内容

优先复用现有模式，不为未来功能预留抽象。
