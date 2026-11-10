import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {advancedUpdateFlags} from '../../lib/task/advanced-options.js'
import {TaskUpdateHandler} from '../../lib/task/task-update-handler.js'

export default class Update extends BaseCommand {
  static args = {
    name: Args.string({description: '要更新的任务名称，省略则交互式选择', ignoreStdin: true}),
  }

  static description = [
    '更新任务：修改数据库中的任务信息，并重新同步到 Windows Task Scheduler。',
    '只修改传入的 flag，未传入的保持原值；可清除的项传空字符串清除（如 --end-time=）。',
    '不能修改任务名称和触发类型（需要时请 delete 后重新 create）。',
    '同步是覆盖重新注册，会中断 logon/boot 类任务正在进行的重复计划。',
    '只传 --arguments 时按原样保存，不会再做运行时参数优化（同时传 --path 和 --arguments 才会）。',
  ].join('\n')

  static examples = [
    {
      description: '修改任务的执行参数',
      command: '<%= config.bin %> <%= command.id %> myTask --arguments="-n 5 127.0.0.1"',
    },
    {
      description: '修改 weekly 任务的开始时间和星期',
      command: '<%= config.bin %> <%= command.id %> myTask --start-time="09:00" --weekdays="1,3,5"',
    },
    {
      description: '修改 monthly 任务为按周模式',
      command: '<%= config.bin %> <%= command.id %> myTask --weeks-of-month="1,3" --weekdays="1"',
    },
    {
      description: '清除过期时间和描述',
      command: '<%= config.bin %> <%= command.id %> myTask --end-time= --description=',
    },
    {
      description: '关闭唤醒电脑并取消隐藏',
      command: '<%= config.bin %> <%= command.id %> myTask --no-wake-to-run --no-hidden',
    },
  ]

  static flags = {
    path: Flags.string({description: '可执行文件路径或运行时名称'}),
    arguments: Flags.string({description: '执行参数；传空字符串(--arguments=)清除'}),
    description: Flags.string({description: '任务描述；传空字符串(--description=)清除'}),
    enabled: Flags.boolean({allowNo: true, description: '是否启用任务 (--no-enabled 禁用)'}),
    'start-time': Flags.string({
      description: '开始时间 (daily/weekly/monthly: HH:mm 或 YYYY-MM-DD HH:mm; once: YYYY-MM-DD HH:mm)',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
    }),
    interval: Flags.integer({
      description: '每隔几天(daily)/几周(weekly)执行一次',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
      min: 1,
    }),
    weekdays: Flags.string({
      description: '星期几 (weekly/monthly 按周模式; 逗号分隔, 0=周日...6=周六)',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
    }),
    months: Flags.string({
      description: '月份 (monthly; 逗号分隔, 1-12)',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
    }),
    monthdays: Flags.string({
      description: '每月几号 (monthly 按天模式; 逗号分隔, 1-31)；传入会切换为按天模式',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
    }),
    'weeks-of-month': Flags.string({
      description: '每月第几周 (monthly 按周模式; 逗号分隔, 1-5)；传入会切换为按周模式，需要 --weekdays',
      helpGroup: '触发器参数（仅修改当前触发类型，不能切换类型）',
    }),
    ...advancedUpdateFlags,
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const result = await new TaskUpdateHandler().update(args.name, flags)

    if (result.success) {
      this.log(result.message)
    } else {
      this.error(result.message)
    }
  }
}
