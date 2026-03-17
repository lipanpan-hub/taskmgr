import { type Request, type Response, Router } from 'express'

import {
  createScheduledTask,
  type CreateTaskOptions,
  deleteScheduledTask,
  getAllTasks,
  runScheduledTask,
} from '../../lib/task-scheduler.js'

export function createTasksRouter() {
  const router = Router()

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const result = await getAllTasks()
      if (typeof result === 'string') {
        res.status(500).json({ error: result })
        return
      }

      res.json(result)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.post('/', async (req: Request, res: Response) => {
    try {
      const options: CreateTaskOptions = req.body
      const result = await createScheduledTask(options)
      if (result.startsWith('Error:')) {
        res.status(400).json({ error: result })
        return
      }

      res.status(201).json({ message: result })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.delete('/:name', async (req: Request, res: Response) => {
    try {
      const name = req.params.name as string
      const result = await deleteScheduledTask(name)
      if (result.startsWith('Error:')) {
        res.status(400).json({ error: result })
        return
      }

      res.json({ message: result })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.post('/:name/run', async (req: Request, res: Response) => {
    try {
      const name = req.params.name as string
      const result = await runScheduledTask(name)
      if (result.startsWith('Error:')) {
        res.status(400).json({ error: result })
        return
      }

      res.json({ message: result })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  return router
}
