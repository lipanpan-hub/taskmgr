import {Flags} from '@oclif/core'
import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateDaily extends BaseCreateCommand {
  static description = '创建每天（或每隔 N 天）执行的定时任务'

  static examples = [
    {
      description: '每天 11:30 执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30"',
    },
    {
      description: '每隔 3 天执行，并且每 30 分钟重复一次、持续 2 小时',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30" --interval=3 --repeat-interval=30 --repeat-duration=120',
    },
  ]

  static flags = {
    'start-time': Flags.string({
      description: '开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)',
    }),
    interval: Flags.integer({
      default: 1,
      description: '每隔几天执行一次',
      min: 1,
    }),
  }

  protected readonly triggerType = 'daily'
}
