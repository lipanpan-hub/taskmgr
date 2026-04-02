import type { NewTask } from '../../backend/model/schema.js'

export interface ValidationError {
  error: string
  message: string
}

const VALID_TRIGGER_TYPES = ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'] as const

export function validateTaskId(id: unknown): number | ValidationError {
  const numId = Number(id)
  if (Number.isNaN(numId)) {
    return { error: '无效的任务ID', message: '任务ID必须是数字' }
  }
  return numId
}

export function validateNewTask(task: NewTask): ValidationError | null {
  if (!task.name || task.name.trim() === '') {
    return { error: '缺少必填字段', message: 'name 字段不能为空' }
  }

  if (!task.executablePath || task.executablePath.trim() === '') {
    return { error: '缺少必填字段', message: 'executablePath 字段不能为空' }
  }

  if (task.triggerType && !VALID_TRIGGER_TYPES.includes(task.triggerType as any)) {
    return {
      error: '无效的触发类型',
      message: `triggerType 必须是以下值之一: ${VALID_TRIGGER_TYPES.join(', ')}`,
    }
  }

  return null
}
