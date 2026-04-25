import {Command, Flags} from '@oclif/core'
import {TaskService} from '../../lib/task/task-service.js'
import {applyFilters, formatBlock, formatDetailedLine} from '../../lib/task/task-list.js'

export default class List extends Command {
  static description = '列出数据库中的所有定时任务'

  static examples = [
    {
      description: '列出所有任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '以块状格式显示',
      command: '<%= config.bin %> <%= command.id %> --block',
    },
    {
      description: '过滤特定任务',
      command: '<%= config.bin %> <%= command.id %> --name="myTask"',
    },
    {
      description: '过滤启用的任务',
      command: '<%= config.bin %> <%= command.id %> --enabled',
    },
  ]

  static flags = {
    block: Flags.boolean({
      char: 'b',
      description: '以块状格式显示详细信息',
    }),
    name: Flags.string({
      char: 'n',
      description: '按任务名称过滤（支持部分匹配）',
    }),
    enabled: Flags.boolean({
      description: '仅显示启用的任务',
      exclusive: ['disabled'],
    }),
    disabled: Flags.boolean({
      description: '仅显示禁用的任务',
      exclusive: ['enabled'],
    }),
    type: Flags.string({
      char: 't',
      description: '按触发类型过滤',
      options: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(List)
    const taskService = new TaskService()

    let tasks = await taskService.getAllTasks()

    // 应用过滤器
    tasks = applyFilters(tasks, flags)

    if (tasks.length === 0) {
      this.log('暂无符合条件的任务')
      return
    }

    // 根据标志选择输出格式并输出
    let lines: string[]
    if (flags.block) {
      lines = formatBlock(tasks)
    } else {
      lines = formatDetailedLine(tasks)
    }

    for (const line of lines) {
      this.log(line)
    }

    this.log(`\n共 ${tasks.length} 个任务`)
  }


}
