import { eq } from 'drizzle-orm'
import { getDb } from '../../backend/lib/db.js'
import { tasks } from '../../backend/model/schema.js'
import { createScheduledTask, deleteScheduledTask, getAllTasks } from '../task-scheduler.js'
import type { TaskInfo } from '../task-scheduler.js'

export interface SyncResult {
  created: string[]
  deleted: string[]
  errors: Array<{ taskName: string; error: string }>
  skipped: string[]
  updated: string[]
}

// 同步数据库中的任务到 Windows 系统
export async function syncTasksToSystem(): Promise<SyncResult> {
  const result: SyncResult = {
    created: [],
    updated: [],
    deleted: [],
    skipped: [],
    errors: [],
  }

  try {
    // #region 获取数据库任务和系统任务
    const db = getDb()
    const dbTasks = await db.select().from(tasks)
    const systemTasksResult = await getAllTasks()
    
    // 处理系统任务获取失败的情况
    if (typeof systemTasksResult === 'string') {
      throw new Error(`获取系统任务失败: ${systemTasksResult}`)
    }
    
    const systemTasks = systemTasksResult as TaskInfo[]
    const systemTaskNames = new Set(systemTasks.map(t => t.name))
    const dbTaskNames = new Set(dbTasks.map(t => t.name))
    // #endregion

    // #region 创建或更新数据库中存在的任务
    for (const task of dbTasks) {
      try {
        // 如果系统中已存在该任务，先删除再重新创建（实现更新）
        if (systemTaskNames.has(task.name)) {
          await deleteScheduledTask(task.name)
          result.updated.push(task.name)
        } else {
          result.created.push(task.name)
        }

        // 创建任务
        const createResult = await createScheduledTask({
          taskName: task.name,
          executablePath: task.executablePath,
          arguments: task.arguments || undefined,
          description: task.description || undefined,
          triggerType: task.triggerType as any,
          startTime: task.startTime,
          enabled: Boolean(task.enabled),
        })

        // 检查创建结果
        if (createResult.startsWith('Error:')) {
          result.errors.push({ taskName: task.name, error: createResult })
          // 从成功列表中移除
          const createdIndex = result.created.indexOf(task.name)
          if (createdIndex > -1) result.created.splice(createdIndex, 1)
          const updatedIndex = result.updated.indexOf(task.name)
          if (updatedIndex > -1) result.updated.splice(updatedIndex, 1)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        result.errors.push({ taskName: task.name, error: errorMsg })
        // 从成功列表中移除
        const createdIndex = result.created.indexOf(task.name)
        if (createdIndex > -1) result.created.splice(createdIndex, 1)
        const updatedIndex = result.updated.indexOf(task.name)
        if (updatedIndex > -1) result.updated.splice(updatedIndex, 1)
      }
    }
    // #endregion

    // #region 删除系统中存在但数据库中不存在的任务
    for (const systemTask of systemTasks) {
      if (!dbTaskNames.has(systemTask.name)) {
        try {
          await deleteScheduledTask(systemTask.name)
          result.deleted.push(systemTask.name)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          result.errors.push({ taskName: systemTask.name, error: errorMsg })
        }
      }
    }
    // #endregion

    return result
  } catch (error) {
    throw new Error(`同步任务失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 同步单个任务到系统
export async function syncTaskToSystem(taskName: string): Promise<void> {
  const db = getDb()
  const task = await db.select().from(tasks).where(eq(tasks.name, taskName)).limit(1)

  if (task.length === 0) {
    throw new Error(`任务 "${taskName}" 不存在`)
  }

  const taskData = task[0]

  // 先尝试删除已存在的任务（如果存在）
  try {
    await deleteScheduledTask(taskName)
  } catch {
    // 忽略删除失败（任务可能不存在）
  }

  // 创建任务
  const result = await createScheduledTask({
    taskName: taskData.name,
    executablePath: taskData.executablePath,
    arguments: taskData.arguments || undefined,
    description: taskData.description || undefined,
    triggerType: taskData.triggerType as any,
    startTime: taskData.startTime,
    enabled: Boolean(taskData.enabled),
  })

  if (result.startsWith('Error:')) {
    throw new Error(result)
  }
}
