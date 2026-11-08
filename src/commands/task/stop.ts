import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {TaskControlHandler} from '../../lib/task/task-control-handler.js'

export default class Stop extends BaseCommand {
  static args = {
    name: Args.string({description: '要停止的任务名称，省略则交互式选择', ignoreStdin: true}),
  }

  static description = '停止 Windows Task Scheduler 中正在运行的任务（不会禁用任务，下次触发时仍会执行）'

  static examples = [
    {
      description: '交互式选择要停止的任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '停止指定任务',
      command: '<%= config.bin %> <%= command.id %> myTask',
    },
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(Stop)
    const result = await new TaskControlHandler().stop(args.name)

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}
