import prompts from 'prompts'
import { getDb } from '../../backend/lib/db.js'
import { tasks } from '../../backend/model/schema.js'

export interface InteractiveCreateResult {
  success: boolean
  taskName?: string
  error?: string
}

export async function runInteractiveCreate(): Promise<InteractiveCreateResult> {
  const response = await prompts([
    {
      type: 'text',
      name: 'name',
      message: '任务名称',
      validate: (value: string) => value.trim() ? true : '任务名称不能为空',
    },
    {
      type: 'text',
      name: 'description',
      message: '任务描述（可选）',
    },
    {
      type: 'text',
      name: 'executablePath',
      message: '可执行文件路径',
      validate: (value: string) => value.trim() ? true : '可执行文件路径不能为空',
    },
    {
      type: 'text',
      name: 'arguments',
      message: '执行参数（可选）',
    },
    {
      type: 'select',
      name: 'triggerType',
      message: '触发类型',
      choices: [
        { title: '每天', value: 'daily' },
        { title: '每周', value: 'weekly' },
        { title: '每月', value: 'monthly' },
        { title: '一次', value: 'once' },
        { title: '启动时', value: 'boot' },
        { title: '登录时', value: 'logon' },
      ],
      initial: 0,
    },
    {
      type: 'text',
      name: 'startTime',
      message: '开始时间 (HH:mm)',
      initial: '09:00',
      validate: (value: string) => /^\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (HH:mm)',
    },
    {
      type: 'toggle',
      name: 'enabled',
      message: '是否启用',
      initial: true,
      active: '是',
      inactive: '否',
    },
  ])

  // 用户取消输入
  if (!response.name) {
    return { success: false }
  }

  try {
    const db = getDb()
    await db.insert(tasks).values({
      name: response.name,
      description: response.description || null,
      executablePath: response.executablePath,
      arguments: response.arguments || null,
      triggerType: response.triggerType,
      startTime: response.startTime,
      enabled: response.enabled,
    })

    return { success: true, taskName: response.name }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    } else {
      return { success: false, error: '未知错误' }
    }
  }
}
