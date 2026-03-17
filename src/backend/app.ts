import express, { type Request, type Response } from 'express'

import { createTasksRouter } from './routers/tasks.js'

export function createApp() {
  const app = express()

  app.use(express.json())

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/tasks', createTasksRouter())

  return app
}
