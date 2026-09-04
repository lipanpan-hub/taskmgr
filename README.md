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

## 功能一览

- 六种触发类型：`daily`、`weekly`、`monthly`、`once`、`boot`、`logon`
- 交互式创建/删除（`prompts` + `fuse.js` 模糊补全）
- PowerShell 脚本库管理：脚本集中存放在配置目录，创建任务时可交互选择
- Web UI：`tm ui` 启动 Express + Socket.IO 服务，浏览器里增删改查任务，多端实时同步
- 登录时自动同步：首次运行会注册一个 `AutoSync` 任务，用户登录时静默把数据库任务同步到 Windows

# 安装方法

## 环境要求

- Windows（其他平台会在启动时给出警告并跳过所有初始化）
- Node.js >= 18
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
tm task create myTask --path="notepad.exe" --trigger=daily --start-time="11:30" --interval=3

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

> ⚠️ Web 服务**没有任何鉴权**，且 CORS 允许所有来源、监听在全部网络接口上。任何能访问该端口的人都可以增删任务，请只在本机或可信网络中使用，必要时用防火墙限制该端口。

Web UI 操作的是**数据库**，改完仍需 `tm task sync2schd`（或等下次登录由 AutoSync 触发）才会落到 Windows。

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
- **同步是覆盖式的**。同名任务会被直接覆盖；数据库里删掉的任务不会自动从 Windows 移除。
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

注意：开发模式下 DLL 路径按 `process.cwd()` 推导，必须在项目根目录执行 `bin/dev.js`，否则找不到 `TaskScheduler.2.12.2\lib\net45\*.dll`。


<!-- commands -->
# Command Topics

* [`tm autocomplete`](docs/autocomplete.md) - Display autocomplete installation instructions.
* [`tm help`](docs/help.md) - 显示帮助信息
* [`tm scripts`](docs/scripts.md) - 脚本管理命令：添加、列出脚本并打开脚本目录
* [`tm task`](docs/task.md) - 面向 AI 调用的 Windows 定时任务管理命令：创建、删除、查询任务并同步到任务计划程序
* [`tm ui`](docs/ui.md) - 启动 Web UI 服务
* [`tm version`](docs/version.md) - 显示版本信息
* [`tm wtsk`](docs/wtsk.md) - 面向人类使用的 Windows 定时任务管理命令：手动创建、删除与列出任务

<!-- commandsstop -->
