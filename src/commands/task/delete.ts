import { Command } from '@oclif/core'
import prompts from 'prompts'
import Fuse from 'fuse.js'
import { getDb } from '../../backend/lib/db.js'
import { tasks } from '../../backend/model/schema.js'
import { eq } from 'drizzle-orm'

export default class TaskDelete extends Command {
  static description = '从数据库中删除一条任务记录'
  
  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    try {
      const db = getDb()
      const allTasks = await db.select().from(tasks)

      if (allTasks.length === 0) {
        this.log('数据库中暂无任务记录')
        return
      }

      // 使用 fuse.js 实现模糊搜索
      const fuse = new Fuse(allTasks, {
        keys: ['name', 'description'],
        threshold: 0.3,
      })

      const response = await prompts({
        type: 'autocomplete',
        name: 'taskId',
        message: '选择要删除的任务',
        choices: allTasks.map(task => ({
          title: `[${task.id}] ${task.name}${task.description ? ` - ${task.description}` : ''}`,
          value: task.id,
        })),
        suggest: async (input: string, choices: any[]) => {
          if (!input) return choices
          const results = fuse.search(input)
          return results.map((r: any) => choices.find((c: any) => c.value === r.item.id)).filter(Boolean)
        },
      })

      // 用户取消选择
      if (!response.taskId) {
        this.log('已取消')
        return
      }

      // 确认删除
      const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: '确认删除该任务？',
        initial: false,
      })

      if (!confirm.value) {
        this.log('已取消')
        return
      }

      // 执行删除
      await db.delete(tasks).where(eq(tasks.id, response.taskId))
      this.log(`✓ 任务已成功删除`)
    } catch (error) {
      if (error instanceof Error) {
        this.error(`删除任务失败: ${error.message}`)
      } else {
        this.error('删除任务失败')
      }
    }
  }
}
