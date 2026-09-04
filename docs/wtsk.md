`tm wtsk`
=========

面向人类使用的 Windows 定时任务管理命令：手动创建、删除与列出任务

* [`tm wtsk add TASKNAME`](#tm-wtsk-add-taskname)
* [`tm wtsk del`](#tm-wtsk-del)
* [`tm wtsk list`](#tm-wtsk-list)

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
      --start-time=<value>      [default: 2026-09-04 11:30] 任务开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)
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

_See code: [src/commands/wtsk/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/wtsk/add.ts)_

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

EXAMPLES
  $ tm wtsk del -n myTask
```

_See code: [src/commands/wtsk/del.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/wtsk/del.ts)_

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

EXAMPLES
  $ tm wtsk list

  $ tm wtsk list --block

  $ tm wtsk list --limit 10

  $ tm wtsk list -l 5 --block
```

_See code: [src/commands/wtsk/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/wtsk/list.ts)_
