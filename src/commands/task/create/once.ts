import {Flags} from '@oclif/core'
import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateOnce extends BaseCreateCommand {
  static description = '创建只执行一次的定时任务'

  static examples = [
    {
      description: '在指定日期时间执行一次',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --start-time="2026-12-31 23:59"',
    },
  ]

  static flags = {
    'start-time': Flags.string({
      description: '执行时间 (YYYY-MM-DD HH:mm)',
    }),
  }

  protected readonly triggerType = 'once'
}
