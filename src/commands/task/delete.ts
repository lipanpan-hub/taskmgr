import {Args, Command, Flags} from '@oclif/core'
import {TaskDeleteHandler} from '../../lib/task/task-delete-handler.js'

export default class Delete extends Command {
  static args = {
    name: Args.string({description: '要删除的任务名称'}),
  }

  static description = '删除数据库中的定时任务及其关联配置'

  static examples = [
    {
      description: '交互式删除任务',
      command: '<%= config.bin %> <%= command.id %> --interactive',
    },
    {
      description: '直接删除指定任务',
      command: '<%= config.bin %> <%= command.id %> myTask',
    },
    {
      description: '通过ID删除任务',
      command: '<%= config.bin %> <%= command.id %> --id=1',
    },
    {
      description: '强制删除（不确认）',
      command: '<%= config.bin %> <%= command.id %> myTask --force',
    },
  ]

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: '交互式选择要删除的任务',
    }),
    id: Flags.integer({
      description: '通过ID删除任务',
    }),
    force: Flags.boolean({
      char: 'f',
      description: '强制删除，不进行确认',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Delete)
    const handler = new TaskDeleteHandler()

    let result

    if (flags.interactive) {
      result = await handler.interactiveDelete()
    } else if (flags.id) {
      result = await handler.deleteById(flags.id, flags.force)
    } else if (args.name) {
      result = await handler.deleteByName(args.name, flags.force)
    } else {
      this.error('必须提供任务名称、使用 --id 指定ID，或使用 --interactive 交互式选择')
    }

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}