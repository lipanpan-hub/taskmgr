@lppx/taskmgr
=================

定时任务管理器


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@lppx/taskmgr.svg)](https://npmjs.org/package/@lppx/taskmgr)
[![Downloads/week](https://img.shields.io/npm/dw/@lppx/taskmgr.svg)](https://npmjs.org/package/@lppx/taskmgr)



# 项目介绍

`@lppx/taskmgr` 是一个 **只在 Windows 上运行** 的定时任务管理 CLI，本质上是给 Windows 任务计划程序（Task Scheduler）套了一层「本地数据库 + 命令行 + Web UI」的外壳。

底层不走 `schtasks` 命令拼字符串，而是通过 [edge-js](https://github.com/agracio/edge-js) 内联 C# 直接调用 `Microsoft.Win32.TaskScheduler.dll`（随包携带的 `TaskScheduler.2.12.2`），因此可以完整表达 Windows 原生的触发器语义（每 N 天、每 N 周指定星期、每月第几周的周几等）。

所有由本工具创建的任务都统一注册到任务计划程序的 **`\taskmgr\` 文件夹** 下，不会触碰该文件夹之外的任何系统任务。

## 两套命令，两种用途

工具提供两组功能重叠但定位不同的命令，这是理解本项目最关键的一点：

- **`tm task *`** — 面向 AI / 脚本调用。任务先写入本地 SQLite 数据库，结构化、可查询、可反复修改，再用 `tm task sync2schd` 一次性推送到 Windows。适合「先编排、后落地」。
- **`tm wtsk *`** — 面向人类手工操作。跳过数据库，直接对 Windows 任务计划程序增删查，参数带合理默认值，改完立刻生效。适合「一条命令搞定」。

两套命令**不共享状态**：`tm wtsk add` 创建的任务不会出现在 `tm task list` 里；`tm task delete` 只删数据库记录，不会移除已注册到 Windows 的任务（那需要 `tm wtsk del`）。

## 命令别名

主命令都提供了等价别名，用哪个写法功能都一样：

- `tm scripts add` = `tm script add` / `tm script addscript`
- `tm scripts list` = `tm script list` / `tm script ls`
- `tm scripts open` = `tm script open` / `tm script opendcriptsdir`
- `tm task create` = `tm task add`
- `tm task delete` = `tm task del` / `tm task remove`
- `tm task list` = `tm task ls`
- `tm task sync2schd` = `tm task sync`
- `tm ui` = `tm ui start` / `tm ui run`
- `tm wtsk del` = `tm wtsk delete`
- `tm wtsk list` = `tm wtsk ls`

## 功能一览

- 六种触发类型：`daily`、`weekly`、`monthly`、`once`、`boot`、`logon`
- 交互式创建/删除（`prompts` + `fuse.js` 模糊补全）
- PowerShell 脚本库管理：脚本集中存放在配置目录，创建任务时可交互选择
- Web UI：`tm ui` 启动 NestJS + Socket.IO 服务，浏览器里增删改查任务，多端实时同步
- 登录时自动同步：首次运行会注册一个 `AutoSync` 任务，用户登录时静默把数据库中 Windows 尚不存在的任务补建出来（`tm task sync2schd --only-missing`，已存在的任务不会被重新注册）

# 安装方法

## 环境要求

- Windows（其他平台会在启动时给出警告并跳过所有初始化）
- Node.js >= 20
- PowerShell 可用（启动时会自动检测）
- .NET Framework 4.5+（Win8/10/11 自带，edge-js 加载的是 net45 版 DLL）

## npm 全局安装

```powershell
npm install -g @lppx/taskmgr
```

安装后提供两个等价的命令别名：

```powershell
tm --version
ttt --version   # tm 的别名
```

如果 `edge-js` / `better-sqlite3` 这两个原生模块加载失败（通常发生在切换 Node 大版本之后），在包目录下重建一次：

```powershell
npm run rebuild:native
```

## Windows 安装包

也可以从源码打出带 NSIS 安装向导的独立安装包，无需预装 Node：

```powershell
git clone https://github.com/lipanpan-hub/taskmgr.git
cd taskmgr
npm install
npm run build
npm run pack:win        # 全平台架构
npm run pack:wintest    # 仅 win32-x64，出包更快
```

默认安装目录为 `%PROGRAMFILES%\lppxtaskmgr`。

## 首次运行会自动做的事

任何一条 `tm` 命令都会先跑初始化钩子，它会：

1. 检查系统平台与 PowerShell 可用性
2. 创建配置目录下的 `scripts\`，并把内置模板脚本同步进去
3. 打开 SQLite 数据库并执行 drizzle 迁移（无需手动建表）
4. 若 `\taskmgr\AutoSync` 不存在，注册该登录时任务

# 快速开始

## 路线 A：手工创建，立刻生效（推荐人类使用）

```powershell
# 每天 11:30 打开记事本
tm wtsk add myTask --path="notepad.exe" --trigger=daily --start-time="11:30"

# 每周一、三、五 14:30 执行
tm wtsk add myTask --path="notepad.exe" --trigger=weekly --weekdays="1,3,5" --start-time="14:30"

# 每季度最后一周的周五 23:59 执行
tm wtsk add myTask --path="notepad.exe" --trigger=monthly --months="3,6,9,12" --weeks-of-month="5" --weekdays="5" --start-time="23:59"

# 查看与删除
tm wtsk list --block
tm wtsk del -n myTask
```

`--trigger` 默认 `daily`，`--interval` 默认 `1`，`--start-time` 默认当天 11:30。`--weekdays` 用 `0` 表示周日、`6` 表示周六；`--weeks-of-month` 的 `5` 表示「最后一周」。

## 路线 B：先入库，再同步（推荐 AI / 批量编排使用）

```powershell
# 1. 写入数据库（此时 Windows 侧还没有任何变化）
tm task create daily myTask --path="notepad.exe" --start-time="11:30" --interval=3

# 其他触发类型: weekly / monthly / once / boot / logon，各自支持高级选项（重复、过期时间、电池策略等）
# 查看某个子命令的全部参数: tm task create weekly --help

# 2. 确认一下
tm task list --block

# 3. 推送到 Windows 任务计划程序
tm task sync2schd            # 或简写 tm task sync
tm task sync2schd -n myTask  # 只同步指定任务
```

不确定参数怎么填时用交互式模式：

```powershell
tm task create --interactive
tm task delete --interactive
```

## 用 PowerShell 脚本作为任务动作

```powershell
# 把脚本纳入管理（复制到配置目录）
tm scripts add .\backup.ps1
tm scripts list
tm scripts open              # 在资源管理器中打开脚本目录

# 直接指定脚本文件，自动用 powershell.exe 隐藏窗口执行
tm wtsk add backupTask -p .\backup.ps1 --trigger=daily --start-time="02:00"

# 或从已有脚本里交互选择（支持模糊搜索）
tm wtsk add backupTask --psi
```

`-p/--ps-script` 生成的执行命令固定为
`powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "<脚本路径>"`。
要跑 `.js` / `.py` / `.ts` 脚本，请改用 `--path` 指定解释器 + `--arguments` 传脚本路径。

## Web UI

```powershell
tm ui                # 默认 3000 端口，并自动打开浏览器
tm ui --port 8080
```

> ⚠️ Web 服务**没有任何鉴权**，且 CORS 允许所有来源。服务只监听本机 `127.0.0.1`，因此风险限于本机；但本机上的任何程序都能增删任务，请勿在不可信环境下长期驻留该服务。

Web UI 操作的是**数据库**，改完仍需 `tm task sync2schd`才会落到 Windows。登录时的 AutoSync 只补建缺失的任务，不会覆盖已存在的任务。

# 数据与文件位置

配置目录为 `%LOCALAPPDATA%\lppxtaskmgr`，其中：

- `taskmgr_v1.db` — SQLite 数据库（可通过包根目录 `.env` 的 `DB_NAME` 改名）
- `scripts\` — 脚本库，`tm scripts` 与 `--psi` 都读这里
- `logs\` — 按天滚动的日志，保留 14 个文件
- `logger.json` — 日志配置，首次运行自动生成
- `autosync-launcher.vbs` — AutoSync 任务的静默启动器

Windows 侧的任务统一位于「任务计划程序库 → taskmgr」，完整路径形如 `\taskmgr\myTask`。

# 注意事项

- **`boot` 触发需要管理员权限**。请用「以管理员身份运行」的终端，否则命令会明确报错并建议改用 `logon`。
- **同步是覆盖式的**。同名任务会被直接覆盖；数据库里删掉的任务不会自动从 Windows 移除。覆盖等于重新注册，会中断 `logon`/`boot` 触发器正在进行的重复计划（`--repeat-interval`），所以不要在登录后手动 `tm task sync2schd` 全量同步带重复的任务；登录时的 AutoSync 为此使用 `--only-missing`。
- **内置模板脚本每次运行命令都会强制覆盖同名文件**。不要用 `休眠脚本.ps1`、`test-node.js` 等模板同名的文件名保存自己的脚本。
- **安装后任务计划程序里会多出一个 `AutoSync` 任务**，这是工具自己注册的登录时同步任务，不是残留垃圾。
- **`.env` 只从包根目录读取**，不会从当前工作目录读。
- 只给 `HH:mm` 的 `--start-time` 会被补成完整日期。若当天该时刻已过且未开启 `--start-when-available`，任务会顺延到下一个周期。

# 本地开发

```powershell
npm install
npm run build          # 编译 CSS + TypeScript
npm run dev            # 并行跑 Tailwind watch 与后端 tsx watch
npm run typecheck
npm run lint

# 测试
npm test -- test\testbackend\task\websocket.query.test.ts   # 单个文件
npm test -- --dir test\testbackend                          # 整个目录

# 数据库
npm run db:generate    # 生成迁移
npm run db:studio      # 可视化查看数据
```

注意：DLL 路径由模块自身位置推导，与当前工作目录无关——未打包时取模块所在目录向上三级（`src/lib/wtsk` 或 `dist/lib/wtsk` 均指向包根目录），打包后取可执行文件目录的上一级。因此可在任意目录执行 `bin/dev.js`，都能找到 `TaskScheduler.2.12.2\lib\net45\*.dll`。


<!-- commands -->
* [`tm autocomplete [SHELL]`](#tm-autocomplete-shell)
* [`tm help [COMMAND]`](#tm-help-command)
* [`tm script add PATH`](#tm-script-add-path)
* [`tm script addscript PATH`](#tm-script-addscript-path)
* [`tm script list`](#tm-script-list)
* [`tm script ls`](#tm-script-ls)
* [`tm script open`](#tm-script-open)
* [`tm script opendcriptsdir`](#tm-script-opendcriptsdir)
* [`tm scripts add PATH`](#tm-scripts-add-path)
* [`tm scripts list`](#tm-scripts-list)
* [`tm scripts open`](#tm-scripts-open)
* [`tm task add`](#tm-task-add)
* [`tm task create`](#tm-task-create)
* [`tm task create boot [NAME]`](#tm-task-create-boot-name)
* [`tm task create daily [NAME]`](#tm-task-create-daily-name)
* [`tm task create logon [NAME]`](#tm-task-create-logon-name)
* [`tm task create monthly [NAME]`](#tm-task-create-monthly-name)
* [`tm task create once [NAME]`](#tm-task-create-once-name)
* [`tm task create weekly [NAME]`](#tm-task-create-weekly-name)
* [`tm task del [NAME]`](#tm-task-del-name)
* [`tm task delete [NAME]`](#tm-task-delete-name)
* [`tm task list`](#tm-task-list)
* [`tm task ls`](#tm-task-ls)
* [`tm task remove [NAME]`](#tm-task-remove-name)
* [`tm task sync`](#tm-task-sync)
* [`tm task sync2schd`](#tm-task-sync2schd)
* [`tm ui`](#tm-ui)
* [`tm ui run`](#tm-ui-run)
* [`tm ui start`](#tm-ui-start)
* [`tm version`](#tm-version)
* [`tm wtsk add TASKNAME`](#tm-wtsk-add-taskname)
* [`tm wtsk del`](#tm-wtsk-del)
* [`tm wtsk delete`](#tm-wtsk-delete)
* [`tm wtsk list`](#tm-wtsk-list)
* [`tm wtsk ls`](#tm-wtsk-ls)

## `tm autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ tm autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ tm autocomplete

  $ tm autocomplete bash

  $ tm autocomplete zsh

  $ tm autocomplete powershell

  $ tm autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.54/src/commands/autocomplete/index.ts)_

## `tm help [COMMAND]`

Display help for tm.

```
USAGE
  $ tm help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tm.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.55/src/commands/help.ts)_

## `tm script add PATH`

添加脚本到用户配置目录

```
USAGE
  $ tm script add PATH

ARGUMENTS
  PATH  脚本文件路径

DESCRIPTION
  添加脚本到用户配置目录

ALIASES
  $ tm script add
  $ tm script addscript

EXAMPLES
  $ tm script add ./script.ps1
```

## `tm script addscript PATH`

添加脚本到用户配置目录

```
USAGE
  $ tm script addscript PATH

ARGUMENTS
  PATH  脚本文件路径

DESCRIPTION
  添加脚本到用户配置目录

ALIASES
  $ tm script add
  $ tm script addscript

EXAMPLES
  $ tm script addscript ./script.ps1
```

## `tm script list`

列出用户配置目录下的所有脚本

```
USAGE
  $ tm script list

DESCRIPTION
  列出用户配置目录下的所有脚本

ALIASES
  $ tm script list
  $ tm script ls

EXAMPLES
  $ tm script list
```

## `tm script ls`

列出用户配置目录下的所有脚本

```
USAGE
  $ tm script ls

DESCRIPTION
  列出用户配置目录下的所有脚本

ALIASES
  $ tm script list
  $ tm script ls

EXAMPLES
  $ tm script ls
```

## `tm script open`

打开脚本文件目录（供人类使用，AI 请勿调用）

```
USAGE
  $ tm script open

DESCRIPTION
  打开脚本文件目录（供人类使用，AI 请勿调用）

ALIASES
  $ tm script open
  $ tm script opendcriptsdir

EXAMPLES
  $ tm script open
```

## `tm script opendcriptsdir`

打开脚本文件目录（供人类使用，AI 请勿调用）

```
USAGE
  $ tm script opendcriptsdir

DESCRIPTION
  打开脚本文件目录（供人类使用，AI 请勿调用）

ALIASES
  $ tm script open
  $ tm script opendcriptsdir

EXAMPLES
  $ tm script opendcriptsdir
```

## `tm scripts add PATH`

添加脚本到用户配置目录

```
USAGE
  $ tm scripts add PATH

ARGUMENTS
  PATH  脚本文件路径

DESCRIPTION
  添加脚本到用户配置目录

ALIASES
  $ tm script add
  $ tm script addscript

EXAMPLES
  $ tm scripts add ./script.ps1
```

_See code: [src/commands/scripts/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/scripts/add.ts)_

## `tm scripts list`

列出用户配置目录下的所有脚本

```
USAGE
  $ tm scripts list

DESCRIPTION
  列出用户配置目录下的所有脚本

ALIASES
  $ tm script list
  $ tm script ls

EXAMPLES
  $ tm scripts list
```

_See code: [src/commands/scripts/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/scripts/list.ts)_

## `tm scripts open`

打开脚本文件目录（供人类使用，AI 请勿调用）

```
USAGE
  $ tm scripts open

DESCRIPTION
  打开脚本文件目录（供人类使用，AI 请勿调用）

ALIASES
  $ tm script open
  $ tm script opendcriptsdir

EXAMPLES
  $ tm scripts open
```

_See code: [src/commands/scripts/open.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/scripts/open.ts)_

## `tm task add`

交互式创建定时任务（会询问触发类型）。非交互创建请使用 `create daily|weekly|monthly|once|boot|logon` 子命令

```
USAGE
  $ tm task add

DESCRIPTION
  交互式创建定时任务（会询问触发类型）。非交互创建请使用 `create daily|weekly|monthly|once|boot|logon` 子命令

ALIASES
  $ tm task add

EXAMPLES
  交互式创建任务

    $ tm task add
```

## `tm task create`

交互式创建定时任务（会询问触发类型）。非交互创建请使用 `create daily|weekly|monthly|once|boot|logon` 子命令

```
USAGE
  $ tm task create

DESCRIPTION
  交互式创建定时任务（会询问触发类型）。非交互创建请使用 `create daily|weekly|monthly|once|boot|logon` 子命令

ALIASES
  $ tm task add

EXAMPLES
  交互式创建任务

    $ tm task create
```

_See code: [src/commands/task/create/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/index.ts)_

## `tm task create boot [NAME]`

创建系统启动时执行的任务（以 SYSTEM 账户运行，需要在管理员终端中创建）

```
USAGE
  $ tm task create boot [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --path=<value>         可执行文件路径

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建系统启动时执行的任务（以 SYSTEM 账户运行，需要在管理员终端中创建）

EXAMPLES
  系统启动后延迟 5 分钟执行

    $ tm task create boot myTask --path="notepad.exe" --delay=5
```

_See code: [src/commands/task/create/boot.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/boot.ts)_

## `tm task create daily [NAME]`

创建每天（或每隔 N 天）执行的定时任务

```
USAGE
  $ tm task create daily [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>] [--start-time <value>] [--interval
    <value>]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --interval=<value>     [default: 1] 每隔几天执行一次
      --path=<value>         可执行文件路径
      --start-time=<value>   开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建每天（或每隔 N 天）执行的定时任务

EXAMPLES
  每天 11:30 执行

    $ tm task create daily myTask --path="notepad.exe" --start-time="11:30"

  每隔 3 天执行，并且每 30 分钟重复一次、持续 2 小时

    $ tm task create daily myTask --path="notepad.exe" --start-time="11:30" --interval=3 --repeat-interval=30 ^
      --repeat-duration=120
```

_See code: [src/commands/task/create/daily.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/daily.ts)_

## `tm task create logon [NAME]`

创建当前用户登录时执行的任务

```
USAGE
  $ tm task create logon [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --path=<value>         可执行文件路径

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建当前用户登录时执行的任务

EXAMPLES
  登录后延迟 1 分钟执行

    $ tm task create logon myTask --path="notepad.exe" --delay=1
```

_See code: [src/commands/task/create/logon.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/logon.ts)_

## `tm task create monthly [NAME]`

创建每月执行的定时任务，可按"每月几号"或"每月第几周的星期几"触发

```
USAGE
  $ tm task create monthly [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>] [--start-time <value>] [--months
    <value>] [--monthdays <value> | --weeks-of-month <value>] [--weekdays <value> ]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive             交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>       执行参数
      --description=<value>     任务描述
      --[no-]enabled            是否启用任务
      --monthdays=<value>       每月的哪几天 (逗号分隔, 1-31, 例如: 1,15,30)
      --months=<value>          [default: 1,2,3,4,5,6,7,8,9,10,11,12] 月份 (逗号分隔, 1-12, 例如: 1,6,12)，缺省为每个月
      --path=<value>            可执行文件路径
      --start-time=<value>      开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)
      --weekdays=<value>        星期几 (逗号分隔, 0=周日, 1=周一...6=周六)，仅与 --weeks-of-month 配合使用
      --weeks-of-month=<value>  每月的第几周 (逗号分隔, 1-4, 5=最后一周, 例如: 1,3)，需配合 --weekdays

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建每月执行的定时任务，可按"每月几号"或"每月第几周的星期几"触发

EXAMPLES
  每月 1 号和 15 号 11:30 执行

    $ tm task create monthly myTask --path="notepad.exe" --start-time="11:30" --monthdays="1,15"

  仅 1 月、6 月、12 月的第一周周一执行

    $ tm task create monthly myTask --path="notepad.exe" --start-time="11:30" --months="1,6,12" --weeks-of-month="1" ^
      --weekdays="1"
```

_See code: [src/commands/task/create/monthly.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/monthly.ts)_

## `tm task create once [NAME]`

创建只执行一次的定时任务

```
USAGE
  $ tm task create once [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>] [--start-time <value>]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --path=<value>         可执行文件路径
      --start-time=<value>   执行时间 (YYYY-MM-DD HH:mm)

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建只执行一次的定时任务

EXAMPLES
  在指定日期时间执行一次

    $ tm task create once myTask --path="notepad.exe" --start-time="2026-12-31 23:59"
```

_See code: [src/commands/task/create/once.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/once.ts)_

## `tm task create weekly [NAME]`

创建每周（或每隔 N 周）在指定星期执行的定时任务

```
USAGE
  $ tm task create weekly [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--enabled]
    [--start-when-available] [--hidden] [--wake-to-run] [--disallow-start-on-batteries] [--stop-on-batteries]
    [--run-highest] [--multiple-instances ignore-new|parallel|queue|stop-existing] [--time-limit <value>] [--end-time
    <value>] [--repeat-duration <value> --repeat-interval <value>] [--delay <value>] [--start-time <value>] [--weekdays
    <value>] [--interval <value>]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务（触发类型已由子命令确定，不再询问）
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --interval=<value>     [default: 1] 每隔几周执行一次
      --path=<value>         可执行文件路径
      --start-time=<value>   开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)
      --weekdays=<value>     星期几 (逗号分隔, 0=周日, 1=周一...6=周六, 例如: 1,3,5)

高级选项 FLAGS
  --delay=<value>                延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟
  --disallow-start-on-batteries  使用电池供电时不启动任务
  --end-time=<value>             触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)
  --hidden                       隐藏任务
  --multiple-instances=<option>  任务已在运行时再次触发的处理策略 (默认 ignore-new)
                                 <options: ignore-new|parallel|queue|stop-existing>
  --repeat-duration=<value>      重复执行持续 N 分钟 (缺省表示无限期)
  --repeat-interval=<value>      触发后每隔 N 分钟重复执行
  --run-highest                  以最高权限运行 (需要在管理员终端中创建)
  --start-when-available         错过启动时间后补运行
  --stop-on-batteries            切换到电池供电时停止任务
  --time-limit=<value>           执行时限(分钟)，0 表示不限制 (系统默认 72 小时)
  --[no-]wake-to-run             唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)

DESCRIPTION
  创建每周（或每隔 N 周）在指定星期执行的定时任务

EXAMPLES
  每周一、三、五 11:30 执行

    $ tm task create weekly myTask --path="notepad.exe" --start-time="11:30" --weekdays="1,3,5"

  每隔 2 周的周一执行

    $ tm task create weekly myTask --path="notepad.exe" --start-time="11:30" --weekdays="1" --interval=2
```

_See code: [src/commands/task/create/weekly.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/create/weekly.ts)_

## `tm task del [NAME]`

删除数据库中的定时任务及其关联配置

```
USAGE
  $ tm task del [NAME] [-i] [--id <value>] [--all] [-f]

ARGUMENTS
  [NAME]  要删除的任务名称

FLAGS
  -f, --force        强制删除，不进行确认
  -i, --interactive  交互式选择要删除的任务
      --all          删除所有任务
      --id=<value>   通过ID删除任务

DESCRIPTION
  删除数据库中的定时任务及其关联配置

ALIASES
  $ tm task remove
  $ tm task del

EXAMPLES
  交互式删除任务

    $ tm task del --interactive

  直接删除指定任务

    $ tm task del myTask

  通过ID删除任务

    $ tm task del --id=1

  删除所有任务

    $ tm task del --all --force

  强制删除（不确认）

    $ tm task del myTask --force
```

## `tm task delete [NAME]`

删除数据库中的定时任务及其关联配置

```
USAGE
  $ tm task delete [NAME] [-i] [--id <value>] [--all] [-f]

ARGUMENTS
  [NAME]  要删除的任务名称

FLAGS
  -f, --force        强制删除，不进行确认
  -i, --interactive  交互式选择要删除的任务
      --all          删除所有任务
      --id=<value>   通过ID删除任务

DESCRIPTION
  删除数据库中的定时任务及其关联配置

ALIASES
  $ tm task remove
  $ tm task del

EXAMPLES
  交互式删除任务

    $ tm task delete --interactive

  直接删除指定任务

    $ tm task delete myTask

  通过ID删除任务

    $ tm task delete --id=1

  删除所有任务

    $ tm task delete --all --force

  强制删除（不确认）

    $ tm task delete myTask --force
```

_See code: [src/commands/task/delete.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/delete.ts)_

## `tm task list`

列出数据库中的所有定时任务

```
USAGE
  $ tm task list [-b] [-n <value>] [--enabled | --disabled] [-t daily|weekly|monthly|once|boot|logon]

FLAGS
  -b, --block          以块状格式显示详细信息
  -n, --name=<value>   按任务名称过滤（支持部分匹配）
  -t, --type=<option>  按触发类型过滤
                       <options: daily|weekly|monthly|once|boot|logon>
      --disabled       仅显示禁用的任务
      --enabled        仅显示启用的任务

DESCRIPTION
  列出数据库中的所有定时任务

ALIASES
  $ tm task list
  $ tm task ls

EXAMPLES
  用表格形式列出所有任务

    $ tm task list

  以块状格式显示详细信息

    $ tm task list --block

  过滤特定任务

    $ tm task list --name="myTask"

  过滤启用的任务

    $ tm task list --enabled
```

_See code: [src/commands/task/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/list.ts)_

## `tm task ls`

列出数据库中的所有定时任务

```
USAGE
  $ tm task ls [-b] [-n <value>] [--enabled | --disabled] [-t daily|weekly|monthly|once|boot|logon]

FLAGS
  -b, --block          以块状格式显示详细信息
  -n, --name=<value>   按任务名称过滤（支持部分匹配）
  -t, --type=<option>  按触发类型过滤
                       <options: daily|weekly|monthly|once|boot|logon>
      --disabled       仅显示禁用的任务
      --enabled        仅显示启用的任务

DESCRIPTION
  列出数据库中的所有定时任务

ALIASES
  $ tm task list
  $ tm task ls

EXAMPLES
  用表格形式列出所有任务

    $ tm task ls

  以块状格式显示详细信息

    $ tm task ls --block

  过滤特定任务

    $ tm task ls --name="myTask"

  过滤启用的任务

    $ tm task ls --enabled
```

## `tm task remove [NAME]`

删除数据库中的定时任务及其关联配置

```
USAGE
  $ tm task remove [NAME] [-i] [--id <value>] [--all] [-f]

ARGUMENTS
  [NAME]  要删除的任务名称

FLAGS
  -f, --force        强制删除，不进行确认
  -i, --interactive  交互式选择要删除的任务
      --all          删除所有任务
      --id=<value>   通过ID删除任务

DESCRIPTION
  删除数据库中的定时任务及其关联配置

ALIASES
  $ tm task remove
  $ tm task del

EXAMPLES
  交互式删除任务

    $ tm task remove --interactive

  直接删除指定任务

    $ tm task remove myTask

  通过ID删除任务

    $ tm task remove --id=1

  删除所有任务

    $ tm task remove --all --force

  强制删除（不确认）

    $ tm task remove myTask --force
```

## `tm task sync`

将数据库中的任务同步到 Windows Task Scheduler

```
USAGE
  $ tm task sync [-n <value>]

FLAGS
  -n, --name=<value>  指定要同步的任务名称

DESCRIPTION
  将数据库中的任务同步到 Windows Task Scheduler

ALIASES
  $ tm task sync
  $ tm task sync2schd

EXAMPLES
  同步所有任务

    $ tm task sync

  同步指定任务

    $ tm task sync --name="myTask"
```

## `tm task sync2schd`

将数据库中的任务同步到 Windows Task Scheduler

```
USAGE
  $ tm task sync2schd [-n <value>]

FLAGS
  -n, --name=<value>  指定要同步的任务名称

DESCRIPTION
  将数据库中的任务同步到 Windows Task Scheduler

ALIASES
  $ tm task sync
  $ tm task sync2schd

EXAMPLES
  同步所有任务

    $ tm task sync2schd

  同步指定任务

    $ tm task sync2schd --name="myTask"
```

_See code: [src/commands/task/sync2schd.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/task/sync2schd.ts)_

## `tm ui`

启动 Web UI 服务

```
USAGE
  $ tm ui [-p <value>]

FLAGS
  -p, --port=<value>  [default: 3000] 指定服务端口

DESCRIPTION
  启动 Web UI 服务

ALIASES
  $ tm ui start
  $ tm ui run

EXAMPLES
  $ tm ui

  $ tm ui --port 8080
```

_See code: [src/commands/ui/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/ui/index.ts)_

## `tm ui run`

启动 Web UI 服务

```
USAGE
  $ tm ui run [-p <value>]

FLAGS
  -p, --port=<value>  [default: 3000] 指定服务端口

DESCRIPTION
  启动 Web UI 服务

ALIASES
  $ tm ui start
  $ tm ui run

EXAMPLES
  $ tm ui run

  $ tm ui run --port 8080
```

## `tm ui start`

启动 Web UI 服务

```
USAGE
  $ tm ui start [-p <value>]

FLAGS
  -p, --port=<value>  [default: 3000] 指定服务端口

DESCRIPTION
  启动 Web UI 服务

ALIASES
  $ tm ui start
  $ tm ui run

EXAMPLES
  $ tm ui start

  $ tm ui start --port 8080
```

## `tm version`

```
USAGE
  $ tm version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/2.2.52/src/commands/version.ts)_

