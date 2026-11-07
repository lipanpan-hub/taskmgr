import {Flags} from '@oclif/core'
import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateWeekly extends BaseCreateCommand {
  static description = '创建每周（或每隔 N 周）在指定星期执行的定时任务'

  static examples = [
    {
      description: '每周一、三、五 11:30 执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30" --weekdays="1,3,5"',
    },
    {
      description: '每隔 2 周的周一执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30" --weekdays="1" --interval=2',
    },
  ]

  static flags = {
    'start-time': Flags.string({
      description: '开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)',
    }),
    weekdays: Flags.string({
      description: '星期几 (逗号分隔, 0=周日, 1=周一...6=周六, 例如: 1,3,5)',
    }),
    interval: Flags.integer({
      default: 1,
      description: '每隔几周执行一次',
      min: 1,
    }),
  }

  protected readonly triggerType = 'weekly'
}
