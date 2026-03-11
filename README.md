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
@lppx/taskmgr/0.0.0 win32-x64 node-v24.11.0
$ tm --help [COMMAND]
USAGE
  $ tm COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tm hello PERSON`](#tm-hello-person)
* [`tm hello world`](#tm-hello-world)
* [`tm help [COMMAND]`](#tm-help-command)
* [`tm plugins`](#tm-plugins)
* [`tm plugins add PLUGIN`](#tm-plugins-add-plugin)
* [`tm plugins:inspect PLUGIN...`](#tm-pluginsinspect-plugin)
* [`tm plugins install PLUGIN`](#tm-plugins-install-plugin)
* [`tm plugins link PATH`](#tm-plugins-link-path)
* [`tm plugins remove [PLUGIN]`](#tm-plugins-remove-plugin)
* [`tm plugins reset`](#tm-plugins-reset)
* [`tm plugins uninstall [PLUGIN]`](#tm-plugins-uninstall-plugin)
* [`tm plugins unlink [PLUGIN]`](#tm-plugins-unlink-plugin)
* [`tm plugins update`](#tm-plugins-update)

## `tm hello PERSON`

Say hello

```
USAGE
  $ tm hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ tm hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/lipanpan-hub/taskmgr/blob/v0.0.0/src/commands/hello/index.ts)_

## `tm hello world`

Say hello world

```
USAGE
  $ tm hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ tm hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/lipanpan-hub/taskmgr/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `tm plugins`

List installed plugins.

```
USAGE
  $ tm plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ tm plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/index.ts)_

## `tm plugins add PLUGIN`

Installs a plugin into tm.

```
USAGE
  $ tm plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into tm.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TM_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TM_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ tm plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ tm plugins add myplugin

  Install a plugin from a github url.

    $ tm plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ tm plugins add someuser/someplugin
```

## `tm plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ tm plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ tm plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/inspect.ts)_

## `tm plugins install PLUGIN`

Installs a plugin into tm.

```
USAGE
  $ tm plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into tm.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TM_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TM_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ tm plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ tm plugins install myplugin

  Install a plugin from a github url.

    $ tm plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ tm plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/install.ts)_

## `tm plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ tm plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ tm plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/link.ts)_

## `tm plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tm plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tm plugins unlink
  $ tm plugins remove

EXAMPLES
  $ tm plugins remove myplugin
```

## `tm plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ tm plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/reset.ts)_

## `tm plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tm plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tm plugins unlink
  $ tm plugins remove

EXAMPLES
  $ tm plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/uninstall.ts)_

## `tm plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ tm plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tm plugins unlink
  $ tm plugins remove

EXAMPLES
  $ tm plugins unlink myplugin
```

## `tm plugins update`

Update installed plugins.

```
USAGE
  $ tm plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.58/src/commands/plugins/update.ts)_
<!-- commandsstop -->
