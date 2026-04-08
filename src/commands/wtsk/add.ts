import {Args, Command, Flags} from '@oclif/core'
import {copyFileSync} from 'node:fs'
import {basename, join} from 'node:path'

import {createScheduledTask} from '../../lib/task-scheduler.js'
import {handlePsiInteractive} from '../../lib/task/psi-handler.js'

export default class Add extends Command {
  static args = {
    taskName: Args.string({description: '任务名称', required: true}),
  }
  static description = '手动创建定时任务'
  static examples = [
    {
      description: '交互式选择现有 PowerShell 脚本创建任务',
      command: String.raw`<%= config.bin %> <%= command.id %> testTask --psi`,
    },
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
      description: '指定PowerShell 脚本路径，自动使用 powershell.exe 执行',
      exclusive: ['path', 'arguments'],
      exists: true,
    }),
    psi: Flags.boolean({
      char: 'i',
      description: '交互式方式选择现有 PowerShell 脚本创建任务',
      exclusive: ['path', 'arguments', 'ps-script'],
    }),
    description: Flags.string({
      description: '任务描述'
    }),
    time: Flags.string({
      default: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} 09:00`, 
      description: '任务开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)'
    }),
    interval: Flags.integer({
      default: 1,
      description: '触发间隔 (N天/N周/N月)',
    }),
    trigger: Flags.string({
      default: 'daily',
      description: '触发类型: daily, weekly, monthly, once, boot, logon',
      options: ['boot', 'daily', 'logon', 'monthly', 'once', 'weekly'],
    }),
    'start-when-available': Flags.boolean({
      default: false,
      description: '错过启动时间后是否补运行',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)

    this.debug('flags', flags)

    if (!flags.path && !flags['ps-script'] && !flags.psi) {
      this.error('必须指定 --path 或 --ps-script 或 --psi')
    }

    let executablePath = flags.path
    let execArguments = flags.arguments
    let weekdays: number[] | undefined
    let monthdays: number[] | undefined
    let months: number[] | undefined
    let weeksOfMonth: number[] | undefined
    let {interval} = flags

    // 如果用户使用 ps-script 参数
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
      try {
        const result = await handlePsiInteractive(this.config.configDir)
        executablePath = result.executablePath
        execArguments = result.execArguments
        flags.trigger = result.trigger
        flags.time = result.time
        weekdays = result.weekdays
        monthdays = result.monthdays
        months = result.months
        weeksOfMonth = result.weeksOfMonth
        if (result.interval !== undefined) interval = result.interval
      } catch (err: any) {
        this.error(err.message)
      }
    }

    const result = await createScheduledTask({
      arguments: execArguments,
      description: flags.description,
      disallowStartIfOnBatteries: false, // 允许在使用电池时启动任务
      enabled: true,
      executablePath: executablePath!,
      hidden: false,
      interval,
      months,
      monthdays,
      weeksOfMonth,
      startTime: flags.time,
      startWhenAvailable: flags['start-when-available'],
      stopIfGoingOnBatteries: false,  // 电池供电时是否停止任务
      taskName: args.taskName,
      triggerType: flags.trigger as 'boot' | 'daily' | 'logon' | 'monthly' | 'once' | 'weekly',
      wakeToRun: true,
      weekdays,
    })

    this.log(result)
  }
}