## `tm wtsk add TASKNAME`

手动创建定时任务

```
USAGE
  $ tm wtsk add TASKNAME [-i |  |  | [-p <value> |  | [--arguments <value> --path <value>]]] [--description
    <value>] [--start-time <value>] [--interval <value> --trigger boot|daily|logon|monthly|once|weekly] [--weekdays
    <value> ] [--monthdays <value> [--months <value> ]] [--weeks-of-month <value> ] [--start-when-available]

ARGUMENTS
  TASKNAME  任务名称

FLAGS
  -i, --psi                     交互式方式选择现有 PowerShell 脚本创建任务
  -p, --ps-script=<value>       指定PowerShell 脚本路径，自动使用 powershell.exe 执行
      --arguments=<value>       执行参数
      --description=<value>     任务描述
      --interval=<value>        [default: 1] 触发间隔 (N天/N周)
      --monthdays=<value>       每月的几号 (1-31，用逗号分隔，仅 monthly 生效)
      --months=<value>          月份 (1-12，用逗号分隔，仅 monthly 生效)
      --path=<value>            可执行文件路径
      --start-time=<value>      [default: 2026-11-07 11:30] 任务开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)
      --start-when-available    错过启动时间后是否补运行
      --trigger=<option>        [default: daily] 触发类型: daily, weekly, monthly, once, boot, logon
                                <options: boot|daily|logon|monthly|once|weekly>
      --weekdays=<value>        星期几 (0-6，0为周日，用逗号分隔，仅 weekly/monthly 生效)
      --weeks-of-month=<value>  第几周 (1-4, 5表示最后一周，用逗号分隔，仅 monthly 配合 weekdays 生效)

DESCRIPTION
  手动创建定时任务

EXAMPLES
  交互式选择现有 PowerShell 脚本创建任务

    $ tm wtsk add testTask --psi

  创建每天运行的定时任务，每隔1天触发一次

    $ tm wtsk add testTask --path="notepad.exe" --trigger=daily --interval=1 --start-time="11:30"

  创建每周一、周三、周五运行的定时任务

    $ tm wtsk add testTask --path="notepad.exe" --trigger=weekly --weekdays="1,3,5" --start-time="14:30"

  创建每月1号、15号运行的定时任务

    $ tm wtsk add testTask --path="notepad.exe" --trigger=monthly --months="1,2,3,4,5,6,7,8,9,10,11,12" ^
      --monthdays="1,15" --start-time="20:00"

  创建按照月、周、星期几的组合来运行的定时任务(例如:每季度最后一周的周五)

    $ tm wtsk add testTask --path="notepad.exe" --trigger=monthly --months="3,6,9,12" --weeks-of-month="5" ^
      --weekdays="5" --start-time="23:59"
```

