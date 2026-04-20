import { defineConfig } from 'drizzle-kit'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { envConfig } from './src/lib/env.js'
import oclifConfig from './.oclifrc.mjs'

// 从 .oclifrc.mjs 获取 dirname 配置
const configDir = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), oclifConfig.dirname)
  : join(homedir(), '.config', oclifConfig.dirname)

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './.drizzle/migrations',
  dbCredentials: {
    url: join(configDir, envConfig.dbName),
  },
})
