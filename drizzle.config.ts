import { defineConfig } from 'drizzle-kit'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { envConfig } from './src/lib/env.js'

// 手动计算 oclif 配置目录（与 oclif 的 configDir 保持一致）
// Windows: %LOCALAPPDATA%\@lppx\taskmgr
// macOS/Linux: ~/.config/@lppx/taskmgr
const configDir = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), '@lppx', 'taskmgr')
  : join(homedir(), '.config', '@lppx', 'taskmgr')

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './.drizzle/migrations',
  dbCredentials: {
    url: join(configDir, envConfig.dbName),
  },
})
