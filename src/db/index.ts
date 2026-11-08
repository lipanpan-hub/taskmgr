import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { tasks } from './schema.js'
import { envConfig } from '../lib/env.js'
import { getOclifConfigDir } from '../lib/utils/oclif-config-dir.js'

const configDir = getOclifConfigDir()
const dbPath = join(configDir, envConfig.dbName)
console.log(`数据库地址：${dbPath}`)
// 本模块位于 <根目录>/dist/db, 迁移文件在 <根目录>/.drizzle/migrations
const migrationsFolder = fileURLToPath(new URL('../../.drizzle/migrations', import.meta.url))

let dbInstance: ReturnType<typeof drizzle> | null = null

// 延迟初始化: 首次真正用到数据库时才加载 drizzle 并执行迁移, 不查库的命令(--version/--help 等)不付这笔启动成本
export function getDb() {
  if (!dbInstance) {
    mkdirSync(configDir, { recursive: true })
    const sqlite = new Database(dbPath)
    dbInstance = drizzle(sqlite, { schema: { tasks } })
    migrate(dbInstance, { migrationsFolder })
  }
  return dbInstance
}
