import {BaseCreateCommand} from '../../../lib/task/base-create-command.js'

export default class CreateBoot extends BaseCreateCommand {
  static description = '创建系统启动时执行的任务（以 SYSTEM 账户运行，需要在管理员终端中创建）'

  static examples = [
    {
      description: '系统启动后延迟 5 分钟执行',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --delay=5',
    },
  ]

  protected readonly triggerType = 'boot'
}
