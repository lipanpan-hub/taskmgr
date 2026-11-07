import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 定时任务表
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  executablePath: text('executable_path').notNull(),
  arguments: text('arguments'),
  triggerType: text('trigger_type', { 
    enum: ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon'] 
  }).notNull().default('daily'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  // #region 高级选项（任务级，对所有触发类型生效；每个任务只有一个触发器，因此放在 tasks 表而不是各触发器表）
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false), // 隐藏任务
  wakeToRun: integer('wake_to_run', { mode: 'boolean' }).notNull().default(true), // 唤醒电脑运行
  disallowStartIfOnBatteries: integer('disallow_start_if_on_batteries', { mode: 'boolean' }).notNull().default(false), // 使用电池时不启动
  stopIfGoingOnBatteries: integer('stop_if_going_on_batteries', { mode: 'boolean' }).notNull().default(false), // 切换到电池时停止
  runHighest: integer('run_highest', { mode: 'boolean' }).notNull().default(false), // 以最高权限运行
  multipleInstances: text('multiple_instances', {
    enum: ['parallel', 'queue', 'ignore-new', 'stop-existing'],
  }).notNull().default('ignore-new'), // 任务已在运行时的处理策略
  executionTimeLimitMinutes: integer('execution_time_limit_minutes'), // 执行时限(分钟)，0=不限制，null=使用系统默认(72小时)
  endTime: text('end_time'), // 触发器过期时间，格式: YYYY-MM-DD HH:mm
  repeatIntervalMinutes: integer('repeat_interval_minutes'), // 重复间隔(分钟)
  repeatDurationMinutes: integer('repeat_duration_minutes'), // 重复持续时间(分钟)，null=无限期
  delayMinutes: integer('delay_minutes'), // 延迟(分钟)：boot/logon 为触发后延迟，其余为开始时间后随机延迟上限
  // #endregion
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
})

// Task: 从数据库查询返回的完整记录类型（包含所有字段及默认值）
export type Task = typeof tasks.$inferSelect
// NewTask: 插入数据库时需要的类型（自动生成字段如 id、createdAt 等可选）
export type NewTask = typeof tasks.$inferInsert

// 天触发任务配置表
export const dailyTriggers = sqliteTable('daily_triggers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  intervalDays: integer('interval_days').notNull().default(1), // 每隔几天触发一次
  startTime: text('start_time').notNull(), // 格式: HH:mm
  startWhenAvailable: integer('start_when_available', { mode: 'boolean' }).notNull().default(false),
})

export type DailyTrigger = typeof dailyTriggers.$inferSelect
export type NewDailyTrigger = typeof dailyTriggers.$inferInsert

// 周触发任务配置表
export const weeklyTriggers = sqliteTable('weekly_triggers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  intervalWeeks: integer('interval_weeks').notNull().default(1), // 每隔几周触发一次
  daysOfWeek: text('days_of_week').notNull(), // JSON数组: [0-6], 0=周日, 6=周六
  startTime: text('start_time').notNull(), // 格式: HH:mm
  startWhenAvailable: integer('start_when_available', { mode: 'boolean' }).notNull().default(false),
})

export type WeeklyTrigger = typeof weeklyTriggers.$inferSelect
export type NewWeeklyTrigger = typeof weeklyTriggers.$inferInsert

// 月触发任务配置表
export const monthlyTriggers = sqliteTable('monthly_triggers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  months: text('months').notNull(), // JSON数组: [1-12], 一年中的哪几个月
  triggerMode: text('trigger_mode', { enum: ['days', 'weeks'] }).notNull(), // 按天触发还是按周触发
  daysOfMonth: text('days_of_month'), // JSON数组: [1-31], 每月的哪几天 (triggerMode='days'时使用)
  weeksOfMonth: text('weeks_of_month'), // JSON数组: [1-5], 每月的第几周 (triggerMode='weeks'时使用)
  daysOfWeek: text('days_of_week'), // JSON数组: [0-6], 周几 (triggerMode='weeks'时使用)
  startTime: text('start_time').notNull(), // 格式: HH:mm
  startWhenAvailable: integer('start_when_available', { mode: 'boolean' }).notNull().default(false),
})

export type MonthlyTrigger = typeof monthlyTriggers.$inferSelect
export type NewMonthlyTrigger = typeof monthlyTriggers.$inferInsert

// 一次性触发任务配置表
export const onceTriggers = sqliteTable('once_triggers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  startTime: text('start_time').notNull(), // 格式: YYYY-MM-DD HH:mm
  startWhenAvailable: integer('start_when_available', { mode: 'boolean' }).notNull().default(false),
})

export type OnceTrigger = typeof onceTriggers.$inferSelect
export type NewOnceTrigger = typeof onceTriggers.$inferInsert
