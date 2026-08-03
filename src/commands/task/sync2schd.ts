import {Command, Flags} from '@oclif/core'
import {eq} from 'drizzle-orm'
import {getDb} from '../../db/index.js'
import {tasks} from '../../db/schema.js'
import {syncTasksToScheduler} from '../../lib/task/task-sync-handler.js'
import { BaseCommand } from '../../lib/base-command.js'

export default class Sync2Schd extends BaseCommand {
  static aliases = ["task:sync"]
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

    const {successCount, failCount, results} = await syncTasksToScheduler(taskList)

    // 输出同步结果
    for (const result of results) {
      if (result.success) {
        this.log(`✓ ${result.taskName}: ${result.message}`)
      } else {
        this.warn(`✗ ${result.taskName}: ${result.message}`)
      }
    }

    this.log(`\n同步完成: 成功 ${successCount} 个, 失败 ${failCount} 个`)
  }
}
