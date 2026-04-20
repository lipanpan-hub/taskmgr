import { join } from 'node:path'
import { homedir } from 'node:os'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { tasks } from './schema.js'
import { envConfig as envConfig } from '../lib/env.js'
// @ts-expect-error - .mjs 文件的类型声明
import oclifConfig from '../../.oclifrc.mjs'

// 从 .oclifrc.mjs 获取 dirname 配置
const configDir = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), oclifConfig.dirname as string)
  : join(homedir(), '.config', oclifConfig.dirname as string)

const dbPath = join(configDir, envConfig.dbName)
console.log(`数据库地址：${dbPath}`)

let dbInstance: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!dbInstance) {
    const sqlite = new Database(dbPath)
    dbInstance = drizzle(sqlite, { schema: { tasks } })
  }
  return dbInstance
}
