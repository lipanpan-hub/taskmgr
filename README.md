@lppx/taskmgr
=================

定时任务管理器


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@lppx/taskmgr.svg)](https://npmjs.org/package/@lppx/taskmgr)
[![Downloads/week](https://img.shields.io/npm/dw/@lppx/taskmgr.svg)](https://npmjs.org/package/@lppx/taskmgr)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @lppx/taskmgr
$ tm COMMAND
running command...
$ tm (--version)
@lppx/taskmgr/2.2.0 win32-x64 node-v24.11.0
$ tm --help [COMMAND]
USAGE
  $ tm COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tm autocomplete [SHELL]`](#tm-autocomplete-shell)
* [`tm help [COMMAND]`](#tm-help-command)
* [`tm scripts add PATH`](#tm-scripts-add-path)
* [`tm scripts list`](#tm-scripts-list)
* [`tm scripts open`](#tm-scripts-open)
* [`tm task create [NAME]`](#tm-task-create-name)
* [`tm task delete [NAME]`](#tm-task-delete-name)
* [`tm task list`](#tm-task-list)
* [`tm task sync2schd`](#tm-task-sync2schd)
* [`tm ui`](#tm-ui)
* [`tm version`](#tm-version)
* [`tm wtsk add TASKNAME`](#tm-wtsk-add-taskname)
* [`tm wtsk del`](#tm-wtsk-del)
* [`tm wtsk list`](#tm-wtsk-list)

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

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.40/src/commands/autocomplete/index.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.37/src/commands/help.ts)_

## `tm scripts add PATH`

添加脚本到用户配置目录

```
USAGE
  $ tm scripts add PATH

ARGUMENTS
  PATH  脚本文件路径

DESCRIPTION
  添加脚本到用户配置目录

EXAMPLES
  $ tm scripts add ./script.ps1
```

_See code: [src/commands/scripts/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/scripts/add.ts)_

## `tm scripts list`

列出用户配置目录下的所有脚本

```
USAGE
  $ tm scripts list

DESCRIPTION
  列出用户配置目录下的所有脚本

EXAMPLES
  $ tm scripts list
```

_See code: [src/commands/scripts/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/scripts/list.ts)_

## `tm scripts open`

打开脚本文件目录

```
USAGE
  $ tm scripts open

DESCRIPTION
  打开脚本文件目录

EXAMPLES
  $ tm scripts open
```

_See code: [src/commands/scripts/open.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/scripts/open.ts)_

## `tm task create [NAME]`

创建定时任务到数据库

```
USAGE
  $ tm task create [NAME] [-i] [--path <value>] [--arguments <value>] [--description <value>] [--trigger
    daily|weekly|monthly|once|boot|logon] [--start-time <value>] [--enabled]

ARGUMENTS
  [NAME]  任务名称

FLAGS
  -i, --interactive          交互式创建任务
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]enabled         是否启用任务
      --path=<value>         可执行文件路径
      --start-time=<value>   开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)
      --trigger=<option>     触发类型
                             <options: daily|weekly|monthly|once|boot|logon>

DESCRIPTION
  创建定时任务到数据库

EXAMPLES
  交互式创建任务

    $ tm task create --interactive

  直接创建每天任务

    $ tm task create myTask --path="notepad.exe" --trigger=daily --start-time="09:00"
```

_See code: [src/commands/task/create.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/task/create.ts)_

## `tm task delete [NAME]`

删除数据库中的定时任务及其关联配置

```
USAGE
  $ tm task delete [NAME] [-i] [--id <value>] [-f]

ARGUMENTS
  [NAME]  要删除的任务名称

FLAGS
  -f, --force        强制删除，不进行确认
  -i, --interactive  交互式选择要删除的任务
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

  强制删除（不确认）

    $ tm task delete myTask --force
```

_See code: [src/commands/task/delete.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/task/delete.ts)_

## `tm task list`

列出数据库中的所有定时任务

```
USAGE
  $ tm task list [-d] [-b] [-f <value>] [--enabled | --disabled] [-t daily|weekly|monthly|once|boot|logon]

FLAGS
  -b, --block           以块状格式显示详细信息（需配合 --detail 使用）
  -d, --detail          显示任务详细信息
  -f, --filter=<value>  按任务名称过滤（支持部分匹配）
  -t, --type=<option>   按触发类型过滤
                        <options: daily|weekly|monthly|once|boot|logon>
      --disabled        仅显示禁用的任务
      --enabled         仅显示启用的任务

DESCRIPTION
  列出数据库中的所有定时任务

EXAMPLES
  列出所有任务

    $ tm task list

  显示详细信息（单行）

    $ tm task list --detail

  显示详细信息（块状）

    $ tm task list --detail --block

  过滤特定任务

    $ tm task list --filter="myTask"

  过滤启用的任务

    $ tm task list --enabled
```

_See code: [src/commands/task/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/task/list.ts)_

## `tm task sync2schd`

将数据库中的任务同步到 Windows Task Scheduler

```
USAGE
  $ tm task sync2schd [-n <value>]

FLAGS
  -n, --name=<value>  指定要同步的任务名称

DESCRIPTION
  将数据库中的任务同步到 Windows Task Scheduler

EXAMPLES
  同步所有任务

    $ tm task sync2schd

  同步指定任务

    $ tm task sync2schd --name="myTask"
```

_See code: [src/commands/task/sync2schd.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/task/sync2schd.ts)_

## `tm ui`

启动 Web UI 服务

```
USAGE
  $ tm ui [-p <value>]

FLAGS
  -p, --port=<value>  [default: 3000] 指定服务端口

DESCRIPTION
  启动 Web UI 服务

EXAMPLES
  $ tm ui

  $ tm ui --port 8080
```

_See code: [src/commands/ui/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/ui/index.ts)_

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

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/2.2.37/src/commands/version.ts)_

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
      --start-time=<value>      [default: 2026-04-16 09:00] 任务开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)
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

    $ tm wtsk add testTask --path="notepad.exe" --trigger=daily --interval=1 --start-time="09:00"

  创建每周一、周三、周五运行的定时任务

    $ tm wtsk add testTask --path="notepad.exe" --trigger=weekly --weekdays="1,3,5" --start-time="14:30"

  创建每月1号、15号运行的定时任务

    $ tm wtsk add testTask --path="notepad.exe" --trigger=monthly --months="1,2,3,4,5,6,7,8,9,10,11,12" ^
      --monthdays="1,15" --start-time="20:00"

  创建按照月、周、星期几的组合来运行的定时任务(例如:每季度最后一周的周五)

    $ tm wtsk add testTask --path="notepad.exe" --trigger=monthly --months="3,6,9,12" --weeks-of-month="5" ^
      --weekdays="5" --start-time="23:59"
```

_See code: [src/commands/wtsk/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/wtsk/add.ts)_

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

_See code: [src/commands/wtsk/del.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/wtsk/del.ts)_

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

_See code: [src/commands/wtsk/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v2.2.0/src/commands/wtsk/list.ts)_
<!-- commandsstop -->
