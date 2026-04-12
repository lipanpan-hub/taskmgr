import prompts from 'prompts'
import Fuse from 'fuse.js'
import {getDb} from '../../db/index.js'
import {
  dailyTriggers,
  weeklyTriggers,
  monthlyTriggers,
  onceTriggers,
  type NewDailyTrigger,
  type NewWeeklyTrigger,
  type NewMonthlyTrigger,
  type NewOnceTrigger,
} from '../../db/schema.js'

// #region 交互式创建触发器
export async function createTriggerInteractive(taskId: number, triggerType: string): Promise<void> {
  const db = getDb()

  switch (triggerType) {
    case 'daily':
      await createDailyTriggerInteractive(db, taskId)
      break
    case 'weekly':
      await createWeeklyTriggerInteractive(db, taskId)
      break
    case 'monthly':
      await createMonthlyTriggerInteractive(db, taskId)
      break
    case 'once':
      await createOnceTriggerInteractive(db, taskId)
      break
    case 'boot':
    case 'logon':
      console.log('启动/登录触发任务无需额外配置')
      break
  }
}

async function createDailyTriggerInteractive(db: any, taskId: number): Promise<void> {
  const config = await prompts([
    {
      type: 'text',
      name: 'startTime',
      message: '开始时间 (HH:mm)',
      initial: '09:00',
      validate: (value: string) => /^\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (HH:mm)',
    },
    {
      type: 'number',
      name: 'intervalDays',
      message: '每隔几天触发',
      initial: 1,
      min: 1,
    },
    {
      type: 'toggle',
      name: 'startWhenAvailable',
      message: '错过启动时间后是否补运行',
      initial: false,
      active: '是',
      inactive: '否',
    },
  ])

  if (!config.startTime) {
    throw new Error('操作已取消')
  }

  const trigger: NewDailyTrigger = {
    taskId,
    startTime: config.startTime,
    intervalDays: config.intervalDays,
    startWhenAvailable: config.startWhenAvailable,
  }

  const result = await db.insert(dailyTriggers).values(trigger)
  if (result) console.log('✓ 天触发配置已创建')
}

async function createWeeklyTriggerInteractive(db: any, taskId: number): Promise<void> {
  const config = await prompts([
    {
      type: 'text',
      name: 'startTime',
      message: '开始时间 (HH:mm)',
      initial: '09:00',
      validate: (value: string) => /^\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (HH:mm)',
    },
    {
      type: 'number',
      name: 'intervalWeeks',
      message: '每隔几周触发',
      initial: 1,
      min: 1,
    },
    {
      type: 'multiselect',
      name: 'daysOfWeek',
      message: '选择每周执行的天（空格选中，回车确认）',
      choices: [
        {title: '周一', value: 1},
        {title: '周二', value: 2},
        {title: '周三', value: 3},
        {title: '周四', value: 4},
        {title: '周五', value: 5},
        {title: '周六', value: 6},
        {title: '周日', value: 0},
      ],
      min: 1,
    },
    {
      type: 'toggle',
      name: 'startWhenAvailable',
      message: '错过启动时间后是否补运行',
      initial: false,
      active: '是',
      inactive: '否',
    },
  ])

  if (!config.startTime || !config.daysOfWeek) {
    throw new Error('操作已取消')
  }

  const trigger: NewWeeklyTrigger = {
    taskId,
    startTime: config.startTime,
    intervalWeeks: config.intervalWeeks,
    daysOfWeek: JSON.stringify(config.daysOfWeek),
    startWhenAvailable: config.startWhenAvailable,
  }

  const result = await db.insert(weeklyTriggers).values(trigger)
  if (result) console.log('✓ 周触发配置已创建')
}

