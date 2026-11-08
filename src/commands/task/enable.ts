import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {TaskControlHandler} from '../../lib/task/task-control-handler.js'

export default class Enable extends BaseCommand {
  static args = {
    name: Args.string({description: '要启用的任务名称，省略则交互式选择', ignoreStdin: true}),
  }

  static description = '启用任务：同时更新数据库和 Windows Task Scheduler 中的启用状态'

  static examples = [
    {
      description: '交互式选择要启用的任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '启用指定任务',
      command: '<%= config.bin %> <%= command.id %> myTask',
    },
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(Enable)
    const result = await new TaskControlHandler().setEnabled(args.name, true)

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}
