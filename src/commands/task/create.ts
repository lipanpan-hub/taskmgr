import { Command, Flags } from '@oclif/core'
import { getDb } from '../../backend/lib/db.js'
import { tasks } from '../../backend/model/schema.js'
import { runInteractiveCreate } from '../../lib/task/interactive-create.js'

export default class TaskCreate extends Command {
  static description = '向数据库中创建一条任务记录'
  
  static examples = [
    '<%= config.bin %> <%= command.id %> -i',
    '<%= config.bin %> <%= command.id %> --name "备份任务" --path "C:\\backup.bat" --trigger daily --time "02:00"',
    '<%= config.bin %> <%= command.id %> -n "清理任务" -p "C:\\clean.ps1" -t weekly --time "03:00" --args "-Force"',
  ]

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: '交互式创建任务',
      default: false,
      exclusive: ['name', 'description', 'path', 'args', 'trigger', 'time', 'enabled'],
    }),
    name: Flags.string({
      char: 'n',
      description: '任务名称',
      exclusive: ['interactive'],
    }),
    description: Flags.string({
      char: 'd',
      description: '任务描述',
      exclusive: ['interactive'],
    }),
    path: Flags.string({
      char: 'p',
      description: '可执行文件路径',
      exclusive: ['interactive'],
    }),
    args: Flags.string({
      char: 'a',
      description: '执行参数',
      exclusive: ['interactive'],
    }),
    trigger: Flags.string({
      char: 't',
      description: '触发类型 (daily|weekly|monthly|once|boot|logon)',
      options: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'],
      exclusive: ['interactive'],
    }),
    time: Flags.string({
      description: '开始时间 (HH:mm)',
      exclusive: ['interactive'],
    }),
    enabled: Flags.boolean({
      description: '是否启用',
      default: true,
      allowNo: true,
      exclusive: ['interactive'],
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(TaskCreate)

    // #region 交互式模式
    if (flags.interactive) {
      const result = await runInteractiveCreate()
      if (!result.success) {
        if (result.error) {
          this.error(`创建任务失败: ${result.error}`)
        } else {
          this.log('已取消')
        }
        return
      }
      this.log(`✓ 任务 "${result.taskName}" 已成功创建`)
      return
    }
    // #endregion

    // #region 命令行参数模式
    // 验证必需参数
    if (!flags.name) {
      this.error('缺少必需参数: --name')
    }

    if (!flags.path) {
      this.error('缺少必需参数: --path')
    }

    // 验证时间格式
    const startTime = flags.time || '09:00'
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      this.error('时间格式无效，请使用 HH:mm 格式')
    }

    try {
      const db = getDb()
      await db.insert(tasks).values({
        name: flags.name,
        description: flags.description || null,
        executablePath: flags.path,
        arguments: flags.args || null,
        triggerType: (flags.trigger as any) || 'daily',
        startTime,
        enabled: flags.enabled,
      })

      this.log(`✓ 任务 "${flags.name}" 已成功创建`)
    } catch (error) {
      if (error instanceof Error) {
        this.error(`创建任务失败: ${error.message}`)
      } else {
        this.error('创建任务失败')
      }
    }
    // #endregion
  }
}
