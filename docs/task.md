`tm task`
=========

面向 AI 调用的 Windows 定时任务管理命令：创建、删除、查询任务并同步到任务计划程序

* [`tm task create [NAME]`](#tm-task-create-name)
* [`tm task delete [NAME]`](#tm-task-delete-name)
* [`tm task list`](#tm-task-list)
* [`tm task sync`](#tm-task-sync)
* [`tm task sync2schd`](#tm-task-sync2schd)

## `tm task create [NAME]`

创建定时任务到数据库

```
USAGE
  $ tm task create [NAME] [-i | --path <value> | --arguments <value> | --description <value> | --trigger
    daily|weekly|monthly|once|boot|logon | --start-time <value> | --interval <value> | --weekdays <value> | --months
    <value> | --monthdays <value> | --weeks-of-month <value>] [--enabled]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive             交互式创建任务
      --arguments=<value>       执行参数
      --description=<value>     任务描述
      --[no-]enabled            是否启用任务
      --interval=<value>        间隔 (daily: 每隔几天, weekly: 每隔几周)
      --monthdays=<value>       每月的哪几天 (逗号分隔, 1-31, 例如: 1,15,30)
      --months=<value>          月份 (逗号分隔, 1-12, 例如: 1,6,12)
      --path=<value>            可执行文件路径
      --start-time=<value>      开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)
      --trigger=<option>        触发类型
                                <options: daily|weekly|monthly|once|boot|logon>
      --weekdays=<value>        星期几 (逗号分隔, 0=周日, 1=周一...6=周六, 例如: 1,3,5)
      --weeks-of-month=<value>  每月的第几周 (逗号分隔, 1-5, 例如: 1,3)

DESCRIPTION
  创建定时任务到数据库

EXAMPLES
  交互式创建任务

    $ tm task create --interactive

  创建每天执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=daily --start-time="11:30"

  创建每隔3天执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=daily --start-time="11:30" --interval=3

  创建每周一、三、五执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=weekly --start-time="11:30" --weekdays="1,3,5"

  创建每隔2周的周一执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=weekly --start-time="11:30" --weekdays="1" --interval=2

  创建每月1号和15号执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=monthly --start-time="11:30" ^
      --months="1,2,3,4,5,6,7,8,9,10,11,12" --monthdays="1,15"

  创建每年1月、6月、12月的第一周周一执行的任务

    $ tm task create myTask --path="notepad.exe" --trigger=monthly --start-time="11:30" --months="1,6,12" ^
      --weeks-of-month="1" --weekdays="1"
```

_See code: [src/commands/task/create.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/task/create.ts)_

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

_See code: [src/commands/task/delete.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/task/delete.ts)_

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

EXAMPLES
  列出所有任务

    $ tm task list

  以块状格式显示

    $ tm task list --block

  过滤特定任务

    $ tm task list --name="myTask"

  过滤启用的任务

    $ tm task list --enabled
```

_See code: [src/commands/task/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/task/list.ts)_

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

EXAMPLES
  同步所有任务

    $ tm task sync2schd

  同步指定任务

    $ tm task sync2schd --name="myTask"
```

_See code: [src/commands/task/sync2schd.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.3.24/src/commands/task/sync2schd.ts)_
