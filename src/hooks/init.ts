import {Hook} from '@oclif/core'
import Database from 'better-sqlite3'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import {execSync} from 'node:child_process'
import {copyFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs'
import {platform} from 'node:os'
import {join} from 'node:path'

import {envConfig} from '../lib/env.js'
import {createAutoSyncTask} from '../lib/wtsk/autosync.js'

const hook: Hook.Init = async function (options) {
  // 首先检查当前系统是否是Windows系统，如果不是Windows系统，则直接给出警告并退出
  if (platform() !== 'win32') {
    this.warn('当前系统不是 Windows 系统，此工具仅支持在 Windows 系统上运行')
    return
  }

  // 如果系统是Windows系统，需要进一步检查是否支持运行PowerShell脚本，如果不支持运行PowerShell脚本，则需要给出警告
  try {
    execSync('powershell -Command "Get-Host"', {stdio: 'ignore'})
  } catch {
    this.warn('当前系统不支持运行 PowerShell 脚本，请确保已安装 PowerShell')
    return
  }

  const scriptsDir = join(options.config.configDir, 'scripts')
  const templatesDir = join(options.config.root, 'Templates')

  // 若脚本目录不存在，则创建目录
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, {recursive: true})
  }

  // 同步模板目录中的脚本，重名时强制覆盖
  for (const file of readdirSync(templatesDir)) {
    copyFileSync(join(templatesDir, file), join(scriptsDir, file))
  }

  // 初始化数据库，执行迁移文件
  const dbPath = join(options.config.configDir, envConfig.dbName)
  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite)
  
  // 执行迁移
  const migrationsFolder = join(options.config.root, '.drizzle', 'migrations')
  migrate(db, {migrationsFolder})
  
  sqlite.close()

  // 创建自动同步任务
  try {
    const result = await createAutoSyncTask()
    if (result.startsWith('Error:')) {
      this.warn(`创建自动同步任务失败: ${result}`)
    } else {
      this.log(`创建自动同步任务成功: ${result}`)
    }
  } catch (error) {
    this.warn(`创建自动同步任务失败: ${error instanceof Error ? error.message : String(error)}`)
  }

}

export default hook
