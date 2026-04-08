import express, { type Request, type Response } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createTasksRouter } from './routers/tasks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createApp() {
  const app = express()

  app.use(express.json())

  // 静态文件中间件
  app.use(express.static(path.join(__dirname, '../../public')))

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/tasks', createTasksRouter())

  return app
}
