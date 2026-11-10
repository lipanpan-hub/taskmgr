import { TaskService } from './task-service.js'
import type { NewTask, Task } from '../../db/schema.js'
import { syncTaskToScheduler } from './task-sync-handler.js'
import { optimizeTaskInput } from './task-input-optimizer.js'
import { advancedUpdateFlagsToTaskFields, type AdvancedUpdateFlagValues } from './advanced-options.js'
import { type ControlResult, TaskControlHandler } from './task-control-handler.js'
import { createTriggerDirect, type DirectCreateFlags } from './trigger-creator.js'
import { TriggerSnapshot } from './trigger-snapshot.js'

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

// #region CLI 更新任务（tm task update）
// `tm task update` 传入的参数：undefined = 不修改；字符串类的空串 = 清除；整数/时间类的 null = 清除
export interface TaskUpdateFlags extends AdvancedUpdateFlagValues {
  path?: string
  arguments?: string
  description?: string
  enabled?: boolean
  'start-time'?: string
  interval?: number
  weekdays?: string
  months?: string
  monthdays?: string
  'weeks-of-month'?: string
}

// 各触发类型允许修改的触发器参数
const TRIGGER_FLAG_NAMES_BY_TYPE: Record<string, string[]> = {
  daily: ['start-time', 'interval', 'start-when-available'],
  weekly: ['start-time', 'interval', 'weekdays', 'start-when-available'],
  monthly: ['start-time', 'months', 'monthdays', 'weeks-of-month', 'weekdays', 'start-when-available'],
  once: ['start-time', 'start-when-available'],
  boot: [],
  logon: [],
}

// 属于触发器子表的参数，其余 flag 都属于 tasks 表
const ALL_TRIGGER_FLAG_NAMES = ['start-time', 'interval', 'weekdays', 'months', 'monthdays', 'weeks-of-month', 'start-when-available'] as const

export class TaskUpdateHandler {
  private readonly taskService = new TaskService()

  async update(inputName: string | undefined, flags: TaskUpdateFlags): Promise<ControlResult> {
    // #region 步骤1: 拆分参数并解析任务名
    const triggerOverrides = this.pickTriggerOverrides(flags)
    const taskFields = this.pickDefinedFields(this.buildTaskFields(flags))
    if ((Object.keys(triggerOverrides).length === 0) && (Object.keys(taskFields).length === 0) && (flags.path === undefined) && (flags.arguments === undefined)) {
      return {success: false, message: '未指定任何要更新的内容，请至少传入一个 flag（可用 --help 查看）'}
    }

    const resolved = await new TaskControlHandler().resolveTaskName(inputName, '选择要更新的任务', '没有可更新的任务', async () => {
      const dbTasks = await this.taskService.getAllTasks()
      return dbTasks.map((dbTask) => ({title: `${dbTask.name} (ID: ${dbTask.id}, 类型: ${dbTask.triggerType})`, value: dbTask.name}))
    })
    if (typeof resolved !== 'string') return resolved

    const task = await this.taskService.getTaskByName(resolved)
    if (!task) return {success: false, message: `任务不存在: ${resolved}`}
    // #endregion

    // #region 步骤2: 写库前完成所有可预先做的校验
    const triggerError = this.validateTriggerOverrides(task, triggerOverrides)
    if (triggerError) return {success: false, message: triggerError}

    if ((flags.path !== undefined) && (flags.path.trim() === '')) {
      return {success: false, message: '--path 不能为空'}
    }

    if ((flags.path !== undefined) || (flags.arguments !== undefined)) {
      // 只改其中一个时，另一个沿用库里的值
      const nextArguments = (flags.arguments === undefined) ? (task.arguments ?? undefined) : flags.arguments
      const optimized = await optimizeTaskInput(flags.path ?? task.executablePath, nextArguments)
      taskFields.executablePath = optimized.executablePath
      taskFields.arguments = optimized.arguments ?? null
    }
    // #endregion

    // #region 步骤3: 更新数据库并同步，失败则恢复数据库
    const originalTaskFields = this.pickOriginalFields(task, taskFields)
    const triggerSnapshot = await TriggerSnapshot.capture(task.id, task.triggerType)

    try {
      const updatedTask = await this.taskService.updateTask(task.id, taskFields)
      if (!updatedTask) throw new Error('数据库更新失败')

      if (Object.keys(triggerOverrides).length > 0) {
        await this.replaceTrigger(task, triggerSnapshot, triggerOverrides)
      }

      const syncResult = await syncTaskToScheduler(updatedTask)
      if (!syncResult.success) throw new Error(`同步到 Windows Task Scheduler 失败: ${syncResult.message}`)
    } catch (error) {
      await this.taskService.updateTask(task.id, originalTaskFields)
      await triggerSnapshot.restore()
      const reason = (error instanceof Error) ? error.message : String(error)
      return {success: false, message: `任务更新失败，数据库已恢复: ${reason}`}
    }
    // #endregion

    const changedItems = [...Object.keys(taskFields), ...Object.keys(triggerOverrides)]
    return {success: true, message: `✓ 已更新任务: ${task.name}\n  更新内容: ${changedItems.join(', ')}\n  已同步到 Windows Task Scheduler`}
  }

