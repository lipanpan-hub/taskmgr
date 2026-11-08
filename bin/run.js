#!/usr/bin/env node

import {execute} from '@oclif/core'

// Windows 下 pwsh/cmd 默认不设 SHELL, oclif 每次启动会同步拉起 PowerShell 探测父进程(约 600ms)
// 预设占位值可跳过探测; config.shell 只影响 help 续行符与 autocomplete 默认 shell
if ((process.platform === 'win32') && (!process.env.SHELL)) {
  process.env.SHELL = 'powershell'
}

await execute({dir: import.meta.url})
