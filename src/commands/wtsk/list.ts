import {Command, Flags} from '@oclif/core'

import {getAllTasks, TaskInfo} from '../../lib/wtsk/task-scheduler.js'

export default class List extends Command {
  static description = '手动列出所有定时任务'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --block',
    '<%= config.bin %> <%= command.id %> --limit 10',
    '<%= config.bin %> <%= command.id %> -l 5 --block',
  ]
  static flags = {
    block: Flags.boolean({
      char:"b",
      allowNo: true,
      default: false,
      description: '使用块状格式显示任务详情',
    }),
    limit: Flags.integer({
      char: 'l',
      description: '限制输出的任务数量',
      min: 1,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(List)
    const result = await getAllTasks()

    if (!result || typeof result === 'string') {
      this.log(result ?? '获取任务列表失败')
      return
    }

    const tasks = result as TaskInfo[]

    if (tasks.length === 0) {
      this.log('暂无定时任务')
      return
    }

    // 应用数量限制
    const displayTasks = flags.limit ? tasks.slice(0, flags.limit) : tasks

    this.log('')
    this.log(`任务列表 (显示 ${displayTasks.length}/${tasks.length}):`)
    this.log('')

    if (flags.block) {
      for (const task of displayTasks) {
        this.log(`  ${task.name}`)
        this.log(`    路径: ${task.path}`)
        this.log(`    URI: ${task.uri || '无'}`)
        this.log(`    状态: ${task.state} | 启用: ${task.enabled ? '是' : '否'}`)
        this.log(`    注册日期: ${task.registrationDate || '未知'}`)
        this.log(`    版本: ${task.version || '无'} | 作者: ${task.author || '未知'}`)
        this.log(`    上次运行: ${task.lastRunTime}`)
        this.log(`    下次运行: ${task.nextRunTime}`)
        this.log(`    运行结果: ${task.lastTaskResult} | 错过次数: ${task.numberOfMissedRuns}`)
        this.log(`    触发器: ${task.triggers.join(', ') || '无'}`)
        this.log(`    操作: ${task.actions.join(', ') || '无'}`)
        this.log('')
      }
    } else {
      for (const task of displayTasks) {
        this.log(`  ${task.name} | 状态: ${task.state} | 上次运行: ${task.lastRunTime} | 下次运行: ${task.nextRunTime}`)
      }
    }
  }
}
