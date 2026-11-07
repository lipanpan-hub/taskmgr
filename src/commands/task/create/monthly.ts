import {Flags} from '@oclif/core'
import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateMonthly extends BaseCreateCommand {
  static description = '创建每月执行的定时任务，可按"每月几号"或"每月第几周的星期几"触发'

  static examples = [
    {
      description: '每月 1 号和 15 号 11:30 执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30" --monthdays="1,15"',
    },
    {
      description: '仅 1 月、6 月、12 月的第一周周一执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="11:30" --months="1,6,12" --weeks-of-month="1" --weekdays="1"',
    },
  ]

  static flags = {
    'start-time': Flags.string({
      description: '开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)',
    }),
    months: Flags.string({
      default: '1,2,3,4,5,6,7,8,9,10,11,12',
      description: '月份 (逗号分隔, 1-12, 例如: 1,6,12)，缺省为每个月',
    }),
    monthdays: Flags.string({
      description: '每月的哪几天 (逗号分隔, 1-31, 例如: 1,15,30)',
      exclusive: ['weeks-of-month'],
    }),
    'weeks-of-month': Flags.string({
      description: '每月的第几周 (逗号分隔, 1-4, 5=最后一周, 例如: 1,3)，需配合 --weekdays',
      exclusive: ['monthdays'],
    }),
    weekdays: Flags.string({
      dependsOn: ['weeks-of-month'],
      description: '星期几 (逗号分隔, 0=周日, 1=周一...6=周六)，仅与 --weeks-of-month 配合使用',
    }),
  }

  protected readonly triggerType = 'monthly'
}
