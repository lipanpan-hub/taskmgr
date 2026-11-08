import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {TaskControlHandler} from '../../lib/task/task-control-handler.js'

export default class Disable extends BaseCommand {
  static args = {
    name: Args.string({description: '要禁用的任务名称，省略则交互式选择', ignoreStdin: true}),
  }

  static description = '禁用任务：同时更新数据库和 Windows Task Scheduler 中的启用状态。禁用后不再触发，但不会终止正在运行的实例（如需终止请用 stop）'

  static examples = [
    {
      description: '交互式选择要禁用的任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '禁用指定任务',
      command: '<%= config.bin %> <%= command.id %> myTask',
    },
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(Disable)
    const result = await new TaskControlHandler().setEnabled(args.name, false)

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}
