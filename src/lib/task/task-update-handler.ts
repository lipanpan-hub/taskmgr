import { TaskService } from './task-service.js'
import type { NewTask } from '../../db/schema.js'
import { syncTaskToScheduler } from './task-sync-handler.js'
import { optimizeTaskInput } from './task-input-optimizer.js'

// 任务更新结果
export interface TaskUpdateResult {
  success: boolean
  taskId: number
  taskName: string
  message: string
}

// #region 更新任务信息
/**
 * 更新任务信息
 * 1. 更新数据库中的任务信息
 * 2. 使用更新后的信息重新在 Windows Task Scheduler 中创建同名任务
 */
export async function updateTask(
  taskId: number,
  updateData: Partial<NewTask>
): Promise<TaskUpdateResult> {
  const taskService = new TaskService()

  try {
    // 步骤1: 检查任务是否存在
    const existingTask = await taskService.getTaskById(taskId)
    if (!existingTask) {
      return {
        success: false,
        taskId,
        taskName: '',
        message: `任务不存在 (ID: ${taskId})`,
      }
    }

    // 步骤2: 优化输入（如果更新了可执行路径或参数）
    let optimizedData = { ...updateData }
    if (updateData.executablePath || updateData.arguments !== undefined) {
      // 将 null 转换为 undefined
      const currentArgs = updateData.arguments !== undefined 
        ? (updateData.arguments ?? undefined)
        : (existingTask.arguments ?? undefined)
      
      const optimized = await optimizeTaskInput(
        updateData.executablePath || existingTask.executablePath,
        currentArgs
      )
      optimizedData = {
        ...optimizedData,
        executablePath: optimized.executablePath,
        arguments: optimized.arguments || undefined,
      }
    }

    // 步骤3: 更新数据库中的任务信息
    const updatedTask = await taskService.updateTask(taskId, optimizedData)
    if (!updatedTask) {
      return {
        success: false,
        taskId,
        taskName: existingTask.name,
        message: '数据库更新失败',
      }
    }

    console.log(`✓ 数据库更新成功: ${updatedTask.name} (ID: ${updatedTask.id})`)

    // 步骤4: 同步到 Windows Task Scheduler（重新创建同名任务）
    const syncResult = await syncTaskToScheduler(updatedTask)
    if (!syncResult.success) {
      return {
        success: false,
        taskId: updatedTask.id,
        taskName: updatedTask.name,
        message: `同步到 Windows Task Scheduler 失败: ${syncResult.message}`,
      }
    }

    console.log(`✓ 已同步到 Windows Task Scheduler`)

    return {
      success: true,
      taskId: updatedTask.id,
      taskName: updatedTask.name,
      message: '任务更新成功',
    }
  } catch (error) {
    return {
      success: false,
      taskId,
      taskName: '',
      message: `任务更新失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
// #endregion

// #region 按名称更新任务
/**
 * 按任务名称更新任务信息
 */
export async function updateTaskByName(
  taskName: string,
  updateData: Partial<NewTask>
): Promise<TaskUpdateResult> {
  const taskService = new TaskService()

  try {
    const existingTask = await taskService.getTaskByName(taskName)
    if (!existingTask) {
      return {
        success: false,
        taskId: 0,
        taskName,
        message: `任务不存在: ${taskName}`,
      }
    }

    return await updateTask(existingTask.id, updateData)
  } catch (error) {
    return {
      success: false,
      taskId: 0,
      taskName,
      message: `任务更新失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
// #endregion
