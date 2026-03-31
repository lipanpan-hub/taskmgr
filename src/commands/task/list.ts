import { Command, Flags } from '@oclif/core'
import { getDb } from '../../backend/lib/db.js'
import { tasks } from '../../backend/model/schema.js'

export default class TaskList extends Command {
  static description = '列出数据库中的所有任务记录'
  
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --detailed',
  ]

  static flags = {
    detailed: Flags.boolean({
      char: 'd',
      description: '显示详细信息',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(TaskList)

    try {
      const db = getDb()
      const allTasks = await db.select().from(tasks)

      if (allTasks.length === 0) {
        this.log('数据库中暂无任务记录')
        return
      }

      this.log('')
      this.log(`共找到 ${allTasks.length} 条任务记录:`)
      this.log('')

      if (flags.detailed) {
        // 详细模式
        for (const task of allTasks) {
          this.log(`  [${task.id}] ${task.name}`)
          if (task.description) this.log(`    描述: ${task.description}`)
          this.log(`    可执行文件: ${task.executablePath}`)
          if (task.arguments) this.log(`    参数: ${task.arguments}`)
          this.log(`    触发类型: ${task.triggerType} | 开始时间: ${task.startTime}`)
          this.log(`    状态: ${task.enabled ? '已启用' : '已禁用'}`)
          this.log(`    创建时间: ${task.createdAt}`)
          this.log(`    更新时间: ${task.updatedAt}`)
          this.log('')
        }
      } else {
        // 简洁模式
        for (const task of allTasks) {
          const status = task.enabled ? '✓' : '✗'
          this.log(`  ${status} [${task.id}] ${task.name} | ${task.triggerType} @ ${task.startTime}`)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(`查询任务失败: ${error.message}`)
      } else {
        this.error('查询任务失败')
      }
    }
  }
}
