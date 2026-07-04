---
name: review-it
description: 代码审查
when_to_use: 代码实现完成后，需要对照需求检查 bug、风险和缺失验证时使用。
allowed-tools: [read_file, list_dir, search_files, exec]
---

# Review It

按代码审查口径输出：

1. 高风险 bug / 安全问题。
2. 行为回归。
3. 缺失验证。
4. 无问题时明确说明未发现阻断项。

发现问题要给文件和行号证据。
