import {Args, Command, Flags} from '@oclif/core'
import {copyFileSync} from 'node:fs'
import {basename, join} from 'node:path'

import {handlePsiInteractive} from '../../lib/wtsk/psi-handler.js'
import {createScheduledTask} from '../../lib/wtsk/task-scheduler.js'
import {normalizeStartTime, parseNumberList} from '../../lib/wtsk/trigger-utils.js'

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
    {
      description: '创建每天运行的定时任务，每隔1天触发一次',
      command: String.raw`<%= config.bin %> <%= command.id %> testTask --path="notepad.exe" --trigger=daily --interval=1 --start-time="09:00"`,
    },
    {
      description: '创建每周一、周三、周五运行的定时任务',
      command: String.raw`<%= config.bin %> <%= command.id %> testTask --path="notepad.exe" --trigger=weekly --weekdays="1,3,5" --start-time="14:30"`,
    },
    {
      description: '创建每月1号、15号运行的定时任务',
      command: String.raw`<%= config.bin %> <%= command.id %> testTask --path="notepad.exe" --trigger=monthly --months="1,2,3,4,5,6,7,8,9,10,11,12" --monthdays="1,15" --start-time="20:00"`,
    },
    {
      description: '创建按照月、周、星期几的组合来运行的定时任务(例如:每季度最后一周的周五)',
      command: String.raw`<%= config.bin %> <%= command.id %> testTask --path="notepad.exe" --trigger=monthly --months="3,6,9,12" --weeks-of-month="5" --weekdays="5" --start-time="23:59"`,
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
    'start-time': Flags.string({
      default: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} 09:00`, 
      description: '任务开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)'
    }),
    interval: Flags.integer({
      default: 1,
      description: '触发间隔 (N天/N周)',
    }),
    trigger: Flags.string({
      default: 'daily',
      description: '触发类型: daily, weekly, monthly, once, boot, logon',
      options: ['boot', 'daily', 'logon', 'monthly', 'once', 'weekly'],
    }),
    weekdays: Flags.string({
      description: '星期几 (0-6，0为周日，用逗号分隔，仅 weekly/monthly 生效)',
    }),
    months: Flags.string({
      description: '月份 (1-12，用逗号分隔，仅 monthly 生效)',
    }),
    monthdays: Flags.string({
      description: '每月的几号 (1-31，用逗号分隔，仅 monthly 生效)',
    }),
    'weeks-of-month': Flags.string({
      description: '第几周 (1-4, 5表示最后一周，用逗号分隔，仅 monthly 配合 weekdays 生效)',
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
        flags['start-time'] = result.time
        weekdays = result.weekdays
        monthdays = result.monthdays
        months = result.months
        weeksOfMonth = result.weeksOfMonth
        if (result.interval !== undefined) interval = result.interval
      } catch (error: unknown) {
        this.error((error as Error).message)
      }
    } else {
      if (flags.trigger === 'weekly') {
        if (!flags.weekdays) this.error('创建周触发任务必须指定 --weekdays 参数')
      } else if (flags.trigger === 'monthly') {
        if (!flags.months) this.error('创建月触发任务必须指定 --months 参数')
        if (!flags.monthdays && !flags['weeks-of-month']) {
          this.error('创建月触发任务必须指定 --monthdays 或 --weeks-of-month (配合 --weekdays) 参数')
        }

        if (flags['weeks-of-month'] && !flags.weekdays) {
          this.error('指定按周触发时，必须提供 --weekdays 参数')
        }
      }

      if (flags.weekdays) weekdays = parseNumberList(flags.weekdays, '--weekdays', {min: 0, max: 6})
      if (flags.monthdays) monthdays = parseNumberList(flags.monthdays, '--monthdays', {min: 1, max: 31})
      if (flags.months) months = parseNumberList(flags.months, '--months', {min: 1, max: 12})
      if (flags['weeks-of-month']) {
        weeksOfMonth = parseNumberList(flags['weeks-of-month'], '--weeks-of-month', {min: 1, max: 5})
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
      startTime: normalizeStartTime(flags['start-time']),
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
