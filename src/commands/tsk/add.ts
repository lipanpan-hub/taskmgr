import {Args, Command, Flags} from '@oclif/core'

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
      description: '执行参数'
    }),

    'ps-script': Flags.string({
      char: 'p',
      description: 'PowerShell 脚本路径，自动使用 powershell.exe 执行'
    }),
    description: Flags.string({
      description: '任务描述'
    }),
    hidden: Flags.boolean({
      allowNo: true,
      default: true, 
      description: '是否隐藏任务'
    }),
    'start-when-available': Flags.boolean({
      allowNo: true,
      default: false, 
      description: '错过启动时间后是否自动启动'
    }),
    'stop-on-battery': Flags.boolean({
      allowNo: true,
      default: false, 
      description: '使用电池供电时是否停止任务'
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
    wake: Flags.boolean({
      allowNo: true,
      default: true, 
      description: '是否唤醒计算机运行任务'
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)

    if (!flags.path && !flags['ps-script']) {
      this.error('必须指定 --path 或 --ps-script')
    }

    let executablePath = flags.path
    let execArguments = flags.arguments
    if (flags['ps-script']) {
      executablePath = 'powershell.exe'
      execArguments = `-ExecutionPolicy Bypass -File "${flags['ps-script']}"`
    }

    const result = await createScheduledTask({
      arguments: execArguments,
      description: flags.description,
      disallowStartIfOnBatteries: false,
      enabled: true,
      executablePath: executablePath!,
      hidden: flags.hidden,
      startTime: flags.time,
      startWhenAvailable: flags['start-when-available'],
      stopIfGoingOnBatteries: flags['stop-on-battery'],
      taskName: args.taskName,
      triggerType: flags.trigger as 'boot' | 'daily' | 'logon' | 'monthly' | 'once' | 'weekly',
      wakeToRun: flags.wake,
    })

    this.log(result)
  }
}
