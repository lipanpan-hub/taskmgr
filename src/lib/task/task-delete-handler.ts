import prompts from 'prompts'
import {TaskService} from './task-service.js'

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

    const response = await prompts({
      type: 'select',
      name: 'taskId',
      message: '选择要删除的任务',
      choices,
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
      return {
        success: true,
        message: `✓ 任务已删除: ${deleted.name} (ID: ${deleted.id})\n  关联的触发器配置已自动删除`,
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
      return {
        success: true,
        message: `✓ 任务已删除: ${deleted.name} (ID: ${deleted.id})\n  关联的触发器配置已自动删除`,
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
}
