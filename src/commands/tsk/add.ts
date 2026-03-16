import {Args, Command, Flags} from '@oclif/core'
import {copyFileSync, readdirSync} from 'node:fs'
import {basename, join} from 'node:path'
import prompts from 'prompts'

import {createScheduledTask} from '../../lib/task-scheduler.js'

export default class Add extends Command {
  static args = {
    taskName: Args.string({description: '任务名称', required: true}),
  }
  static description = '创建定时任务'
  static examples = [
    String.raw`<%= config.bin %> <%= command.id %> myTask --path "C:\app.exe" --trigger daily --time "09:00"`,
    String.raw`<%= config.bin %> <%= command.id %> backupTask --path "C:\backup.exe" --arguments "--full --dest D:\backup"`,
    String.raw`<%= config.bin %> <%= command.id %> reportTask --path "C:\report.exe" --arguments '-f json -o "output.txt"' --trigger weekly`,
    String.raw`<%= config.bin %> <%= command.id %> psTask --path "powershell.exe" --arguments '-ExecutionPolicy Bypass -File "C:\scripts\cleanup.ps1"' --trigger daily`,
    String.raw`<%= config.bin %> <%= command.id %> psInlineTask --path "powershell.exe" --arguments '-Command "Get-ChildItem C:\temp | Remove-Item -Recurse -Force"' --trigger weekly`,
    String.raw`<%= config.bin %> <%= command.id %> scriptTask --ps-script "C:\scripts\cleanup.ps1" --trigger daily`,
  ]
  static flags = {
    path: Flags.string({
      description: '可执行文件路径'
    }),
    arguments: Flags.string({
      dependsOn: ['path'],
      description: '执行参数',
    }),

    'ps-script': Flags.file({
      char: 'p',
      description: 'PowerShell 脚本路径，自动使用 powershell.exe 执行',
      exclusive: ['path', 'arguments'],
      exists: true,
    }),
    psi: Flags.boolean({
      char: 'i',
      description: '交互式方式选择 PowerShell 脚本',
      exclusive: ['path', 'arguments', 'ps-script'],
    }),
    description: Flags.string({
      description: '任务描述'
    }),
    hidden: Flags.boolean({
      allowNo: true,
      default: true, 
      description: '是否隐藏任务'
    }),
    time: Flags.string({
      default: '09:00', 
      description: '任务开始时间 (HH:mm)'
    }),
    trigger: Flags.string({
      default: 'daily',
      description: '触发类型: daily, weekly, monthly, once, boot, logon',
      options: ['boot', 'daily', 'logon', 'monthly', 'once', 'weekly'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)

    this.debug('flags', flags)

    if (!flags.path && !flags['ps-script'] && !flags.psi) {
      this.error('必须指定 --path, --ps-script 或 --psi')
    }

    let executablePath = flags.path
    let execArguments = flags.arguments
    if (flags['ps-script']) {
      // 先将脚本复制到配置目录下的 scripts 文件夹
      const scriptsDir = join(this.config.configDir, 'scripts')
      const fileName = basename(flags['ps-script'])
      const destPath = join(scriptsDir, fileName)
      copyFileSync(flags['ps-script'], destPath)

      executablePath = 'powershell.exe'
      execArguments = `-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "${destPath}"`
    }

    if (flags.psi) {
      const scriptsDir = join(this.config.configDir, 'scripts')
      const scripts = readdirSync(scriptsDir).filter(f => f.endsWith('.ps1'))

      if (scripts.length === 0) {
        this.error('scripts 目录下没有 PowerShell 脚本')
      }

      const response = await prompts([
        {
          type: 'select',
          name: 'selected',
          message: '选择要执行的脚本',
          choices: scripts.map(s => ({ title: s, value: s })),
        },
        {
          type: 'select',
          name: 'trigger',
          message: '选择触发类型',
          choices: [
            { title: '每天', value: 'daily' },
            { title: '每周', value: 'weekly' },
            { title: '每月', value: 'monthly' },
            { title: '一次', value: 'once' },
            { title: '启动时', value: 'boot' },
            { title: '登录时', value: 'logon' },
          ],
          initial: 0,
        },
        {
          type: 'text',
          name: 'time',
          message: '输入开始时间 (HH:mm)',
          initial: '09:00',
          validate: (value: string) => /^\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (HH:mm)',
        },
      ])

      executablePath = 'cmd.exe'
      execArguments = `/c start /min "" powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "${join(scriptsDir, response.selected)}"`
      // execArguments = `-ExecutionPolicy Bypass -File "${join(scriptsDir, response.selected)}"`

      // 覆盖 flags 中的值
      flags.trigger = response.trigger
      flags.time = response.time
    }

    const result = await createScheduledTask({
      arguments: execArguments,
      description: flags.description,
      disallowStartIfOnBatteries: false,
      enabled: true,
      executablePath: executablePath!,
      hidden: flags.hidden,
      startTime: flags.time,
      startWhenAvailable: false,    // 错过启动时间后是否自动启动
      stopIfGoingOnBatteries: false,  // 电池供电时是否停止任务
      taskName: args.taskName,
      triggerType: flags.trigger as 'boot' | 'daily' | 'logon' | 'monthly' | 'once' | 'weekly',
      wakeToRun: true,
    })

    this.log(result)
  }
}
