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

## TypeScript 类型定义相关

### edge-js 类型定义错误
**问题**: 使用 `edge.func` 时出现 TypeScript 编译错误：
- `error TS2344: Type 'typeof edge.func<string>' does not satisfy the constraint '(...args: any) => any'`
- `error TS2558: Expected 2 type arguments, but got 1`

**原因**: 
- 自定义的 edge-js 类型定义文件中，`EdgeFunction` 和 `edge.func` 只定义了一个泛型参数（输出类型），但实际上应该有两个泛型参数（输入类型和输出类型）
- TypeScript 的 `ReturnType` 工具类型要求函数类型必须是可调用的，单参数泛型导致类型推断失败

**解决方案**:
1. 修改 `src/types/edge-js.d.ts` 中的类型定义，为 `EdgeFunction` 和 `edge.func` 添加两个泛型参数：
   ```typescript
   interface EdgeFunction<TInput, TOutput> {
     (input: TInput, callback: (error: Error | null, result: TOutput) => void): void
     (input: TInput): Promise<TOutput>
   }
   
   interface Edge {
     func<TInput = unknown, TOutput = unknown>(code: string): EdgeFunction<TInput, TOutput>
     func<TInput = unknown, TOutput = unknown>(options: EdgeOptions): EdgeFunction<TInput, TOutput>
   }
   ```

2. 更新所有使用 `edge.func` 的地方，提供两个类型参数：
   ```typescript
   // 修改前
   let _createTask: null | ReturnType<typeof edge.func<string>> = null
   _createTask = edge.func<string>(getCreateTaskCs())
   
   // 修改后
   let _createTask: null | ReturnType<typeof edge.func<unknown, string>> = null
   _createTask = edge.func<unknown, string>(getCreateTaskCs())
   ```

**记录时间**: 2026-04-26
