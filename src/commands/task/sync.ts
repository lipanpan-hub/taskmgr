import { Command, Flags } from '@oclif/core'
import { syncTasksToSystem } from '../../lib/task/sync.js'

export default class TaskSync extends Command {
  static description = '将数据库中的任务同步到 Windows 系统'
  
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
  ]

  static flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: '显示详细的同步信息',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(TaskSync)

    try {
      this.log('正在同步任务到系统...')
      this.log('')

      const result = await syncTasksToSystem()

      // #region 显示同步结果
      if (result.created.length > 0) {
        this.log(`✓ 创建了 ${result.created.length} 个任务:`)
        if (flags.verbose) {
          for (const name of result.created) {
            this.log(`  - ${name}`)
          }
        }
        this.log('')
      }

      if (result.updated.length > 0) {
        this.log(`✓ 更新了 ${result.updated.length} 个任务:`)
        if (flags.verbose) {
          for (const name of result.updated) {
            this.log(`  - ${name}`)
          }
        }
        this.log('')
      }

      if (result.deleted.length > 0) {
        this.log(`✓ 删除了 ${result.deleted.length} 个任务:`)
        if (flags.verbose) {
          for (const name of result.deleted) {
            this.log(`  - ${name}`)
          }
        }
        this.log('')
      }

      if (result.errors.length > 0) {
        this.log(`✗ ${result.errors.length} 个任务同步失败:`)
        for (const { taskName, error } of result.errors) {
          this.log(`  - ${taskName}: ${error}`)
        }
        this.log('')
      }
      // #endregion

      // #region 显示总结
      const total = result.created.length + result.updated.length + result.deleted.length
      if (total === 0 && result.errors.length === 0) {
        this.log('所有任务已是最新状态，无需同步')
      } else if (result.errors.length === 0) {
        this.log(`同步完成！共处理 ${total} 个任务`)
      } else {
        this.log(`同步完成，但有 ${result.errors.length} 个任务失败`)
      }
      // #endregion
    } catch (error) {
      if (error instanceof Error) {
        this.error(`同步任务失败: ${error.message}`)
      } else {
        this.error('同步任务失败')
      }
    }
  }
}
