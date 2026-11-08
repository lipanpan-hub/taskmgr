---
inclusion: always
---

# Agent 经验总结



## oclif 命令继承相关

### 抽象基类的 static args 在子类 this.parse() 时丢失
**问题**: `BaseCreateCommand`（`src/lib/task/base-create-command.ts`）把 `static args` 放在基类，子类 `this.parse()` 报 `Unexpected argument`。原因是 oclif 对类做 `{...this.ctor}` 展开，只复制子类自身的静态属性。基类的 `run()` 里已改为显式传 `args`、`baseFlags`、`flags`。新增子命令直接继承 `BaseCreateCommand` 即可，只需声明 `static flags`、`description`、`examples` 和 `triggerType`。

**记录时间**: 2026-11-07

## 改动命令前先检查测试依赖

### 删除/收窄命令 flag 前，必须 grep `test/` 目录里的调用
**问题**: 瘦身 `task create` 的 `index.ts` 前，只检查了 src、docs、README，漏掉了 `test/testcmd/commands/task/create/` 下 7 个测试文件（约 50 处 `--trigger=` 旧写法调用）。这些测试通过 `runCommand` 真实调用命令，并且会在 Windows 任务计划程序里真实创建任务。
**注意**: 这批测试用固定任务名（如 `testTask2`），同一批测试连续跑两次会报 `UNIQUE constraint failed`，需先 `tm task delete <名称> --force` 清理。子命令的 `monthly` 默认 `--months` 为全年，`weekdays` 的 `dependsOn` 方向与旧 index 相反，错误信息也不同。

**记录时间**: 2026-11-07

## 排查"定时任务不重复执行"

### 重新注册任务会中断 logon/boot/事件类触发器正在进行的重复计划
**现象**: `tm task create logon/boot --repeat-interval=5` 的任务登录后只跑一次，`NextRunTime` 为空。XML 里 `<Repetition>` 正确，代码没有 bug。
**根因（已实测）**: 项目自带的 `\taskmgr\AutoSync` 是登录触发的任务，执行 `tm task sync2schd`，会对数据库里的每个任务调用 `RegisterTaskDefinition` 覆盖重注册。登录后约 18 秒，用户任务的重复计划就被这次重注册中断。
**实验**: 用事件触发器（可手动触发）+ 每 1 分钟重复做对照。触发后每分钟正常重复；原样重新注册后，不再运行。登录/开机触发器无法手动触发，所以用事件触发器类比，最终仍需注销重登验证。
**注意**: `Get-ScheduledTaskInfo` 的 `NextRunTime` 对登录/开机/事件触发器的重复本来就是空，不能用它判断重复是否在工作，要看 `LastRunTime` 是否持续更新。
**排查要点**: 用 `task:sync2schd` 和 `task:create` 的日志时间对比 `LastRunTime` 与 XML 里 `<RegistrationInfo><Date>`；若注册时间晚于最后一次运行，说明被重新注册过。`tm task list` 显示的触发类型可能与用户口述（"开机"）不同。任务计划程序历史记录默认关闭，无法用事件日志核对。

**记录时间**: 2026-11-07
### 修复与发布注意
**修复**: `tm task sync2schd` 新增 `--only-missing`（已存在的任务跳过），`src/lib/wtsk/autosync.ts` 生成的启动器改为 `tm task sync2schd --only-missing`。
**坑**: 全局安装的 `tm`（`@lppx/taskmgr`，在 nvm 目录下的 `tm.exe`）与源码是两份。init 钩子每次运行 tm 都会重写 `autosync-launcher.vbs`，旧版 tm 会把它写回不带 `--only-missing` 的命令，且旧版不认识该参数。本地用 `node bin/dev.js ...` 验证；生效前必须发布并升级全局 tm，之后启动器才会稳定带上新参数。

## edge-js 内嵌 C# 调用 TaskScheduler 库

### `TaskFolder.GetTask(name)` 在 TaskScheduler 2.12.2 中不存在
**问题**: `src/lib/wtsk/task-scheduler.ts` 里的 `getRunTaskCs()` 原先用 `taskFolder.GetTask(taskName)`，C# 编译报 CS1061。因为 `runScheduledTask` 之前没有任何调用方，这个错误一直没暴露。
**做法**: 按名称取任务统一用 `taskFolder.GetTasks().FirstOrDefault(t => t.Name == taskName)`（与 `getGetTaskCs` 一致），并在 C# 模板里加 `using System.Linq;`。
**注意**: edge-js 的 C# 是在运行时才编译的，`tsc` 检查不到，新增或启用 C# 模板后必须用 `node bin/dev.js ...` 真实跑一遍。
**验证方法**: 新增 `tm task stop` / `tm task restart`（`src/lib/task/task-control-handler.ts`）时，用 `ping -n 300 127.0.0.1` 做长时间运行的 once 任务，对比 `Get-Process ping` 的 PID 与 `Get-ScheduledTask` 的 State 来确认停止和重启生效。

**记录时间**: 2026-11-08

## 测试 tm 命令时不要并行调用

