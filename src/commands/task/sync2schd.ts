import {Command, Flags} from '@oclif/core'
import {eq} from 'drizzle-orm'
import {getDb} from '../../db/index.js'
import {tasks} from '../../db/schema.js'
import {createScheduledTask} from '../../lib/wtsk/task-scheduler.js'
import {buildTaskOptions} from '../../lib/task/task-options-builder.js'

export default class Sync2Schd extends Command {
  static description = '将数据库中的任务同步到 Windows Task Scheduler'

  static examples = [
    {
      description: '同步所有任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '同步指定任务',
      command: '<%= config.bin %> <%= command.id %> --name="myTask"',
    },
  ]

  static flags = {
    name: Flags.string({
      char: 'n',
      description: '指定要同步的任务名称',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Sync2Schd)
    const db = getDb()

    // 查询任务
    let taskList
    if (flags.name) {
      taskList = await db.select().from(tasks).where(eq(tasks.name, flags.name))
      if (taskList.length === 0) {
        this.error(`任务 "${flags.name}" 不存在`)
      }
    } else {
      taskList = await db.select().from(tasks)
    }

    if (taskList.length === 0) {
      this.log('数据库中没有任务')
      return
    }

    this.log(`开始同步 ${taskList.length} 个任务...`)

    // 同步每个任务
    let successCount = 0
    let failCount = 0

    for (const task of taskList) {
      try {
        const options = await buildTaskOptions(task)
        const result = await createScheduledTask(options)

        if (result.startsWith('Error:')) {
          this.warn(`✗ ${task.name}: ${result}`)
          failCount++
        } else {
          this.log(`✓ ${task.name}: 同步成功`)
          successCount++
        }
      } catch (error) {
        this.warn(`✗ ${task.name}: ${error instanceof Error ? error.message : String(error)}`)
        failCount++
      }
    }

    this.log(`\n同步完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
  }
}