_See code: [src/commands/wtsk/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/wtsk/add.ts)_

## `tm wtsk del`

手动删除定时任务

```
USAGE
  $ tm wtsk del [-i | -n <value>]

FLAGS
  -i, --interactive       交互式选择任务
  -n, --taskName=<value>  任务名称

DESCRIPTION
  手动删除定时任务

ALIASES
  $ tm wtsk del
  $ tm wtsk delete

EXAMPLES
  $ tm wtsk del -n myTask
```

_See code: [src/commands/wtsk/del.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/wtsk/del.ts)_

## `tm wtsk delete`

手动删除定时任务

```
USAGE
  $ tm wtsk delete [-i | -n <value>]

FLAGS
  -i, --interactive       交互式选择任务
  -n, --taskName=<value>  任务名称

DESCRIPTION
  手动删除定时任务

ALIASES
  $ tm wtsk del
  $ tm wtsk delete

EXAMPLES
  $ tm wtsk delete -n myTask
```

## `tm wtsk list`

手动列出所有定时任务

```
USAGE
  $ tm wtsk list [-b] [-l <value>]

FLAGS
  -b, --[no-]block     使用块状格式显示任务详情
  -l, --limit=<value>  限制输出的任务数量

DESCRIPTION
  手动列出所有定时任务

ALIASES
  $ tm wtsk list
  $ tm wtsk ls

EXAMPLES
  $ tm wtsk list

  $ tm wtsk list --block

  $ tm wtsk list --limit 10

  $ tm wtsk list -l 5 --block
```

_See code: [src/commands/wtsk/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.28/src/commands/wtsk/list.ts)_

## `tm wtsk ls`

手动列出所有定时任务

```
USAGE
  $ tm wtsk ls [-b] [-l <value>]

FLAGS
  -b, --[no-]block     使用块状格式显示任务详情
  -l, --limit=<value>  限制输出的任务数量

DESCRIPTION
  手动列出所有定时任务

ALIASES
  $ tm wtsk list
  $ tm wtsk ls

EXAMPLES
  $ tm wtsk ls

  $ tm wtsk ls --block

  $ tm wtsk ls --limit 10

  $ tm wtsk ls -l 5 --block
```
<!-- commandsstop -->
