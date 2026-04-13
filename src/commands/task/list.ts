import {Command, Flags} from '@oclif/core'
import {TaskService} from '../../lib/task/task-service.js'
import type {Task} from '../../db/schema.js'

export default class List extends Command {
  static description = '列出数据库中的所有定时任务'

  static examples = [
    {
      description: '列出所有任务',
      command: '<%= config.bin %> <%= command.id %>',
    },
    {
      description: '显示详细信息（单行）',
      command: '<%= config.bin %> <%= command.id %> --detail',
    },
    {
      description: '显示详细信息（块状）',
      command: '<%= config.bin %> <%= command.id %> --detail --block',
    },
    {
      description: '过滤特定任务',
      command: '<%= config.bin %> <%= command.id %> --filter="myTask"',
    },
    {
      description: '过滤启用的任务',
      command: '<%= config.bin %> <%= command.id %> --enabled',
    },
  ]

  static flags = {
    detail: Flags.boolean({
      char: 'd',
      description: '显示任务详细信息',
    }),
    block: Flags.boolean({
      char: 'b',
      description: '以块状格式显示详细信息（需配合 --detail 使用）',
    }),
    filter: Flags.string({
      char: 'f',
      description: '按任务名称过滤（支持部分匹配）',
    }),
    enabled: Flags.boolean({
      description: '仅显示启用的任务',
      exclusive: ['disabled'],
    }),
    disabled: Flags.boolean({
      description: '仅显示禁用的任务',
      exclusive: ['enabled'],
    }),
    type: Flags.string({
      char: 't',
      description: '按触发类型过滤',
      options: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(List)
    const taskService = new TaskService()

    let tasks = await taskService.getAllTasks()

    // 应用过滤器
    tasks = this.applyFilters(tasks, flags)

    if (tasks.length === 0) {
      this.log('暂无符合条件的任务')
      return
    }

    // 根据标志选择输出格式
    if (flags.detail && flags.block) {
      this.displayBlockFormat(tasks)
    } else if (flags.detail) {
      this.displayDetailedLine(tasks)
    } else {
      this.displaySimple(tasks)
    }

    this.log(`\n共 ${tasks.length} 个任务`)
  }

  // #region 过滤器
  private applyFilters(tasks: Task[], flags: any): Task[] {
    let filtered = tasks

    // 按名称过滤
    if (flags.filter) {
      const filterLower = flags.filter.toLowerCase()
      filtered = filtered.filter((task) => task.name.toLowerCase().includes(filterLower))
    }

    // 按启用状态过滤
    if (flags.enabled) {
      filtered = filtered.filter((task) => task.enabled)
    }

    if (flags.disabled) {
      filtered = filtered.filter((task) => !task.enabled)
    }

    // 按触发类型过滤
    if (flags.type) {
      filtered = filtered.filter((task) => task.triggerType === flags.type)
    }

    return filtered
  }
  // #endregion

  // #region 简单格式
  private displaySimple(tasks: Task[]): void {
    this.log('\n任务列表:')
    this.log('─'.repeat(80))
    this.log(`${'ID'.padEnd(6)} ${'任务名称'.padEnd(20)} ${'触发类型'.padEnd(12)} ${'状态'.padEnd(10)}`)
    this.log('─'.repeat(80))

    for (const task of tasks) {
      const status = task.enabled ? '✓ 启用' : '✗ 禁用'
      this.log(
        `${String(task.id).padEnd(6)} ${task.name.padEnd(20)} ${task.triggerType.padEnd(12)} ${status.padEnd(10)}`,
      )
    }

    this.log('─'.repeat(80))
  }
  // #endregion

  // #region 详细单行格式
  private displayDetailedLine(tasks: Task[]): void {
    this.log('\n任务详细列表:')
    this.log('─'.repeat(120))
    this.log(
      `${'ID'.padEnd(4)} ${'任务名称'.padEnd(15)} ${'类型'.padEnd(8)} ${'状态'.padEnd(6)} ${'可执行文件'.padEnd(30)} ${'参数'.padEnd(20)} ${'描述'.padEnd(15)}`,
    )
    this.log('─'.repeat(120))

    for (const task of tasks) {
      const status = task.enabled ? '✓启用' : '✗禁用'
      const args = task.arguments || '-'
      const desc = task.description || '-'
      const path = this.truncate(task.executablePath, 30)
      const argsStr = this.truncate(args, 20)
      const descStr = this.truncate(desc, 15)

      this.log(
        `${String(task.id).padEnd(4)} ${this.truncate(task.name, 15).padEnd(15)} ${task.triggerType.padEnd(8)} ${status.padEnd(6)} ${path.padEnd(30)} ${argsStr.padEnd(20)} ${descStr.padEnd(15)}`,
      )
    }

    this.log('─'.repeat(120))
  }
  // #endregion

  // #region 块状格式
  private displayBlockFormat(tasks: Task[]): void {
    this.log('\n任务详细信息:')

    for (const [index, task] of tasks.entries()) {
      if (index > 0) this.log('')
      this.log('═'.repeat(80))
      this.log(`任务 #${task.id}: ${task.name}`)
      this.log('─'.repeat(80))
      this.log(`  状态:         ${task.enabled ? '✓ 启用' : '✗ 禁用'}`)
      this.log(`  触发类型:     ${task.triggerType}`)
      this.log(`  可执行文件:   ${task.executablePath}`)
      if (task.arguments) this.log(`  参数:         ${task.arguments}`)
      if (task.description) this.log(`  描述:         ${task.description}`)
      this.log(`  创建时间:     ${task.createdAt}`)
      this.log(`  更新时间:     ${task.updatedAt}`)
    }

    this.log('═'.repeat(80))
  }
  // #endregion

  // #region 工具函数
  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str
    return str.slice(0, maxLen - 3) + '...'
  }
  // #endregion
}
