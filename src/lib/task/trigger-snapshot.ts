import {eq} from 'drizzle-orm'
import {getDb} from '../../db/index.js'
import {
  type DailyTrigger,
  type MonthlyTrigger,
  type OnceTrigger,
  type WeeklyTrigger,
  dailyTriggers,
  monthlyTriggers,
  onceTriggers,
  weeklyTriggers,
} from '../../db/schema.js'
import type {DirectCreateFlags} from './trigger-creator.js'

type TriggerRow = DailyTrigger | MonthlyTrigger | OnceTrigger | WeeklyTrigger

// 触发器配置的快照（备忘录模式）：update 失败时用它把触发器子表恢复成更新前的样子；
// 同时把旧配置转换成 create 使用的 flags，供 update 与新传入的 flags 合并后重新创建
export class TriggerSnapshot {
  private constructor(
    private readonly taskId: number,
    private readonly triggerType: string,
    private readonly row: TriggerRow | undefined,
  ) {}

  // #region 抓取快照
  static async capture(taskId: number, triggerType: string): Promise<TriggerSnapshot> {
    const db = getDb()
    let rows: TriggerRow[] = []

    switch (triggerType) {
      case 'daily': {
        rows = await db.select().from(dailyTriggers).where(eq(dailyTriggers.taskId, taskId))
        break
      }

      case 'monthly': {
        rows = await db.select().from(monthlyTriggers).where(eq(monthlyTriggers.taskId, taskId))
        break
      }

      case 'once': {
        rows = await db.select().from(onceTriggers).where(eq(onceTriggers.taskId, taskId))
        break
      }

      case 'weekly': {
        rows = await db.select().from(weeklyTriggers).where(eq(weeklyTriggers.taskId, taskId))
        break
      }

      // boot / logon 没有子表
    }

    return new TriggerSnapshot(taskId, triggerType, rows[0])
  }
  // #endregion

  // #region 转换为 create 使用的 flags
  toFlags(): DirectCreateFlags {
    const {row} = this
    if (!row) return {}

    switch (this.triggerType) {
      case 'daily': {
        const daily = row as DailyTrigger
        return {'start-time': daily.startTime, interval: daily.intervalDays, 'start-when-available': daily.startWhenAvailable}
      }

      case 'monthly': {
        const monthly = row as MonthlyTrigger
        const flags: DirectCreateFlags = {
          'start-time': monthly.startTime,
          months: (JSON.parse(monthly.months) as number[]).join(','),
          'start-when-available': monthly.startWhenAvailable,
        }
        if (monthly.triggerMode === 'days') {
          flags.monthdays = (JSON.parse(monthly.daysOfMonth ?? '[]') as number[]).join(',')
        } else {
          flags['weeks-of-month'] = (JSON.parse(monthly.weeksOfMonth ?? '[]') as number[]).join(',')
          flags.weekdays = (JSON.parse(monthly.daysOfWeek ?? '[]') as number[]).join(',')
        }

        return flags
      }

      case 'once': {
        const once = row as OnceTrigger
        return {'start-time': once.startTime, 'start-when-available': once.startWhenAvailable}
      }

      case 'weekly': {
        const weekly = row as WeeklyTrigger
        return {
          'start-time': weekly.startTime,
          interval: weekly.intervalWeeks,
          weekdays: (JSON.parse(weekly.daysOfWeek) as number[]).join(','),
          'start-when-available': weekly.startWhenAvailable,
        }
      }

      default: {
        return {}
      }
    }
  }
  // #endregion

  // #region 删除与恢复
  // 删除该任务当前的触发器行
  async remove(): Promise<void> {
    const db = getDb()

    switch (this.triggerType) {
      case 'daily': {
        await db.delete(dailyTriggers).where(eq(dailyTriggers.taskId, this.taskId))
        break
      }

      case 'monthly': {
        await db.delete(monthlyTriggers).where(eq(monthlyTriggers.taskId, this.taskId))
        break
      }

      case 'once': {
        await db.delete(onceTriggers).where(eq(onceTriggers.taskId, this.taskId))
        break
      }

      case 'weekly': {
        await db.delete(weeklyTriggers).where(eq(weeklyTriggers.taskId, this.taskId))
        break
      }
    }
  }

  // 把触发器恢复成快照时的样子（连同原来的行 id）
  async restore(): Promise<void> {
    await this.remove()
    if (!this.row) return

    const db = getDb()

    switch (this.triggerType) {
      case 'daily': {
        await db.insert(dailyTriggers).values(this.row as DailyTrigger)
        break
      }

      case 'monthly': {
        await db.insert(monthlyTriggers).values(this.row as MonthlyTrigger)
        break
      }

      case 'once': {
        await db.insert(onceTriggers).values(this.row as OnceTrigger)
        break
      }

      case 'weekly': {
        await db.insert(weeklyTriggers).values(this.row as WeeklyTrigger)
        break
      }
    }
  }
  // #endregion
}
