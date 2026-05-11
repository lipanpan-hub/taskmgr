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

## 代码删除与清理相关

### 删除功能时需要全面检查相关配置
**问题**: 更改test-cli.ts代码中的某个命令或功能时，只更改了源代码文件中的实现，但遗漏了 `package.json` 中相关的 npm scripts。

**示例场景**:
删除 `test/cli/test-cli.ts` 中的 `all` 子命令时，不仅要删除代码中的命令定义，还要删除 `package.json` 中的 `"test:all": "tsx test/cli/test-cli.ts all"` script。

**记录时间**: 2026-05-02


## 测试工具配置相关

### Mocha Test Explorer 与 @oclif/test 集成问题
**问题**: 使用 Mocha Test Explorer 运行使用 `@oclif/test` 的 `runCommand` 的测试时，报错 `command task not found`。

**原因**: 
- Mocha Test Explorer 直接运行 mocha，不经过项目的测试脚本
- `@oclif/test` 的 `runCommand` 函数需要知道项目根目录才能加载 oclif 配置和命令
- `runCommand` 内部使用 `findRoot()` 函数查找项目根目录，查找顺序为：
  1. 检查 `process.env.OCLIF_TEST_ROOT` 环境变量
  2. 从 `require.cache` 中查找
  3. 遍历文件路径，直到找到不包含 `node_modules`、`.pnpm` 或 `.yarn` 的目录
- 在 Mocha Test Explorer 的环境中，`findRoot()` 无法正确推断项目根目录

**解决方案**:
1. **方案一（推荐）**：创建测试辅助函数，自动为 `runCommand` 提供项目根目录
   ```typescript
   // test/test-helper.ts (或其他合适的位置)
   import {runCommand as oclifRunCommand} from '@oclif/test'
   
   // 1. 获取当前文件的目录路径
   // 2. 根据测试辅助文件相对于项目根目录的位置，计算出项目根目录的路径
   const projectRoot = /* 计算项目根目录路径 */
   
   // 3. 封装 runCommand，自动注入 projectRoot
   export async function runCommand<T>(args: string | string[], loadOpts?, captureOpts?) {
     const finalLoadOpts = loadOpts ?? {root: projectRoot}
     return oclifRunCommand<T>(args, finalLoadOpts, captureOpts)
   }
   ```
   
   然后在测试文件中导入并使用：
   ```typescript
   import {runCommand} from '相对路径/test-helper.js'
   
   // 直接使用，无需手动传入 root 参数
   const result = await runCommand(['task', 'create', ...])
   ```

2. **方案二**：在每个 `runCommand` 调用中显式传入 `root` 参数
   ```typescript
   const result = await runCommand(['task', 'create', ...], {root: projectRoot})
   ```

3. **方案三**：在 `.vscode/settings.json` 中设置 `OCLIF_TEST_ROOT` 环境变量（不推荐，因为 VSCode 变量解析可能有问题）

**注意事项**:
- 使用相对路径导入辅助函数时，要确保路径正确（从测试文件到 test-helper.ts 的相对路径）
- 导入路径必须使用 `.js` 扩展名（即使源文件是 `.ts`），因为这是 ES 模块的要求

**记录时间**: 2026-05-11


## 文件移动相关

### smartRelocate 工具的局限性
**问题**: 使用 `smartRelocate` 工具移动文件后，工具虽然会自动更新导入该文件的其他文件的 import 路径，但**不会**自动更新被移动文件内部的相对路径引用（如 `resolve(__dirname, '../..')` 这样的路径计算）。

**示例场景**:
将 `test/testcmd/test-helper.ts` 移动到 `test/test-helper.ts` 时：
1. `smartRelocate` 会自动更新其他文件中 `import ... from 'xxx/test-helper.js'` 的路径
2. 但**不会**自动更新 `test-helper.ts` 内部的 `resolve(__dirname, '../..')` 为 `resolve(__dirname, '..')`

**原因**:
- `smartRelocate` 基于语言服务器的重构功能，只能识别和更新 import/export 语句
- 文件内部的字符串形式的相对路径（如传递给 `resolve()`、`join()` 等函数的路径参数）无法被语义分析识别为需要更新的引用

**解决方案**:
使用 `smartRelocate` 移动文件后，必须手动检查并更新被移动文件内部的所有相对路径引用：

1. **路径计算**：检查 `resolve()`、`join()`、`relative()` 等函数中的相对路径参数
2. **文件引用**：检查 `readFile()`、`writeFile()` 等文件操作中的相对路径
3. **配置路径**：检查配置对象中的路径字段

**检查清单**:
```typescript
// 需要检查的常见模式
resolve(__dirname, '../../xxx')     // 路径计算
join(process.cwd(), '../xxx')       // 路径拼接
'../config/xxx.json'                // 字符串形式的相对路径
{root: '../..'}                     // 配置对象中的路径
```

**最佳实践**:
1. 移动文件后立即运行类型检查命令（`npm run typecheck`）检查类型错误
2. 使用 `grep_search` 搜索被移动文件中的 `../` 模式，逐一检查是否需要更新
3. 如果文件包含路径计算逻辑，优先手动检查而不是依赖自动化工具

**记录时间**: 2026-05-11
