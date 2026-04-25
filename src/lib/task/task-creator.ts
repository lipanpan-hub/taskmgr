import prompts from 'prompts'
import Fuse from 'fuse.js'
import {TaskService} from './task-service.js'
import type {NewTask} from '../../db/schema.js'
import {createTriggerDirect, createTriggerInteractive} from './trigger-creator.js'
import {syncTaskToScheduler} from './task-sync-handler.js'
import {getAvailableRuntimeNames} from '../utils/runtime-detector.js'
import {optimizeTaskInput} from './task-input-optimizer.js'
import {scanScripts} from '../utils/script-scanner.js'

// #region 交互式创建
export async function interactiveCreateTask(): Promise<void> {
  const taskService = new TaskService()

  // 获取可用运行时列表
  const availableRuntimes = await getAvailableRuntimeNames()
  const runtimeChoices = availableRuntimes.map((runtime) => ({title: runtime, value: runtime}))

  // 获取脚本文件列表
  const scripts = scanScripts()
  const scriptChoices = scripts.map((script) => ({title: script.path, value: script.path}))

  // 配置 Fuse.js 用于模糊搜索
  const runtimeFuse = new Fuse(runtimeChoices, {
    keys: ['title'],
    threshold: 0.3,
    distance: 100,
  })

  const scriptFuse = new Fuse(scriptChoices, {
    keys: ['title'],
    threshold: 0.3,
    distance: 100,
  })

  // 基础信息
  const basicInfo = await prompts([
    {
      type: 'text',
      name: 'name',
      message: '任务名称',
      validate: (value: string) => value.trim() ? true : '任务名称不能为空',
    },
    {
      type: 'autocomplete',
      name: 'executablePath',
      message: '可执行文件路径',
      choices: runtimeChoices,
      suggest: async (input: string, choices: any[]) => {
        if (!input) return choices
        const results = runtimeFuse.search(input)
        // 如果有匹配结果，返回匹配项；否则返回用户输入作为自定义选项
        if (results.length > 0) {
          return results.map((r) => r.item)
        }
        // 返回用户输入作为自定义选项，同时保留所有原始选项
        return [{title: input, value: input}, ...choices]
      },
      validate: (value: string) => value.trim() ? true : '可执行文件路径不能为空',
    },
    {
      type: 'autocomplete',
      name: 'arguments',
      message: '执行参数（可选）',
      choices: scriptChoices,
      suggest: async (input: string, choices: any[]) => {
        if (!input) return choices
        const results = scriptFuse.search(input)
        // 如果有匹配结果，返回匹配项；否则返回用户输入作为自定义选项
        if (results.length > 0) {
          return results.map((r) => r.item)
        }
        // 返回用户输入作为自定义选项，同时保留所有原始选项
        return [{title: input, value: input}, ...choices]
      },
    },
    {
      type: 'text',
      name: 'description',
      message: '任务描述（可选）',
    },
    {
      type: 'select',
      name: 'triggerType',
      message: '触发类型',
      choices: [
        {title: '天触发任务', value: 'daily'},
        {title: '周触发任务', value: 'weekly'},
        {title: '月触发任务', value: 'monthly'},
        {title: '一次性任务', value: 'once'},
        {title: '启动时任务', value: 'boot'},
        {title: '登录时任务', value: 'logon'},
      ],
      initial: 0,
    },
    {
      type: 'toggle',
      name: 'enabled',
      message: '是否启用任务',
      initial: true,
      active: '是',
      inactive: '否',
    },
  ])

  if (!basicInfo.name || !basicInfo.executablePath || !basicInfo.triggerType) {
    throw new Error('操作已取消')
  }

  // 优化任务输入
  const optimized = await optimizeTaskInput(basicInfo.executablePath, basicInfo.arguments)

  // 创建任务
  const newTask: NewTask = {
    name: basicInfo.name,
    executablePath: optimized.executablePath,
    arguments: optimized.arguments,
    description: basicInfo.description || undefined,
    triggerType: basicInfo.triggerType,
    enabled: basicInfo.enabled,
  }

  let task

  try {
    // 步骤1: 创建任务
    task = await taskService.createTask(newTask)
    if (!task) {
      throw new Error('任务创建失败')
    }
    console.log(`✓ 任务创建成功: ${task.name} (ID: ${task.id})`)

    // 步骤2: 创建触发器配置
    const triggerCreated = await createTriggerInteractive(task.id, basicInfo.triggerType)
    if (!triggerCreated) {
      throw new Error('触发器配置未完成')
    }

    // 步骤3: 同步到 Windows Task Scheduler
    const syncResult = await syncTaskToScheduler(task)
    if (!syncResult.success) {
      throw new Error(`同步到 Windows Task Scheduler 失败: ${syncResult.message}`)
    }

    console.log(`✓ 已同步到 Windows Task Scheduler`)
    console.log(`✓ 任务创建完成`)
  } catch (error) {
    // 回滚操作
    if (task) {
      console.warn(`✗ 操作失败，正在回滚...`)
      await taskService.deleteTask(task.id)
      // 这个回滚操作会自动清理 触发器配置表
      console.warn(`✓ 已回滚任务: ${task.name} (ID: ${task.id})`)
    }

    throw new Error(`任务创建失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
// #endregion

// #region 直接创建
export async function directCreateTask(
  name: string | undefined,
  flags: any,
): Promise<void> {
  if (!name) {
    throw new Error('必须提供任务名称')
  }

  if (!flags.path) {
    throw new Error('必须提供可执行文件路径 (--path)')
  }

  if (!flags.trigger) {
    throw new Error('必须提供触发类型 (--trigger)')
  }

  const taskService = new TaskService()

  // 优化任务输入
  const optimized = await optimizeTaskInput(flags.path, flags.arguments)

  const newTask: NewTask = {
    name: name!,
    executablePath: optimized.executablePath,
    arguments: optimized.arguments,
    description: flags.description || undefined,
    triggerType: flags.trigger,
    enabled: flags.enabled,
  }

  let task

  try {
    // 步骤1: 创建任务
    task = await taskService.createTask(newTask)
    if (!task) {
      throw new Error('任务创建失败')
    }
    console.log(`✓ 任务创建成功: ${task.name} (ID: ${task.id})`)

    // 步骤2: 创建触发器配置
    const message = await createTriggerDirect(task.id, flags.trigger, flags)
    console.log(message)

    // 步骤3: 同步到 Windows Task Scheduler
    const syncResult = await syncTaskToScheduler(task)
    if (!syncResult.success) {
      throw new Error(`同步到 Windows Task Scheduler 失败: ${syncResult.message}`)
    }

    console.log(`✓ 已同步到 Windows Task Scheduler`)
    console.log(`✓ 任务创建完成`)
  } catch (error) {
    // 回滚操作
    if (task) {
      console.warn(`✗ 操作失败，正在回滚...`)
      await taskService.deleteTask(task.id)
      console.warn(`✓ 已回滚任务: ${task.name} (ID: ${task.id})`)
    }

    throw new Error(`任务创建失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}
// #endregion
