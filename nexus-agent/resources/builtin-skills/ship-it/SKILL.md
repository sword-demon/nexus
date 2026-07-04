---
name: ship-it
description: 提交前交付检查
when_to_use: 功能通过审查后，需要整理提交前检查和交付说明时使用。
allowed-tools: [read_file, list_dir, search_files, exec]
---

# Ship It

执行提交前检查：

- 查看改动范围。
- 运行项目要求的验证命令。
- 整理提交说明和风险。
- 只在用户明确要求时执行本地 `git commit`。

禁止执行 `git push`。禁止 push 到 main/master。需要发布或推送时先让用户确认。
