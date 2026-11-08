import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {TaskControlHandler} from '../../lib/task/task-control-handler.js'

export default class Restart extends BaseCommand {
  static args = {
    name: Args.string({description: '要重启的任务名称，省略则交互式选择', ignoreStdin: true}),
  }

  static description = '重启任务：若任务正在运行则先停止，然后立即启动一次'

  static examples = [
    {
      description: '交互式选择要重启的任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '重启指定任务',
      command: '<%= config.bin %> <%= command.id %> myTask',
    },
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(Restart)
    const result = await new TaskControlHandler().restart(args.name)

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}
