import { join } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { tasks } from './schema.js'
import { envConfig as envConfig } from '../lib/env.js'
import { getOclifConfigDir } from '../lib/utils/oclif-config-dir.js'

const configDir = getOclifConfigDir()
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
