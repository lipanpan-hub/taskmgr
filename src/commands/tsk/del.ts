import {Args, Command} from '@oclif/core'

import {deleteScheduledTask} from '../../lib/task-scheduler.js'

export default class Del extends Command {
  static args = {
    taskName: Args.string({description: '任务名称', required: true}),
  }
  static description = '删除定时任务'
  static examples = [`<%= config.bin %> <%= command.id %> myTask`]

  async run(): Promise<void> {
    const {args} = await this.parse(Del)
    const result = await deleteScheduledTask(args.taskName)
    this.log(result)
  }
}
