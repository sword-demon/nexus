---
name: refactor
description: 小步重构
when_to_use: 行为不变、需要降低重复或复杂度时使用。
allowed-tools: [read_file, write_file, list_dir, search_files, exec]
---

# Refactor

只做行为不变的重构：

- 先找到重复或复杂点。
- 复用已有工具和类型。
- 删除多余代码优先于新增抽象。
- 跑原有验证证明行为未变。