### 同一个任务的 enable/disable/stop 等命令必须顺序执行
**问题**: 在同一批工具调用里并行发起 `task enable` 和 `task disable`，两个 node 进程同时读写同一个任务和 SQLite，结果互相覆盖，出现 Windows 为 False、数据库为 1 的假性不一致，差点误判成代码 bug。
**做法**: 验证会改状态的命令时一条一条顺序执行，再对比 `Get-ScheduledTask ... .Settings.Enabled`、数据库和 `tm task list --enabled/--disabled`。
**状态存放**: `tasks.enabled` 在数据库里，`task-options-builder` 同步时会用它，所以 enable/disable 必须同时改数据库和 Windows（`TaskControlHandler.setEnabled`，先改 Windows 再改数据库），只改 Windows 会在下次 `sync2schd --no-only-missing` 时被改回去。
**PowerShell 坑**: 在 execute_pwsh 里先定义 `function` 再调用 node 子进程时，输出曾被截断到第一条为止，把调用拆成单条命令就正常。

**记录时间**: 2026-11-08

## 命令缺参数时的交互式选择

### oclif 在 stdin 非 TTY 时会把管道内容当成缺失的位置参数
**问题**: `tm task stop|restart|enable|disable` 的 `name` 参数可省略，省略时应弹出 prompts 选择框。但 oclif 的 `tryStdin` 在 stdin 不是 TTY 时会读取管道内容，当作 `name` 的值，选择框根本不会出现。
**做法**: 这类"省略则交互"的位置参数必须声明 `ignoreStdin: true`（`Args.string({description, ignoreStdin: true})`）。真实终端里 stdin 是 TTY，不受影响，只有脚本或测试驱动时才会触发。
**实现**: 公共逻辑在 `TaskControlHandler.resolveTaskName`（prompts autocomplete + fuse.js，与 `TaskDeleteHandler.interactiveDelete` 同风格）。stop 只列运行中的任务，enable/disable 只列状态需要改变的任务，候选为空时直接提示，不弹空列表。

### 测试 prompts 交互时必须等选择框出现再输入
**问题**: 按固定延时给 prompts 送按键（例如启动后 4 秒），而 tm 启动较慢时，按键会在选择框就绪前积压，之后一次性送达。`prompts` 同步处理 `"zzPick\r"`，此时异步的 `suggest` 还没返回，回车按初始列表的第一项提交，选中了错误的真实任务（实测误禁用了 `test1`）。真人逐键输入不会出现。
**做法**: 驱动脚本监听子进程 stdout，出现提示文字后再逐字符输入，最后等候选刷新再回车，并 `stdin.end()` 否则子进程不退出。脚本在 `testmp/interactive-pick.mjs`，用法 `node testmp/interactive-pick.mjs <子命令> <关键字>`，设置环境变量 `CANCEL=1` 则发送 Ctrl+C。
**安全**: 交互测试会在真实数据库里选任务，测试前后都要核对其它真实任务（如 `test1`）的启用状态；脚本挂住时用 `Get-CimInstance Win32_Process` 按命令行里的 `bin/dev.js|testmp` 过滤再清理残留 node 进程，不要按名称全部结束。

**记录时间**: 2026-11-08

## 启动耗时测量

- 量启动速度用 `testmp/bench-startup.mjs`（`node testmp/bench-startup.mjs 7`），别在 execute_pwsh 里先定义 function 再调 node（输出会被截断到第一条）。
- 仓库里没有 `oclif.manifest.json`（prepack 才生成，已 gitignore）。本地 `node bin/run.js` 没有 manifest 会多约 600ms，要贴近发布版需先 `npx oclif manifest`，量完删掉。
- `tm` 全局命令是 npm link 到本仓库的，改完 `npm run build` 即生效。
- 2026-11-08 优化前基线（Windows，Node 24）：node 空进程 75ms，`--version` 无 manifest 2.2s、有 manifest 1.6s。热点：oclif 探测 SHELL 约 593ms、init hook 的 `powershell Get-Host` 约 353ms、init hook 静态 import drizzle-orm 约 230-450ms。
- 优化后：`--version` 有 manifest 335ms（无 manifest 1120ms），`task list` 约 1000ms。做法：`bin/run.js` 预设 SHELL；init hook 删掉 Get-Host 检查并去掉 drizzle/better-sqlite3；迁移挪到 `src/db/index.ts` 的 `getDb()` 首次调用；`task-scheduler.ts` 用 `createRequire` 延迟加载 edge-js（`import type` 保留类型）。
- 验证迁移要用临时 `LOCALAPPDATA`（`$env:LOCALAPPDATA` 指到临时目录）建全新库，别动真实库；检查表用脚本文件，别在 pwsh 里写带转义引号的 `node -e`。
- `task list` 仍比 `--version` 慢约 650ms，来源是命令自身加载 drizzle-orm（见 npm-field-notes drizzle-orm），尚未继续优化。

## Stop 钩子 `npm run build` 报 ENOENT（路径里夹着 JSON）

### `oclif manifest` 在 stdin 非 TTY 时把管道内容当成 PATH 参数
**现象**: `.kiro/hooks/build.json` 的 Stop 钩子执行 `npm run build`，钩子把会话 JSON 通过 stdin 传入，报 `E:\Desktop\taskmgr\{"session_id":...}\package.json: ENOENT`。
**根因（已复现）**: 用 `'{"a":1}' | npm run build` 可复现。出错的是最后一步 `oclif manifest`，它的 PATH 参数省略时会读 stdin，与"oclif 缺位置参数读管道"是同一机制。
**做法**: `package.json` 的 build 脚本改为 `oclif manifest .`，显式给出路径后不再读 stdin。用管道 JSON 重跑 `npm run build` 通过。`prepack` 里的 `oclif manifest` 没有 stdin 输入，暂未改。

**记录时间**: 2026-11-08
