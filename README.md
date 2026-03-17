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
@lppx/taskmgr/1.0.1 win32-x64 node-v24.11.0
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
* [`tm tsk add TASKNAME`](#tm-tsk-add-taskname)
* [`tm tsk del`](#tm-tsk-del)
* [`tm tsk list`](#tm-tsk-list)
* [`tm ui`](#tm-ui)
* [`tm version`](#tm-version)

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

_See code: [src/commands/scripts/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/scripts/add.ts)_

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

_See code: [src/commands/scripts/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/scripts/list.ts)_

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

_See code: [src/commands/scripts/open.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/scripts/open.ts)_

## `tm tsk add TASKNAME`

创建定时任务

```
USAGE
  $ tm tsk add TASKNAME [-i |  |  | [-p <value> |  | [--arguments <value> --path <value>]]] [--description
    <value>] [--hidden] [--time <value>] [--trigger boot|daily|logon|monthly|once|weekly]

ARGUMENTS
  TASKNAME  任务名称

FLAGS
  -i, --psi                  交互式方式选择 PowerShell 脚本创建任务
  -p, --ps-script=<value>    PowerShell 脚本路径，自动使用 powershell.exe 执行
      --arguments=<value>    执行参数
      --description=<value>  任务描述
      --[no-]hidden          是否隐藏任务
      --path=<value>         可执行文件路径
      --time=<value>         [default: 09:00] 任务开始时间 (HH:mm)
      --trigger=<option>     [default: daily] 触发类型: daily, weekly, monthly, once, boot, logon
                             <options: boot|daily|logon|monthly|once|weekly>

DESCRIPTION
  创建定时任务

EXAMPLES
  $ tm tsk add myTask --path "C:\app.exe" --trigger daily --time "09:00"

  $ tm tsk add backupTask --path "C:\backup.exe" --arguments "--full --dest D:\backup"

  $ tm tsk add reportTask --path "C:\report.exe" --arguments '-f json -o "output.txt"' --trigger weekly

  $ tm tsk add psTask --path "powershell.exe" --arguments '-ExecutionPolicy Bypass -File "C:\scripts\cleanup.ps1"' --trigger daily

  $ tm tsk add psInlineTask --path "powershell.exe" --arguments '-Command "Get-ChildItem C:\temp | Remove-Item -Recurse -Force"' --trigger weekly

  $ tm tsk add scriptTask --ps-script "C:\scripts\cleanup.ps1" --trigger daily
```

_See code: [src/commands/tsk/add.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/tsk/add.ts)_

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

_See code: [src/commands/tsk/del.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/tsk/del.ts)_

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

_See code: [src/commands/tsk/list.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/tsk/list.ts)_

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

_See code: [src/commands/ui/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v1.0.1/src/commands/ui/index.ts)_

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
<!-- commandsstop -->
