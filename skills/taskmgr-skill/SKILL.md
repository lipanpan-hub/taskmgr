---
name: taskmgr-skill
description: 用 tm 命令行工具管理 Windows 定时任务（计划任务）。当用户要求创建/查询/删除定时任务、定时执行脚本或程序、定时关机休眠、设置每天/每周/每月/开机/登录时自动运行时使用。
keywords: tm, taskmgr, 定时任务, 计划任务, 定时执行, 定时关机, 开机自启, cron, schtasks, Task Scheduler
version: 1.0.0
---

# tm 定时任务管理

`tm` 管理 Windows 任务计划程序中 `\taskmgr` 文件夹下的定时任务。任务配置存于本地 SQLite，并同步到系统任务计划程序。

## 铁律

1. 只用 `tm task` 子命令，它是为非交互调用设计的。绝不使用 `tm wtsk`（面向人类，含交互式提示）。
2. 绝不传 `-i` / `--interactive` / `--psi`，这些会挂起等待键盘输入。
3. 删除必须带 `--force`，否则会卡在确认提示。
4. `tm task create` 一步到位：写库 + 建触发器 + 同步到任务计划程序，任何一步失败自动回滚。创建后无需再执行同步。
5. 没有 update 命令。修改任务 = `tm task delete <名称> --force` 然后重新 create。

## 命令选择

- 创建任务 → `tm task create`
- 查看已管理的任务 → `tm task list`
- 删除任务 → `tm task delete <名称> --force`
- 数据库与系统不一致时重新同步 → `tm task sync2schd`（别名 `tm task sync`）
- 查看系统里实际的任务（只读，含下次运行时间等系统状态）→ `tm wtsk list`
- 查看可用脚本 → `tm scripts list`；把脚本纳入管理 → `tm scripts add <路径>`

## 创建任务

```
tm task create <任务名> --path=<可执行文件或运行时> --trigger=<类型> [触发器参数] [--arguments=...] [--description=...] [--no-enabled]
```

必填：任务名、`--path`、`--trigger`。

各触发类型的参数要求：

- `daily`：必填 `--start-time`；可选 `--interval=N`（每隔 N 天，默认 1）
- `weekly`：必填 `--start-time`、`--weekdays`；可选 `--interval=N`（每隔 N 周，默认 1）
- `monthly`：必填 `--start-time`、`--months`，再二选一：
  - 按日期：`--monthdays="1,15"`
  - 按周次：`--weeks-of-month="1,5"` 且必须同时给 `--weekdays`
  - 两者不能同时出现
- `once`：必填 `--start-time`，且格式必须是完整的 `YYYY-MM-DD HH:mm`
- `boot` / `logon`：不需要任何触发器参数

取值约定：

- `--start-time`：`HH:mm` 或 `YYYY-MM-DD HH:mm`。只给 `HH:mm` 时起始日期按今天补全，若该时刻已过，首次运行落到下一个周期。`once` 不接受 `HH:mm`。
- `--weekdays`：0=周日，1=周一 … 6=周六，逗号分隔
- `--months`：1-12，逗号分隔
- `--monthdays`：1-31，逗号分隔
- `--weeks-of-month`：1-4 表示第几周，5 表示最后一周
- `--no-enabled`：创建但不启用（默认启用）

## path 与 arguments 的自动优化

`--path` 可以直接写运行时名，无需绝对路径。已支持探测：`powershell`、`pwsh`、`uv`、`python`、`bun`、`node`、`deno`、`go`。

当 `--path` 是运行时名、且 `--arguments` 只包含一个脚本路径时，会自动改写成更合适的执行方式：

- `pwsh`/`powershell` + `.ps1` → 改用 `cmd.exe` 以隐藏窗口、后台静默方式执行
- `uv` + `.py` → 改成 `uv run --isolated --no-project`

要拿到这层优化，`--arguments` 里只放脚本路径，不要自己拼 `-File`、`-ExecutionPolicy` 等参数。需要自行控制完整命令行时，`--path` 给绝对路径，`--arguments` 给完整参数串。

脚本目录：`%LOCALAPPDATA%\lppxtaskmgr\scripts`。先用 `tm scripts list` 拿到确切路径再引用，不要凭猜测拼路径。

## 查询与删除

```
tm task list                      # 表格视图
tm task list --block              # 详细块状视图（含触发器配置）
tm task list --name=<关键字>      # 名称模糊过滤
tm task list --enabled            # 仅启用；--disabled 仅禁用
tm task list --type=daily         # 按触发类型过滤

tm task delete <任务名> --force
tm task delete --id=<ID> --force
tm task delete --all --force      # 危险：清空全部任务，执行前必须先向用户确认
```

删除会同时清理触发器配置和系统任务计划程序中的对应任务。

## 常见错误

- `必须提供可执行文件路径 (--path)` / `必须提供触发类型 (--trigger)` → 漏了必填项
- `daily 触发类型需要 --start-time 参数` → 对应触发类型的必填参数没给
- `monthly 触发类型需要 --monthdays 或 --weeks-of-month 参数` → 月触发没指定按日期还是按周次
- `使用 --weeks-of-month 时必须同时指定 --weekdays 参数` → 按周次模式缺星期
- `start-time 格式必须为 YYYY-MM-DD HH:mm` → `once` 只给了 `HH:mm`
- 命令长时间无输出 → 误用了交互式选项或漏了 `--force`，中止后改成完整参数重跑
- `同步到 Windows Task Scheduler 失败` → 任务已回滚，检查路径是否存在；系统任务写入需要足够权限

在 PowerShell 中执行时，含空格或中文的路径、参数一律用双引号包裹。

## 示例

```powershell
# 每天 23:30 静默跑一个 PowerShell 脚本
tm task create 夜间清理 --path=pwsh --arguments="C:\Users\lppx\AppData\Local\lppxtaskmgr\scripts\倒计时关机脚本.ps1" --trigger=daily --start-time="23:30" --description="每晚清理"

# 每隔 3 天 09:00 执行
tm task create 三日巡检 --path="notepad.exe" --trigger=daily --start-time="09:00" --interval=3

# 每周一三五 14:30 执行
tm task create 周报提醒 --path="notepad.exe" --trigger=weekly --start-time="14:30" --weekdays="1,3,5"

# 每隔 2 周的周一执行
tm task create 双周会 --path="notepad.exe" --trigger=weekly --start-time="10:00" --weekdays="1" --interval=2

# 每月 1 号和 15 号 20:00 执行
tm task create 月中对账 --path="notepad.exe" --trigger=monthly --start-time="20:00" --months="1,2,3,4,5,6,7,8,9,10,11,12" --monthdays="1,15"

# 每季度最后一周的周五 23:59 执行
tm task create 季度收尾 --path="notepad.exe" --trigger=monthly --start-time="23:59" --months="3,6,9,12" --weeks-of-month="5" --weekdays="5"

# 指定时刻只跑一次
tm task create 一次性提醒 --path="notepad.exe" --trigger=once --start-time="2026-10-01 08:00"

# 开机时运行
tm task create 开机启动 --path="notepad.exe" --trigger=boot

# 修改已有任务：删除后重建
tm task delete 夜间清理 --force
tm task create 夜间清理 --path=pwsh --arguments="C:\Users\lppx\AppData\Local\lppxtaskmgr\scripts\休眠脚本.ps1" --trigger=daily --start-time="22:00"
```
