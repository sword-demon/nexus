---
name: goal
description: 实现功能
when_to_use: 用户已经选定一个 issue 或明确目标，需要自驱完成代码实现时使用。
allowed-tools: [read_file, write_file, list_dir, search_files, exec]
---

# Goal

完成一个明确目标：

1. 先读相关代码和计划。
2. 做最小可工作的改动。
3. 跑能证明行为的最小验证。
4. 汇报改动文件、验证命令和结果。

不执行 commit、push、reset，除非用户明确要求。
