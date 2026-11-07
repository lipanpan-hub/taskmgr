`tm task`
=========

面向 AI 调用的 Windows 定时任务管理命令：创建、删除、查询任务并同步到任务计划程序

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
