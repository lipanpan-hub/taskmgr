import {interactiveCreateTask} from '../../../lib/task/task-creator-handler.js'
import {BaseCommand} from '../../../lib/base-command.js'

export default class Create extends BaseCommand {
  static aliases = ['task:add']

  static description = '交互式创建定时任务（会询问触发类型）。非交互创建请使用 `create daily|weekly|monthly|once|boot|logon` 子命令'

  static examples = [
    {
      description: '交互式创建任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
  ]

  async run(): Promise<void> {
    await interactiveCreateTask()
  }
}
