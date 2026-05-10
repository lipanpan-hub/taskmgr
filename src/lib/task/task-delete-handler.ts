import prompts from 'prompts'
import Fuse from 'fuse.js'
import {TaskService} from './task-service.js'
import {deleteScheduledTask, taskExists} from '../wtsk/task-scheduler.js'

export interface DeleteResult {
  success: boolean
  message: string
  taskName?: string
  taskId?: number
}

export class TaskDeleteHandler {
  private taskService: TaskService

  constructor() {
    this.taskService = new TaskService()
  }

  // #region 交互式删除
  async interactiveDelete(): Promise<DeleteResult> {
    const tasks = await this.taskService.getAllTasks()

    if (tasks.length === 0) {
      return {success: false, message: '暂无任务可删除'}
    }

    const choices = tasks.map((task) => ({
      title: `${task.name} (ID: ${task.id}, 类型: ${task.triggerType}, ${task.enabled ? '启用' : '禁用'})`,
      value: task.id,
    }))

    // 配置 Fuse.js 用于模糊搜索
    const fuse = new Fuse(choices, {
      keys: ['title'],
      threshold: 0.4,
    })

    const response = await prompts({
      type: 'autocomplete',
      name: 'taskId',
      message: '选择要删除的任务',
      choices,
      suggest(input: string, choices: prompts.Choice[]) {
        if (!input) return Promise.resolve(choices)
        const results = fuse.search(input)
        return Promise.resolve(results.map((r) => r.item))
      },
    })

    if (!response.taskId) {
      return {success: false, message: '操作已取消'}
    }

    return this.deleteById(response.taskId, false)
  }
  // #endregion

  // #region 通过ID删除
  async deleteById(id: number, force: boolean): Promise<DeleteResult> {
    const task = await this.taskService.getTaskById(id)

    if (!task) {
      return {success: false, message: `任务不存在 (ID: ${id})`}
    }

    // 确认删除
    if (!force) {
      const confirmed = await this.confirmDelete(task.name, id)
      if (!confirmed) {
        return {success: false, message: '操作已取消'}
      }
    }

    // 执行删除（关联的触发器配置会通过 cascade 自动删除）
    const deleted = await this.taskService.deleteTask(id)

    if (deleted) {
      let schedulerMessage = ''

      // 同步删除 Windows Task Scheduler 中的任务
      try {
        const exists = await taskExists(deleted.name)
        if (exists) {
          const result = await deleteScheduledTask(deleted.name)
          if (result.startsWith('Error:')) {
            schedulerMessage = `\n  ⚠ Windows Task Scheduler 中的任务删除失败: ${result}`
          } else {
            schedulerMessage = '\n  ✓ 已从 Windows Task Scheduler 中删除'
          }
        }
      } catch (error) {
        schedulerMessage = `\n  ⚠ Windows Task Scheduler 同步失败: ${error instanceof Error ? error.message : String(error)}`
      }

      return {
        success: true,
        message: `✓ 任务已删除: ${deleted.name} (ID: ${deleted.id})\n  关联的触发器配置已自动删除${schedulerMessage}`,
        taskName: deleted.name,
        taskId: deleted.id,
      }
    }

    return {success: false, message: '删除失败'}
  }
  // #endregion

  // #region 通过名称删除
  async deleteByName(name: string, force: boolean): Promise<DeleteResult> {
    const task = await this.taskService.getTaskByName(name)

    if (!task) {
      return {success: false, message: `任务不存在: ${name}`}
    }

    // 确认删除
    if (!force) {
      const confirmed = await this.confirmDelete(task.name, task.id)
      if (!confirmed) {
        return {success: false, message: '操作已取消'}
      }
    }

    // 执行删除（关联的触发器配置会通过 cascade 自动删除）
    const deleted = await this.taskService.deleteTaskByName(name)

    if (deleted) {
      let schedulerMessage = ''

      // 同步删除 Windows Task Scheduler 中的任务
      try {
        const exists = await taskExists(deleted.name)
        if (exists) {
          const result = await deleteScheduledTask(deleted.name)
          if (result.startsWith('Error:')) {
            schedulerMessage = `\n  ⚠ Windows Task Scheduler 中的任务删除失败: ${result}`
          } else {
            schedulerMessage = '\n  ✓ 已从 Windows Task Scheduler 中删除'
          }
        }
      } catch (error) {
        schedulerMessage = `\n  ⚠ Windows Task Scheduler 同步失败: ${error instanceof Error ? error.message : String(error)}`
      }

      return {
        success: true,
        message: `✓ 任务已删除: ${deleted.name} (ID: ${deleted.id})\n  关联的触发器配置已自动删除${schedulerMessage}`,
        taskName: deleted.name,
        taskId: deleted.id,
      }
    }

    return {success: false, message: '删除失败'}
  }
  // #endregion

  // #region 确认删除
  private async confirmDelete(name: string, id: number): Promise<boolean> {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: `确认删除任务 "${name}" (ID: ${id}) 及其所有关联配置？`,
      initial: false,
    })

    return response.confirmed || false
  }
  // #endregion

  // #region 删除所有任务
  async deleteAll(force: boolean): Promise<DeleteResult> {
    const tasks = await this.taskService.getAllTasks()

    if (tasks.length === 0) {
      return {success: false, message: '暂无任务可删除'}
    }

    // 确认删除
    if (!force) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: `确认删除所有 ${tasks.length} 个任务及其关联配置？此操作不可恢复！`,
        initial: false,
      })

      if (!response.confirmed) {
        return {success: false, message: '操作已取消'}
      }
    }

    // 执行批量删除
    const deletedTasks = await this.taskService.deleteAllTasks()

    if (deletedTasks.length > 0) {
      let schedulerMessage = ''
      let successCount = 0
      let failCount = 0

      // 同步删除 Windows Task Scheduler 中的任务
      for (const task of deletedTasks) {
        try {
          const exists = await taskExists(task.name)
          if (exists) {
            const result = await deleteScheduledTask(task.name)
            if (result.startsWith('Error:')) {
              failCount++
            } else {
              successCount++
            }
          }
        } catch {
          failCount++
        }
      }

      if (successCount > 0 || failCount > 0) {
        schedulerMessage = `\n  Windows Task Scheduler 同步: ${successCount} 个成功`
        if (failCount > 0) {
          schedulerMessage += `, ${failCount} 个失败`
        }
      }

      return {
        success: true,
        message: `✓ 已删除 ${deletedTasks.length} 个任务及其关联配置${schedulerMessage}`,
      }
    }

    return {success: false, message: '删除失败'}
  }
  // #endregion
}
