import {Flags} from '@oclif/core'
import {eq} from 'drizzle-orm'
import {getDb} from '../../db/index.js'
import {tasks} from '../../db/schema.js'
import {syncTasksToScheduler} from '../../lib/task/task-sync-handler.js'
import { BaseCommand } from '../../lib/base-command.js'
import {taskExists} from '../../lib/wtsk/task-scheduler.js'

export default class Sync2Schd extends BaseCommand {
  static aliases = ["task:sync","task:sync2schd"]
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
    {
      description: '只同步 Windows 中缺失的任务（AutoSync 登录时使用）',
      command: '<%= config.bin %> <%= command.id %> --only-missing',
    },
  ]

  static flags = {
    name: Flags.string({
      char: 'n',
      description: '指定要同步的任务名称',
    }),
    'only-missing': Flags.boolean({
      description: '只同步 Windows 中尚不存在的任务，已存在的跳过（重新注册会中断登录/开机触发器的重复计划）',
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

    // 只同步缺失的任务: 先过滤掉 Windows 中已存在的任务
    if (flags['only-missing']) {
      const existFlags = await Promise.all(taskList.map((task) => taskExists(task.name)))
      taskList = taskList.filter((_task, index) => !existFlags[index])
      if (taskList.length === 0) {
        this.log('所有任务都已存在于 Windows，无需同步')
        return
      }
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
