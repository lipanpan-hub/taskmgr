`tm autocomplete`
=================

Display autocomplete installation instructions.

* [`tm autocomplete [SHELL]`](#tm-autocomplete-shell)

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
