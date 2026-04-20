/// <reference types="node" />

import { defineConfig } from 'drizzle-kit'
import { join } from 'node:path'

import { envConfig } from './src/lib/env.js'
import { getOclifConfigDir } from './src/lib/utils/oclif-config-dir.js'

const configDir = getOclifConfigDir()

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './.drizzle/migrations',
  dbCredentials: {
    url: join(configDir, envConfig.dbName),
  },
})
