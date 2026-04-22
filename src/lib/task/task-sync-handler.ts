import type {Task} from '../../db/schema.js'
import {buildTaskOptions} from './task-options-builder.js'
import {createScheduledTask} from '../wtsk/task-scheduler.js'

// 任务同步结果
export interface TaskSyncResult {
  success: boolean
  taskName: string
  message: string
}

// 同步单个任务到 Windows Task Scheduler
export async function syncTaskToScheduler(task: Task): Promise<TaskSyncResult> {
  try {
    const options = await buildTaskOptions(task)
    const result = await createScheduledTask(options)

    if (result.startsWith('Error:')) {
      return {
        success: false,
        taskName: task.name,
        message: result,
      }
    }

    return {
      success: true,
      taskName: task.name,
      message: '同步成功',
    }
  } catch (error) {
    return {
      success: false,
      taskName: task.name,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

// 批量同步任务到 Windows Task Scheduler
export async function syncTasksToScheduler(taskList: Task[]): Promise<{
  successCount: number
  failCount: number
  results: TaskSyncResult[]
}> {
  const results: TaskSyncResult[] = []

  for (const task of taskList) {
    const result = await syncTaskToScheduler(task)
    results.push(result)
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return {
    successCount,
    failCount,
    results,
  }
}
