import { join } from 'node:path'
import { homedir } from 'node:os'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { Config } from '@oclif/core'
import { tasks } from '../model/schema.js'
import { envConfig as envConfig } from '../../lib/env.js'

// 直接从 oclif 获取配置目录
const configDir = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), '@lppx', 'taskmgr')
  : join(homedir(), '.config', '@lppx', 'taskmgr')

const dbPath = join(configDir, envConfig.dbName)
console.log(dbPath)

let dbInstance: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!dbInstance) {
    const sqlite = new Database(dbPath)
    dbInstance = drizzle(sqlite, { schema: { tasks } })
  }
  return dbInstance
}
