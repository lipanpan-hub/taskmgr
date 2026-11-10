import Fuse from 'fuse.js'
import prompts from 'prompts'

import {getAllTasks, getScheduledTask, runScheduledTask, setScheduledTaskEnabled, stopScheduledTask, taskExists} from '../wtsk/task-scheduler.js'
import {TaskService} from './task-service.js'

export interface ControlResult {
  success: boolean
  message: string
}

export interface TaskChoice {
  title: string
  value: string
}

const RUNNING_STATE = 'Running'

export class TaskControlHandler {
  // #region 停止任务
  async stop(inputName?: string): Promise<ControlResult> {
    const resolved = await this.resolveTaskName(inputName, '选择要停止的任务', '当前没有正在运行的任务', async () => {
      const schedulerTasks = await getAllTasks()
      if (typeof schedulerTasks === 'string') throw new Error(schedulerTasks)
      return schedulerTasks.filter((task) => task.state === RUNNING_STATE).map((task) => ({title: `${task.name} (状态: ${task.state})`, value: task.name}))
    })
    if (typeof resolved !== 'string') return resolved
    const taskName = resolved

    const stateResult = await this.getTaskState(taskName)
    if (!stateResult.success) return stateResult

    if (stateResult.state !== RUNNING_STATE) {
      return {success: true, message: `任务 "${taskName}" 当前未在运行（状态: ${stateResult.state}），无需停止`}
    }

    const result = await stopScheduledTask(taskName)
    if (result.startsWith('Error:')) {
      return {success: false, message: `停止任务失败: ${result}`}
    }

    return {success: true, message: `✓ 已停止任务: ${taskName}`}
  }
  // #endregion

  // #region 重启任务
  async restart(inputName?: string): Promise<ControlResult> {
    const resolved = await this.resolveTaskName(inputName, '选择要重启的任务', 'Windows Task Scheduler 中暂无任务', async () => {
      const schedulerTasks = await getAllTasks()
      if (typeof schedulerTasks === 'string') throw new Error(schedulerTasks)
      return schedulerTasks.map((task) => ({title: `${task.name} (状态: ${task.state})`, value: task.name}))
    })
    if (typeof resolved !== 'string') return resolved
    const taskName = resolved

    const stateResult = await this.getTaskState(taskName)
    if (!stateResult.success) return stateResult

    // 仅在运行中时才需要先停止；未运行则直接启动
    if (stateResult.state === RUNNING_STATE) {
      const stopResult = await stopScheduledTask(taskName)
      if (stopResult.startsWith('Error:')) {
        return {success: false, message: `重启失败，停止任务时出错: ${stopResult}`}
      }
    }

    const runResult = await runScheduledTask(taskName)
    if (runResult.startsWith('Error:')) {
      return {success: false, message: `重启失败，启动任务时出错: ${runResult}`}
    }

    return {success: true, message: `✓ 已重启任务: ${taskName}`}
  }
  // #endregion

  // #region 启用/禁用任务
  async setEnabled(inputName: string | undefined, isEnabled: boolean): Promise<ControlResult> {
    const actionLabel = isEnabled ? '启用' : '禁用'
    const taskService = new TaskService()

    // 交互选择时只列出状态需要改变的任务（启用 -> 已禁用的；禁用 -> 已启用的）
    const resolved = await this.resolveTaskName(inputName, `选择要${actionLabel}的任务`, `没有可${actionLabel}的任务`, async () => {
      const dbTasks = await taskService.getAllTasks()
      return dbTasks
        .filter((task) => task.enabled !== isEnabled)
        .map((task) => ({title: `${task.name} (ID: ${task.id}, 类型: ${task.triggerType})`, value: task.name}))
    })
    if (typeof resolved !== 'string') return resolved
    const taskName = resolved

    const task = await taskService.getTaskByName(taskName)

    if (!task) {
      return {success: false, message: `任务不存在: ${taskName}`}
    }

    // 先改 Windows 再改数据库：Windows 侧失败时数据库保持不变，两边不会出现不一致
    const isInScheduler = await taskExists(taskName)
    if (isInScheduler) {
      const result = await setScheduledTaskEnabled(taskName, isEnabled)
      if (result.startsWith('Error:')) {
        return {success: false, message: `${actionLabel}失败: ${result}`}
      }
    }

    await taskService.updateTask(task.id, {enabled: isEnabled})

    const syncHint = isInScheduler ? '' : '\n  ⚠ Windows Task Scheduler 中不存在该任务，仅更新了数据库，可执行 tm task sync2schd 补建'
    return {success: true, message: `✓ 已${actionLabel}任务: ${taskName}${syncHint}`}
  }
  // #endregion

  // #region 交互式选择任务
  // 已传入名称则直接使用；未传入时加载候选项并弹出可模糊搜索的选择框
  async resolveTaskName(
    inputName: string | undefined,
    promptMessage: string,
    emptyMessage: string,
    loadChoices: () => Promise<TaskChoice[]>,
  ): Promise<ControlResult | string> {
    if (inputName) return inputName

    let choices: TaskChoice[]
    try {
      choices = await loadChoices()
    } catch (error) {
      return {success: false, message: `获取任务列表失败: ${error instanceof Error ? error.message : String(error)}`}
    }

    if (choices.length === 0) return {success: false, message: emptyMessage}

    const fuse = new Fuse(choices, {keys: ['title'], threshold: 0.4})
    const response = await prompts({
      type: 'autocomplete',
      name: 'taskName',
      message: promptMessage,
      choices,
      suggest(input: string, allChoices: prompts.Choice[]) {
        if (!input) return Promise.resolve(allChoices)
        return Promise.resolve(fuse.search(input).map((result) => result.item))
      },
    })

    if (!response.taskName) return {success: false, message: '操作已取消'}

    return response.taskName as string
  }
  // #endregion

  // #region 查询任务当前状态
  private async getTaskState(taskName: string): Promise<ControlResult & {state?: string}> {
    const detail = await getScheduledTask(taskName)

    // getScheduledTask 失败或任务不存在时返回的是字符串
    if (typeof detail === 'string') {
      return {success: false, message: `任务不存在于 Windows Task Scheduler: ${taskName}（${detail}）`}
    }

    return {success: true, message: '', state: detail.state}
  }
  // #endregion
}
