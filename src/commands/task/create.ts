import {Args, Command, Flags} from '@oclif/core'
import prompts from 'prompts'
import {TaskService} from '../../lib/task/task-service.js'
import type {NewTask} from '../../db/schema.js'
import {createTriggerInteractive, createTriggerDirect} from '../../lib/task/trigger-creator.js'

export default class Create extends Command {
  static args = {
    name: Args.string({description: '任务名称'}),
  }

  static description = '创建定时任务到数据库'

  static examples = [
    {
      description: '交互式创建任务',
      command: '<%= config.bin %> <%= command.id %> --interactive',
    },
    {
      description: '直接创建每天任务',
      command: '<%= config.bin %> <%= command.id %> myTask --path="notepad.exe" --trigger=daily --start-time="09:00"',
    },
  ]

  static flags = {
    interactive: Flags.boolean({
      char: 'i',
      description: '交互式创建任务',
    }),
    path: Flags.string({
      description: '可执行文件路径',
    }),
    arguments: Flags.string({
      description: '执行参数',
    }),
    description: Flags.string({
      description: '任务描述',
    }),
    trigger: Flags.string({
      description: '触发类型',
      options: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'],
    }),
    'start-time': Flags.string({
      description: '开始时间 (HH:mm 或 YYYY-MM-DD HH:mm)',
    }),
    enabled: Flags.boolean({
      allowNo: true,
      default: true,
      description: '是否启用任务',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)

    if (flags.interactive) {
      await this.interactiveCreate()
    } else {
      await this.directCreate(args.name, flags)
    }
  }

  // #region 交互式创建
  private async interactiveCreate(): Promise<void> {
    const taskService = new TaskService()

    // 基础信息
    const basicInfo = await prompts([
      {
        type: 'text',
        name: 'name',
        message: '任务名称',
        validate: (value: string) => value.trim() ? true : '任务名称不能为空',
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
      this.error('操作已取消')
    }

    // 创建任务
    const newTask: NewTask = {
      name: basicInfo.name,
      executablePath: basicInfo.executablePath,
      arguments: basicInfo.arguments || undefined,
      description: basicInfo.description || undefined,
      triggerType: basicInfo.triggerType,
      enabled: basicInfo.enabled,
    }

    const task = await taskService.createTask(newTask)
    this.log(`✓ 任务创建成功: ${task.name} (ID: ${task.id})`)

    // 根据触发类型创建触发器配置
    await createTriggerInteractive(task.id, basicInfo.triggerType)
  }
  // #endregion

  // #region 直接创建
  private async directCreate(name: string | undefined, flags: any): Promise<void> {
    if (!name) {
      this.error('必须提供任务名称')
    }

    if (!flags.path) {
      this.error('必须提供可执行文件路径 (--path)')
    }

    if (!flags.trigger) {
      this.error('必须提供触发类型 (--trigger)')
    }

    const taskService = new TaskService()

    const newTask: NewTask = {
      name,
      executablePath: flags.path,
      arguments: flags.arguments || undefined,
      description: flags.description || undefined,
      triggerType: flags.trigger,
      enabled: flags.enabled,
    }

    const task = await taskService.createTask(newTask)
    this.log(`✓ 任务创建成功: ${task.name} (ID: ${task.id})`)

    // 根据触发类型创建触发器配置
    const message = await createTriggerDirect(task.id, flags.trigger, flags)
    this.log(message)
  }
  // #endregion
}
