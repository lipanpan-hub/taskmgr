import type {Task} from '../../db/schema.js'

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
  const lines: string[] = []
  lines.push('\n任务详细列表:')
  lines.push(`ID | 任务名称 | 类型 | 状态 | 可执行文件 | 参数 | 描述`)
  lines.push('─'.repeat(100))

  for (const task of tasks) {
    const status = task.enabled ? '✓启用' : '✗禁用'
    const args = task.arguments || '-'
    const desc = task.description || '-'
    const path = truncate(task.executablePath, 25)
    const argsStr = truncate(args, 90)
    const descStr = truncate(desc, 12)

    lines.push(
      `${task.id} | ${truncate(task.name, 12)} | ${task.triggerType} | ${status} | ${path} | ${argsStr} | ${descStr}`,
    )
  }

  lines.push('─'.repeat(100))
  return lines
}

export function formatBlock(tasks: Task[]): string[] {
  const lines: string[] = []
  lines.push('\n任务详细信息:')

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
  }

  lines.push('═'.repeat(80))
  return lines
}
// #endregion

// #region 工具函数
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}
// #endregion
