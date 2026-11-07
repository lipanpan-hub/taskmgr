import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateLogon extends BaseCreateCommand {
  static description = '创建当前用户登录时执行的任务'

  static examples = [
    {
      description: '登录后延迟 1 分钟执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --delay=1',
    },
  ]

  protected readonly triggerType = 'logon'
}
