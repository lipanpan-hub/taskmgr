---
inclusion: always
---

# Agent 经验总结

## 代码重构相关

### semanticRename 工具的局限性
**问题**: 使用 `semanticRename` 重命名导出的变量时，可能会遗漏项目根目录下的配置文件（如 drizzle.config.ts、vite.config.ts 等）中的引用。

**原因**: 
- 根目录的配置文件可能不在语言服务器的默认索引范围内
- 某些配置文件可能在重命名时未被正确加载到语义分析上下文中

**解决方案**:
1. 使用 `semanticRename` 后，必须通过 `grepSearch` 工具在整个项目中搜索旧的符号名称，确认是否有遗漏
2. 特别注意检查项目根目录下的配置文件（*.config.ts、*.config.js 等）
3. 使用 `getDiagnostics` 检查所有可能受影响的文件，包括配置文件

**示例命令**:
```
grepSearch: query="\\bconfig\\b", includePattern="**/*.ts"
```

**记录时间**: 2026-03-30
