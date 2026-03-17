import {Command, Flags} from '@oclif/core'
import prompts from 'prompts'

import {deleteScheduledTask, getAllTasks} from '../../lib/task-scheduler.js'

export default class Del extends Command {
  static description = '删除定时任务'
  static examples = [`<%= config.bin %> <%= command.id %> -n myTask`]
  static flags = {
    taskName: Flags.string({char: 'n', description: '任务名称'}),
    interactive: Flags.boolean({char: 'i', description: '交互式选择任务', exclusive: ['taskName']}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Del)
    const {taskName: initialTaskName} = flags

    let taskName = initialTaskName

    if (flags.interactive) {
      const tasks = await getAllTasks()
      if (typeof tasks === 'string') {
        this.error(tasks)
      }

      if (tasks.length === 0) {
        this.error('没有可删除的任务')
      }

      const response = await prompts({
        type: 'select',
        name: 'selected',
        message: '选择要删除的任务',
        choices: tasks.map(t => ({title: t.name, value: t.name})),
      })

      if (!response.selected) {
        this.error('未选择任务')
      }

      taskName = response.selected
    }

    if (!taskName) {
      this.error('必须指定 -n 或 -i')
    }

    const result = await deleteScheduledTask(taskName)
    this.log(result)
  }
}
