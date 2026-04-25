import {Args, Command, Flags} from '@oclif/core'
import {directCreateTask, interactiveCreateTask} from '../../lib/task/task-creator.js'

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
      description: '直接创建每天任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=daily --start-time="09:00"',
    },
  ]

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: '交互式创建任务',
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
