import {eq} from 'drizzle-orm'
import {getDb} from '../../db/index.js'
import {dailyTriggers, weeklyTriggers, monthlyTriggers, onceTriggers} from '../../db/schema.js'
import type {CreateTaskOptions} from '../wtsk/task-scheduler.js'

// 构建任务选项
export async function buildTaskOptions(task: any): Promise<CreateTaskOptions> {
  const db = getDb()
  const baseOptions: CreateTaskOptions = {
    taskName: task.name,
    executablePath: task.executablePath,
    arguments: task.arguments,
    description: task.description,
    enabled: task.enabled,
    triggerType: task.triggerType,
    weekdays: [],
    months: [],
    monthdays: [],
    weeksOfMonth: [],
    interval: 1,
    hidden: false,
    wakeToRun: true,
    startWhenAvailable: false,
    disallowStartIfOnBatteries: false,
    stopIfGoingOnBatteries: false,
  }

  // 根据触发类型获取触发器配置
  switch (task.triggerType) {
    case 'daily': {
      const [trigger] = await db.select().from(dailyTriggers).where(eq(dailyTriggers.taskId, task.id))
      if (!trigger) throw new Error('未找到天触发配置')
      return {
        ...baseOptions,
        startTime: trigger.startTime,
        interval: trigger.intervalDays,
        startWhenAvailable: trigger.startWhenAvailable,
      }
    }

    case 'weekly': {
      const [trigger] = await db.select().from(weeklyTriggers).where(eq(weeklyTriggers.taskId, task.id))
      if (!trigger) throw new Error('未找到周触发配置')
      return {
        ...baseOptions,
        startTime: trigger.startTime,
        interval: trigger.intervalWeeks,
        weekdays: JSON.parse(trigger.daysOfWeek),
        startWhenAvailable: trigger.startWhenAvailable,
      }
    }

    case 'monthly': {
      const [trigger] = await db.select().from(monthlyTriggers).where(eq(monthlyTriggers.taskId, task.id))
      if (!trigger) throw new Error('未找到月触发配置')
      const options: CreateTaskOptions = {
        ...baseOptions,
        startTime: trigger.startTime,
        months: JSON.parse(trigger.months),
        startWhenAvailable: trigger.startWhenAvailable,
      }

      if (trigger.triggerMode === 'days' && trigger.daysOfMonth) {
        options.monthdays = JSON.parse(trigger.daysOfMonth)
      } else if (trigger.triggerMode === 'weeks' && trigger.weeksOfMonth && trigger.daysOfWeek) {
        options.weeksOfMonth = JSON.parse(trigger.weeksOfMonth)
        options.weekdays = JSON.parse(trigger.daysOfWeek)
      }

      return options
    }

    case 'once': {
      const [trigger] = await db.select().from(onceTriggers).where(eq(onceTriggers.taskId, task.id))
      if (!trigger) throw new Error('未找到一次性触发配置')
      return {
        ...baseOptions,
        startTime: trigger.startTime,
        startWhenAvailable: trigger.startWhenAvailable,
      }
    }

    case 'boot':
    case 'logon':
      return baseOptions

    default:
      throw new Error(`未知的触发类型: ${task.triggerType}`)
  }
}
