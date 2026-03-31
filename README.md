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
@lppx/taskmgr/1.0.3 win32-x64 node-v24.11.0
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
* [`tm task create`](#tm-task-create)
* [`tm task delete`](#tm-task-delete)
* [`tm task list`](#tm-task-list)
* [`tm task sync`](#tm-task-sync)
* [`tm tsk add TASKNAME`](#tm-tsk-add-taskname)
* [`tm tsk del`](#tm-tsk-del)
* [`tm tsk list`](#tm-tsk-list)
* [`tm ui`](#tm-ui)
* [`tm version`](#tm-version)
* [`tm which`](#tm-which)

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

_See code: [src/commands/scripts/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/scripts/add.ts)_

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

_See code: [src/commands/scripts/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/scripts/list.ts)_

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

_See code: [src/commands/scripts/open.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/scripts/open.ts)_

## `tm task create`

向数据库中创建一条任务记录

```
USAGE
  $ tm task create [-i | -n <value> | -d <value> | -p <value> | -a <value> | -t
    daily|weekly|monthly|once|boot|logon | --time <value> | --enabled]

FLAGS
  -a, --args=<value>         执行参数
  -d, --description=<value>  任务描述
  -i, --interactive          交互式创建任务
  -n, --name=<value>         任务名称
  -p, --path=<value>         可执行文件路径
  -t, --trigger=<option>     触发类型 (daily|weekly|monthly|once|boot|logon)
                             <options: daily|weekly|monthly|once|boot|logon>
      --[no-]enabled         是否启用
      --time=<value>         开始时间 (HH:mm)

DESCRIPTION
  向数据库中创建一条任务记录

EXAMPLES
  $ tm task create -i

  $ tm task create --name "备份任务" --path "C:\backup.bat" --trigger daily --time "02:00"

  $ tm task create -n "清理任务" -p "C:\clean.ps1" -t weekly --time "03:00" --args "-Force"
```

_See code: [src/commands/task/create.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/task/create.ts)_

## `tm task delete`

从数据库中删除一条任务记录

```
USAGE
  $ tm task delete

DESCRIPTION
  从数据库中删除一条任务记录

EXAMPLES
  $ tm task delete
```

_See code: [src/commands/task/delete.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/task/delete.ts)_

## `tm task list`

列出数据库中的所有任务记录

```
USAGE
  $ tm task list [-d]

FLAGS
  -d, --detailed  显示详细信息

DESCRIPTION
  列出数据库中的所有任务记录

EXAMPLES
  $ tm task list

  $ tm task list --detailed
```

_See code: [src/commands/task/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/task/list.ts)_

## `tm task sync`

将数据库中的任务同步到 Windows 系统

```
USAGE
  $ tm task sync [-v]

FLAGS
  -v, --verbose  显示详细的同步信息

DESCRIPTION
  将数据库中的任务同步到 Windows 系统

EXAMPLES
  $ tm task sync

  $ tm task sync --verbose
```

_See code: [src/commands/task/sync.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/task/sync.ts)_

## `tm tsk add TASKNAME`

创建定时任务

```
USAGE
  $ tm tsk add TASKNAME [-i |  |  | [-p <value> |  | [--arguments <value> --path <value>]]] [--description
    <value>] [--time <value>] [--trigger boot|daily|logon|monthly|once|weekly]

ARGUMENTS
  TASKNAME  任务名称

FLAGS
  -i, --psi                  交互式方式选择现有 PowerShell 脚本创建任务
  -p, --ps-script=<value>    指定PowerShell 脚本路径，自动使用 powershell.exe 执行
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --path=<value>         可执行文件路径
      --time=<value>         [default: 09:00] 任务开始时间 (HH:mm)
      --trigger=<option>     [default: daily] 触发类型: daily, weekly, monthly, once, boot, logon
                             <options: boot|daily|logon|monthly|once|weekly>

DESCRIPTION
  创建定时任务

EXAMPLES
  交互式选择现有 PowerShell 脚本创建任务

    $ tm tsk add testTask --psi
```

_See code: [src/commands/tsk/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/tsk/add.ts)_

## `tm tsk del`

删除定时任务

```
USAGE
  $ tm tsk del [-i | -n <value>]

FLAGS
  -i, --interactive       交互式选择任务
  -n, --taskName=<value>  任务名称

DESCRIPTION
  删除定时任务

EXAMPLES
  $ tm tsk del -n myTask
```

_See code: [src/commands/tsk/del.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/tsk/del.ts)_

## `tm tsk list`

列出所有定时任务

```
USAGE
  $ tm tsk list [--multi]

FLAGS
  --[no-]multi  使用多行格式显示任务详情

DESCRIPTION
  列出所有定时任务

EXAMPLES
  $ tm tsk list

  $ tm tsk list --multi
```

_See code: [src/commands/tsk/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/tsk/list.ts)_

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

_See code: [src/commands/ui/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.3/src/commands/ui/index.ts)_

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

## `tm which`

Show which plugin a command is in.

```
USAGE
  $ tm which [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Show which plugin a command is in.

EXAMPLES
  See which plugin the `help` command is in:

    $ tm which help

  Use colon separators.

    $ tm which foo:bar:baz

  Use spaces as separators.

    $ tm which foo bar baz

  Wrap command in quotes to use spaces as separators.

    $ tm which "foo bar baz"
```

_See code: [@oclif/plugin-which](https://github.com/oclif/plugin-which/blob/3.2.46/src/commands/which.ts)_
<!-- commandsstop -->