async function createMonthlyTriggerInteractive(db: any, taskId: number): Promise<void> {
  const config = await prompts([
    {
      type: 'text',
      name: 'startTime',
      message: '开始时间 (HH:mm)',
      initial: '09:00',
      validate: (value: string) => /^\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (HH:mm)',
    },
    {
      type: 'multiselect',
      name: 'months',
      message: '选择每年执行的月份（空格选中，回车确认）',
      choices: [
        {title: '一月', value: 1},
        {title: '二月', value: 2},
        {title: '三月', value: 3},
        {title: '四月', value: 4},
        {title: '五月', value: 5},
        {title: '六月', value: 6},
        {title: '七月', value: 7},
        {title: '八月', value: 8},
        {title: '九月', value: 9},
        {title: '十月', value: 10},
        {title: '十一月', value: 11},
        {title: '十二月', value: 12},
      ],
      min: 1,
    },
    {
      type: 'select',
      name: 'triggerMode',
      message: '按天还是按周执行',
      choices: [
        {title: '按天', value: 'days'},
        {title: '按周', value: 'weeks'},
      ],
    },
    {
      type: (_prev, values) => (values.triggerMode === 'days' ? 'autocompleteMultiselect' : null),
      name: 'daysOfMonth',
      message: '选择每月执行的日期（输入数字过滤，空格选中，回车确认）',
      choices: Array.from({length: 31}, (_, i) => ({title: `${i + 1} 日`, value: i + 1})),
      min: 1,
      suggest(input: string, choices: prompts.Choice[]) {
        if (!input) return Promise.resolve(choices)
        const fuse = new Fuse(choices, {keys: ['title'], threshold: 0.4})
        return Promise.resolve(fuse.search(input).map((r) => r.item))
      },
    },
    {
      type: (_prev, values) => (values.triggerMode === 'weeks' ? 'multiselect' : null),
      name: 'weeksOfMonth',
      message: '选择第几周（空格选中，回车确认）',
      choices: [
        {title: '第一周', value: 1},
        {title: '第二周', value: 2},
        {title: '第三周', value: 3},
        {title: '第四周', value: 4},
        {title: '最后一周', value: 5},
      ],
      min: 1,
    },
    {
      type: (_prev, values) => (values.triggerMode === 'weeks' ? 'multiselect' : null),
      name: 'daysOfWeek',
      message: '选择星期几（空格选中，回车确认）',
      choices: [
        {title: '周一', value: 1},
        {title: '周二', value: 2},
        {title: '周三', value: 3},
        {title: '周四', value: 4},
        {title: '周五', value: 5},
        {title: '周六', value: 6},
        {title: '周日', value: 0},
      ],
      min: 1,
    },
    {
      type: 'toggle',
      name: 'startWhenAvailable',
      message: '错过启动时间后是否补运行',
      initial: false,
      active: '是',
      inactive: '否',
    },
  ])

  if (!config.startTime || !config.months || !config.triggerMode) {
    throw new Error('操作已取消')
  }

  const trigger: NewMonthlyTrigger = {
    taskId,
    startTime: config.startTime,
    months: JSON.stringify(config.months),
    triggerMode: config.triggerMode,
    daysOfMonth: config.daysOfMonth ? JSON.stringify(config.daysOfMonth) : undefined,
    weeksOfMonth: config.weeksOfMonth ? JSON.stringify(config.weeksOfMonth) : undefined,
    daysOfWeek: config.daysOfWeek ? JSON.stringify(config.daysOfWeek) : undefined,
    startWhenAvailable: config.startWhenAvailable,
  }

  const result = await db.insert(monthlyTriggers).values(trigger)
  if (result) console.log('✓ 月触发配置已创建')
}

async function createOnceTriggerInteractive(db: any, taskId: number): Promise<void> {
  const config = await prompts([
    {
      type: 'text',
      name: 'startTime',
      message: '开始时间 (YYYY-MM-DD HH:mm)',
      initial: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} 09:00`,
      validate: (value: string) =>
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (YYYY-MM-DD HH:mm)',
    },
    {
      type: 'toggle',
      name: 'startWhenAvailable',
      message: '错过启动时间后是否补运行',
      initial: false,
      active: '是',
      inactive: '否',
    },
  ])

  if (!config.startTime) {
    throw new Error('操作已取消')
  }

  const trigger: NewOnceTrigger = {
    taskId,
    startTime: config.startTime,
    startWhenAvailable: config.startWhenAvailable,
  }

  const result = await db.insert(onceTriggers).values(trigger)
  if (result) console.log('✓ 一次性触发配置已创建')
}
// #endregion

// #region 直接创建触发器
export async function createTriggerDirect(taskId: number, triggerType: string, flags: any): Promise<string> {
  const db = getDb()

  switch (triggerType) {
    case 'daily':
      if (!flags['start-time']) {
        throw new Error('daily 触发类型需要 --start-time 参数')
      }

      const result = await db.insert(dailyTriggers).values({
        taskId,
        startTime: flags['start-time'],
        intervalDays: 1,
        startWhenAvailable: false,
      })
      return result ? '✓ 天触发配置已创建' : '✗ 天触发配置创建失败'
    case 'weekly':
    case 'monthly':
    case 'once':
      return `${triggerType} 触发类型需要更多参数，请使用 --interactive 模式`
    case 'boot':
    case 'logon':
      return '启动/登录触发任务无需额外配置'
    default:
      throw new Error(`未知的触发类型: ${triggerType}`)
  }
}
// #endregion