  // #region 参数拆分
  // 转换为 tasks 表字段（description 空串 -> null）；path/arguments 需要先做输入优化，在 update 里单独处理
  private buildTaskFields(flags: TaskUpdateFlags): Partial<NewTask> {
    return {
      ...advancedUpdateFlagsToTaskFields(flags),
      enabled: flags.enabled,
      description: (flags.description === undefined) ? undefined : (flags.description.trim() || null),
    }
  }

  // 去掉值为 undefined 的键，保证 Object.keys 只剩真正要修改的字段（null 表示清除，需要保留）
  private pickDefinedFields(fields: Partial<NewTask>): Partial<NewTask> {
    return Object.fromEntries(Object.entries(fields).filter(([, fieldValue]) => fieldValue !== undefined)) as Partial<NewTask>
  }

  private pickTriggerOverrides(flags: TaskUpdateFlags): DirectCreateFlags {
    const overrides: Record<string, unknown> = {}
    for (const flagName of ALL_TRIGGER_FLAG_NAMES) {
      if (flags[flagName] !== undefined) overrides[flagName] = flags[flagName]
    }

    return overrides as DirectCreateFlags
  }

  // 取出这批字段在更新前的值，用于失败回滚
  private pickOriginalFields(task: Task, taskFields: Partial<NewTask>): Partial<NewTask> {
    const originalFields: Record<string, unknown> = {}
    for (const fieldName of Object.keys(taskFields)) {
      originalFields[fieldName] = task[fieldName as keyof Task]
    }

    return originalFields as Partial<NewTask>
  }
  // #endregion

  // #region 触发器更新
  // 传入了当前触发类型不支持的参数时返回错误文案
  private validateTriggerOverrides(task: Task, triggerOverrides: DirectCreateFlags): string | undefined {
    const allowedNames = TRIGGER_FLAG_NAMES_BY_TYPE[task.triggerType] ?? []
    const invalidNames = Object.keys(triggerOverrides).filter((flagName) => !allowedNames.includes(flagName))
    if (invalidNames.length === 0) return undefined

    const allowedHint = (allowedNames.length > 0) ? `支持: ${allowedNames.map((name) => `--${name}`).join(' ')}` : '该类型没有可修改的触发器参数'
    return `任务 "${task.name}" 的触发类型是 ${task.triggerType}，不支持 ${invalidNames.map((name) => `--${name}`).join(' ')}（${allowedHint}）`
  }

  // 旧触发器转成 flags，与新传入的 flags 合并后重新创建；校验规则复用 createTriggerDirect
  private async replaceTrigger(task: Task, snapshot: TriggerSnapshot, triggerOverrides: DirectCreateFlags): Promise<void> {
    const mergedFlags = this.mergeTriggerFlags(task.triggerType, snapshot.toFlags(), triggerOverrides)

    await snapshot.remove()
    await createTriggerDirect(task.id, task.triggerType, mergedFlags)
  }

  private mergeTriggerFlags(triggerType: string, oldFlags: DirectCreateFlags, overrides: DirectCreateFlags): DirectCreateFlags {
    const mergedFlags: DirectCreateFlags = {...oldFlags, ...overrides}
    if (triggerType !== 'monthly') return mergedFlags

    // 月触发有"按天/按周"两种模式：新传入哪种就丢弃旧配置里的另一种
    if (overrides.monthdays && !overrides['weeks-of-month']) {
      delete mergedFlags['weeks-of-month']
      if (!overrides.weekdays) delete mergedFlags.weekdays
    }

    if (overrides['weeks-of-month'] && !overrides.monthdays) {
      delete mergedFlags.monthdays
    }

    // createTriggerDirect 在按天模式下会忽略 weekdays，这里提前报错避免静默失效
    if (overrides.weekdays && !mergedFlags['weeks-of-month']) {
      throw new Error('--weekdays 仅用于按周模式，需同时指定 --weeks-of-month')
    }

    return mergedFlags
  }
  // #endregion
}
// #endregion
