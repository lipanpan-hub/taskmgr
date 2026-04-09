import {Command, Flags} from '@oclif/core'
import prompts from 'prompts'

import {deleteScheduledTask, getAllTasks} from '../../lib/wtsk/task-scheduler.js'

export default class Del extends Command {
  static description = '手动删除定时任务'
  static examples = [`<%= config.bin %> <%= command.id %> -n myTask`]
  static flags = {
    taskName: Flags.string({char: 'n', description: '任务名称'}),
    interactive: Flags.boolean({char: 'i', description: '交互式选择任务', exclusive: ['taskName']}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Del)
    const {taskName: initialTaskName} = flags

    let taskNames = initialTaskName ? [initialTaskName] : []

    if (flags.interactive) {
      const tasks = await getAllTasks()
      if (typeof tasks === 'string') {
        this.error(tasks)
      }

      if (tasks.length === 0) {
        this.error('没有可删除的任务')
      }

      const response = await prompts({
        type: 'multiselect',
        name: 'selected',
        message: '选择要删除的任务（空格选中，回车确认）',
        choices: tasks.map(t => ({title: t.name, value: t.name})),
        min: 1,
      })

      if (!Array.isArray(response.selected) || response.selected.length === 0) {
        this.error('未选择任务')
      }

      taskNames = response.selected
    }

    if (taskNames.length === 0) {
      this.error('必须指定 -n 或 -i')
    }

    const results = await Promise.all(taskNames.map(async taskName => ({
      result: await deleteScheduledTask(taskName),
      taskName,
    })))

    for (const {result} of results) {
      this.log(result)
    }
  }
}
