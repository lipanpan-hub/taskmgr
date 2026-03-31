import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import type Database from 'better-sqlite3'

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
  startTime: text('start_time').notNull().default('09:00'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
})

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert


// 初始化数据库表结构
export function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      executable_path TEXT NOT NULL,
      arguments TEXT,
      trigger_type TEXT NOT NULL DEFAULT 'daily',
      start_time TEXT NOT NULL DEFAULT '09:00',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
}
