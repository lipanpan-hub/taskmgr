import type {Task, DailyTrigger, WeeklyTrigger, MonthlyTrigger, OnceTrigger} from '../../db/schema.js'
import Table from 'cli-table3'
import {TaskService} from './task-service.js'

// #region 类型定义
export interface FilterOptions {
  name?: string
  enabled?: boolean
  disabled?: boolean
  type?: string
}

export type DisplayFormat = 'simple' | 'detailed-line' | 'block'
// #endregion

// #region 过滤器
export function applyFilters(tasks: Task[], options: FilterOptions): Task[] {
  let filtered = tasks

  // 按名称过滤
  if (options.name) {
    const nameLower = options.name.toLowerCase()
    filtered = filtered.filter((task) => task.name.toLowerCase().includes(nameLower))
  }

  // 按启用状态过滤
  if (options.enabled) {
    filtered = filtered.filter((task) => task.enabled)
  }

  if (options.disabled) {
    filtered = filtered.filter((task) => !task.enabled)
  }

  // 按触发类型过滤
  if (options.type) {
    filtered = filtered.filter((task) => task.triggerType === options.type)
  }

  return filtered
}
// #endregion

// #region 格式化输出
export function formatDetailedLine(tasks: Task[]): string[] {
  const table = new Table({
    head: ['ID', '任务名称', '类型', '状态', '可执行文件', '参数', '描述'],
    colWidths: [6, 16, 8, 8, 28, 30, 16],
    wordWrap: true,
    wrapOnWordBoundary: false,
    style: {head: ['cyan']},
  })

  for (const task of tasks) {
    const status = task.enabled ? '✓启用' : '✗禁用'
    table.push([
      task.id,
      task.name,
      task.triggerType,
      status,
      task.executablePath,
      task.arguments || '-',
      task.description || '-',
    ])
  }

  return ['\n任务详细列表:', table.toString()]
}

export async function formatBlock(tasks: Task[]): Promise<string[]> {
  const lines: string[] = []
  lines.push('\n任务详细信息:')

  const taskService = new TaskService()

  for (const [index, task] of tasks.entries()) {
    if (index > 0) lines.push('')
    lines.push('-'.repeat(80))
    lines.push(`任务 #${task.id}: ${task.name}`)
    lines.push(`  状态:         ${task.enabled ? '✓ 启用' : '✗ 禁用'}`)
    lines.push(`  触发类型:     ${task.triggerType}`)
    lines.push(`  可执行文件:   ${task.executablePath}`)
    if (task.arguments) lines.push(`  参数:         ${task.arguments}`)
    if (task.description) lines.push(`  描述:         ${task.description}`)
    lines.push(`  创建时间:     ${task.createdAt}`)
    lines.push(`  更新时间:     ${task.updatedAt}`)

    // 根据触发类型获取并显示 trigger 信息
    let trigger: DailyTrigger | WeeklyTrigger | MonthlyTrigger | OnceTrigger | null = null
    switch (task.triggerType) {
      case 'daily':
        trigger = await taskService.getDailyTriggerByTaskId(task.id)
        break
      case 'weekly':
        trigger = await taskService.getWeeklyTriggerByTaskId(task.id)
        break
      case 'monthly':
        trigger = await taskService.getMonthlyTriggerByTaskId(task.id)
        break
      case 'once':
        trigger = await taskService.getOnceTriggerByTaskId(task.id)
        break
    }

    if (trigger) {
      lines.push(`  触发器配置:`)
      if ('intervalDays' in trigger) {
        // DailyTrigger
        lines.push(`    间隔天数:   ${trigger.intervalDays}`)
        lines.push(`    开始时间:   ${trigger.startTime}`)
        lines.push(`    错过时启动: ${trigger.startWhenAvailable ? '是' : '否'}`)
      } else if ('intervalWeeks' in trigger) {
        // WeeklyTrigger
        const daysOfWeek = JSON.parse(trigger.daysOfWeek)
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const dayLabels = daysOfWeek.map((d: number) => dayNames[d]).join(', ')
        lines.push(`    间隔周数:   ${trigger.intervalWeeks}`)
        lines.push(`    星期几:     ${dayLabels}`)
        lines.push(`    开始时间:   ${trigger.startTime}`)
        lines.push(`    错过时启动: ${trigger.startWhenAvailable ? '是' : '否'}`)
      } else if ('months' in trigger) {
        // MonthlyTrigger
        const months = JSON.parse(trigger.months)
        lines.push(`    月份:       ${months.join(', ')}`)
        lines.push(`    触发模式:   ${trigger.triggerMode === 'days' ? '按天' : '按周'}`)
        if (trigger.triggerMode === 'days' && trigger.daysOfMonth) {
          const days = JSON.parse(trigger.daysOfMonth)
          lines.push(`    日期:       ${days.join(', ')}`)
        } else if (trigger.triggerMode === 'weeks' && trigger.weeksOfMonth && trigger.daysOfWeek) {
          const weeks = JSON.parse(trigger.weeksOfMonth)
          const daysOfWeek = JSON.parse(trigger.daysOfWeek)
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          const dayLabels = daysOfWeek.map((d: number) => dayNames[d]).join(', ')
          lines.push(`    第几周:     ${weeks.join(', ')}`)
          lines.push(`    星期几:     ${dayLabels}`)
        }
        lines.push(`    开始时间:   ${trigger.startTime}`)
        lines.push(`    错过时启动: ${trigger.startWhenAvailable ? '是' : '否'}`)
      } else if ('startTime' in trigger) {
        // OnceTrigger
        lines.push(`    执行时间:   ${trigger.startTime}`)
        lines.push(`    错过时启动: ${trigger.startWhenAvailable ? '是' : '否'}`)
      }
    }
  }

  lines.push('═'.repeat(80))
  return lines
}
// #endregion
