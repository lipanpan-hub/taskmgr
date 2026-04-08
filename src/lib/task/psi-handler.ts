import Fuse from 'fuse.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import prompts from 'prompts'

export async function handlePsiInteractive(configDir: string) {
  const scriptsDir = join(configDir, 'scripts')
  
  let scripts: string[] = []
  try {
    scripts = readdirSync(scriptsDir).filter(f => f.endsWith('.ps1'))
  } catch {
    throw new Error('scripts 目录不存在或无法读取')
  }

  if (scripts.length === 0) {
    throw new Error('scripts 目录下没有 PowerShell 脚本')
  }

  const baseResponse = await prompts([
    {
      type: 'select',
      name: 'selected',
      message: '选择要执行的脚本',
      choices: scripts.map(s => ({ title: s, value: s })),
    },
    {
      type: 'select',
      name: 'trigger',
      message: '选择触发类型',
      choices: [
        { title: '天触发任务', value: 'daily' },
        { title: '周触发任务', value: 'weekly' },
        { title: '月触发任务', value: 'monthly' },
        { title: '一次性任务', value: 'once' },
        { title: '启动时任务', value: 'boot' },
        { title: '登录时任务', value: 'logon' },
      ],
      initial: 0,
    },
  ])

  if (!baseResponse.selected || !baseResponse.trigger) {
    throw new Error('未选择任何脚本或触发类型')
  }

  let triggerConfig: any = {}
  switch (baseResponse.trigger) {
    case 'daily':
      triggerConfig = await handleDailyTrigger()
      break
    case 'weekly':
      triggerConfig = await handleWeeklyTrigger()
      break
    case 'monthly':
      triggerConfig = await handleMonthlyTrigger()
      break
    case 'once':
      triggerConfig = await handleOnceTrigger()
      break
    case 'boot':
      triggerConfig = await handleBootTrigger()
      break
    case 'logon':
      triggerConfig = await handleLogonTrigger()
      break
  }

  // 如果用户强制中断了操作，对于需要时间的触发类型将缺失时间
  if (['daily', 'weekly', 'monthly', 'once'].includes(baseResponse.trigger) && (!triggerConfig || !triggerConfig.time)) {
    throw new Error('操作已中止: 缺少必要的时间设置')
  }

  const executablePath = 'cmd.exe'
  const execArguments = `/c start /min "" powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "${join(scriptsDir, baseResponse.selected)}"`

  return {
    executablePath,
    execArguments,
    trigger: baseResponse.trigger,
    time: triggerConfig.time,
    weekdays: triggerConfig.weekdays,
    monthdays: triggerConfig.monthdays,
    months: triggerConfig.months,
    weeksOfMonth: triggerConfig.weeksOfMonth,
    interval: triggerConfig.interval,
  }
}

const timePrompt: prompts.PromptObject = {
  type: 'text',
  name: 'time',
  message: '输入开始时间 (YYYY-MM-DD HH:mm 或 HH:mm)',
  initial: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} 09:00`,
  validate: (value: string) => /^(\d{4}-\d{2}-\d{2} )?\d{2}:\d{2}$/.test(value) || '请输入有效的时间格式 (YYYY-MM-DD HH:mm 或 HH:mm)',
}

async function handleDailyTrigger() {
  return prompts([
    timePrompt,
    {
      type: 'number',
      name: 'interval',
      message: '每隔几天触发',
      initial: 1,
      min: 1,
    }
  ])
}

async function handleWeeklyTrigger() {
  return prompts([
    timePrompt,
    {
      type: 'number',
      name: 'interval',
      message: '每隔几周触发',
      initial: 1,
      min: 1,
    },
    {
      type: 'multiselect',
      name: 'weekdays',
      message: '选择每周执行的天（空格选中，回车确认）',
      choices: [
        { title: '周一', value: 1 },
        { title: '周二', value: 2 },
        { title: '周三', value: 3 },
        { title: '周四', value: 4 },
        { title: '周五', value: 5 },
        { title: '周六', value: 6 },
        { title: '周日', value: 0 },
      ],
      min: 1,
    }
  ])
}

async function handleMonthlyTrigger() {
  return prompts([
    timePrompt,
    {
      type: 'multiselect',
      name: 'months',
      message: '选择每年执行的月份（空格选中，回车确认）',
      choices: [
        { title: '一月', value: 1 },
        { title: '二月', value: 2 },
        { title: '三月', value: 3 },
        { title: '四月', value: 4 },
        { title: '五月', value: 5 },
        { title: '六月', value: 6 },
        { title: '七月', value: 7 },
        { title: '八月', value: 8 },
        { title: '九月', value: 9 },
        { title: '十月', value: 10 },
        { title: '十一月', value: 11 },
        { title: '十二月', value: 12 },
      ],
      min: 1,
    },
    {
      type: 'select',
      name: 'monthlyType',
      message: '按天还是按周执行',
      choices: [
        { title: '按天', value: 'day' },
        { title: '按周', value: 'week' },
      ],
    },
    {
      type: prev => prev === 'day' ? 'autocompleteMultiselect' : null,
      name: 'monthdays',
      message: '选择每月执行的日期（输入数字过滤，空格选中，回车确认）',
      choices: Array.from({ length: 31 }, (_, i) => ({ title: `${i + 1} 日`, value: i + 1 })),
      min: 1,
      suggest(input: string, choices: prompts.Choice[]) {
        if (!input) return Promise.resolve(choices)
        const fuse = new Fuse(choices, { keys: ['title'], threshold: 0.4 })
        return Promise.resolve(fuse.search(input).map(r => r.item))
      },
    },
    {
      type: (prev, values) => values.monthlyType === 'week' ? 'multiselect' : null,
      name: 'weeksOfMonth',
      message: '选择第几周（空格选中，回车确认）',
      choices: [
        { title: '第一周', value: 1 },
        { title: '第二周', value: 2 },
        { title: '第三周', value: 3 },
        { title: '第四周', value: 4 },
        { title: '最后一周', value: 5 }, // TaskScheduler WhichWeek.LastWeek
      ],
      min: 1,
    },
    {
      type: (prev, values) => values.monthlyType === 'week' ? 'multiselect' : null,
      name: 'weekdays',
      message: '选择星期几（空格选中，回车确认）',
      choices: [
        { title: '周一', value: 1 },
        { title: '周二', value: 2 },
        { title: '周三', value: 3 },
        { title: '周四', value: 4 },
        { title: '周五', value: 5 },
        { title: '周六', value: 6 },
        { title: '周日', value: 0 },
      ],
      min: 1,
    }
  ])
}

async function handleOnceTrigger() {
  return prompts([ timePrompt ])
}

async function handleBootTrigger() {
  return {}
}

async function handleLogonTrigger() {
  return {}
}
