---
name: code-to-spec
description: 从代码反推规格
when_to_use: 需要理解现有实现并补成规格文档时使用。
allowed-tools: [read_file, list_dir, search_files]
---

# Code To Spec

从真实代码反推规格：

- 入口和调用链
- 数据结构
- 用户可见行为
- 错误态
- 已验证事实和推断

推断必须标注，不能当事实写。
