import { defineConfig } from 'drizzle-kit'
import { join } from 'node:path'
import { Config } from '@oclif/core'
import { envConfig } from './src/lib/env.js'

// 获取配置目录路径（与 oclif 的 configDir 保持一致）
const oclifConfig = await Config.load()
const configDir = oclifConfig.configDir

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/backend/model/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: join(configDir, envConfig.dbName),
  },
})
