import {Args, Command, Flags} from '@oclif/core'
import {directCreateTask, interactiveCreateTask} from '../../lib/task/task-creator-handler.js'

export default class Create extends Command {
  static args = {
    name: Args.string({description: '任务名称'}),
  }

  static description = '创建定时任务到数据库'

  static examples = [
    {
      description: '交互式创建任务',
      command: '<%= config.bin %> <%= command.id %> --interactive',
    },
    {
      description: '创建每天执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=daily --start-time="11:30"',
    },
    {
      description: '创建每隔3天执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=daily --start-time="11:30" --interval=3',
    },
    {
      description: '创建每周一、三、五执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=weekly --start-time="11:30" --weekdays="1,3,5"',
    },
    {
      description: '创建每隔2周的周一执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=weekly --start-time="11:30" --weekdays="1" --interval=2',
    },
    {
      description: '创建每月1号和15号执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=monthly --start-time="11:30" --months="1,2,3,4,5,6,7,8,9,10,11,12" --monthdays="1,15"',
    },
    {
      description: '创建每年1月、6月、12月的第一周周一执行的任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=monthly --start-time="11:30" --months="1,6,12" --weeks-of-month="1" --weekdays="1"',
    },
  ]

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: '交互式创建任务',
      exclusive: ['path', 'arguments', 'description', 'trigger', 'start-time', 'interval', 'weekdays', 'months', 'monthdays', 'weeks-of-month'],
    }),
    path: Flags.string({
      description: '可执行文件路径',
    }),
    arguments: Flags.string({
      description: '执行参数',
    }),
    description: Flags.string({
      description: '任务描述',
    }),
    trigger: Flags.string({
      description: '触发类型',
      options: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'],
    }),
    'start-time': Flags.string({
      description: '开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)',
    }),
    interval: Flags.integer({
      description: '间隔 (daily: 每隔几天, weekly: 每隔几周)',
    }),
    weekdays: Flags.string({
      description: '星期几 (逗号分隔, 0=周日, 1=周一...6=周六, 例如: 1,3,5)',
      dependsOn: ['trigger'],
    }),
    months: Flags.string({
      description: '月份 (逗号分隔, 1-12, 例如: 1,6,12)',
      dependsOn: ['trigger'],
    }),
    monthdays: Flags.string({
      description: '每月的哪几天 (逗号分隔, 1-31, 例如: 1,15,30)',
      dependsOn: ['trigger', 'months'],
      exclusive: ['weeks-of-month'],
    }),
    'weeks-of-month': Flags.string({
      description: '每月的第几周 (逗号分隔, 1-5, 例如: 1,3)',
      dependsOn: ['trigger', 'months', 'weekdays'],
      exclusive: ['monthdays'],
      parse: async (input: string) => {
        const weeks = input.split(',').map((w) => Number.parseInt(w.trim(), 10))
        if (weeks.some((w) => Number.isNaN(w) || w < 1 || w > 5)) {
          throw new Error('weeks-of-month 必须是 1-5 之间的数字，用逗号分隔')
        }
        return input
      },
    }),
    enabled: Flags.boolean({
      allowNo: true,
      default: true,
      description: '是否启用任务',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)

    if (flags.interactive) {
      await interactiveCreateTask()
    } else {
      await directCreateTask(args.name, flags)
    }
  }
}
