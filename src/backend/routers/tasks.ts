import { type Request, type Response, Router } from 'express'
import { eq } from 'drizzle-orm'
import { getDb } from '../lib/db.js'
import { tasks, type NewTask } from '../model/schema.js'

export function createTasksRouter() {
  const router = Router()
  const db = getDb()

  // #region 查询所有任务
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const allTasks = await db.select().from(tasks)
      res.json(allTasks)
    } catch (error) {
      res.status(500).json({ error: '查询任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 根据ID查询单个任务
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id)
      if (Number.isNaN(id)) {
        res.status(400).json({ error: '无效的任务ID' })
        return
      }

      const task = await db.select().from(tasks).where(eq(tasks.id, id))
      if (task.length === 0) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json(task[0])
    } catch (error) {
      res.status(500).json({ error: '查询任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 创建新任务
  router.post('/', async (req: Request, res: Response) => {
    try {
      const newTask: NewTask = req.body
      const result = await db.insert(tasks).values(newTask).returning()
      res.status(201).json(result[0])
    } catch (error) {
      res.status(500).json({ error: '创建任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 更新任务
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id)
      if (Number.isNaN(id)) {
        res.status(400).json({ error: '无效的任务ID' })
        return
      }

      const updateData = { ...req.body, updatedAt: new Date().toISOString() }
      const result = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning()
      
      if (result.length === 0) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json(result[0])
    } catch (error) {
      res.status(500).json({ error: '更新任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 删除任务
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id)
      if (Number.isNaN(id)) {
        res.status(400).json({ error: '无效的任务ID' })
        return
      }

      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning()
      
      if (result.length === 0) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json({ message: '任务删除成功', task: result[0] })
    } catch (error) {
      res.status(500).json({ error: '删除任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  return router
}
