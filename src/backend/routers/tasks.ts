import { type Request, type Response, Router } from 'express'
import type { NewTask } from '../model/schema.js'
import { TaskService } from '../../lib/task/task-service.js'
import { validateNewTask, validateTaskId } from '../../lib/task/validators.js'

export function createTasksRouter() {
  const router = Router()
  const taskService = new TaskService()

  // #region 查询操作
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const allTasks = await taskService.getAllTasks()
      res.json(allTasks)
    } catch (error) {
      res.status(500).json({ error: '查询任务失败', message: (error as Error).message })
    }
  })

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const idResult = validateTaskId(req.params.id)
      if (typeof idResult !== 'number') {
        res.status(400).json(idResult)
        return
      }

      const task = await taskService.getTaskById(idResult)
      if (!task) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json(task)
    } catch (error) {
      res.status(500).json({ error: '查询任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 创建操作
  router.post('/', async (req: Request, res: Response) => {
    try {
      const newTask: NewTask = req.body
      const validationError = validateNewTask(newTask)
      if (validationError) {
        res.status(400).json(validationError)
        return
      }

      const result = await taskService.createTask(newTask)
      res.status(201).json(result)
    } catch (error) {
      res.status(500).json({ error: '创建任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 更新操作
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const idResult = validateTaskId(req.params.id)
      if (typeof idResult !== 'number') {
        res.status(400).json(idResult)
        return
      }

      const result = await taskService.updateTask(idResult, req.body)
      if (!result) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json(result)
    } catch (error) {
      res.status(500).json({ error: '更新任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 删除操作
  router.delete('/', async (_req: Request, res: Response) => {
    try {
      const result = await taskService.deleteAllTasks()
      res.json({ message: '所有任务删除成功', count: result.length, tasks: result })
    } catch (error) {
      res.status(500).json({ error: '删除所有任务失败', message: (error as Error).message })
    }
  })

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const idResult = validateTaskId(req.params.id)
      if (typeof idResult !== 'number') {
        res.status(400).json(idResult)
        return
      }

      const result = await taskService.deleteTask(idResult)
      if (!result) {
        res.status(404).json({ error: '任务不存在' })
        return
      }

      res.json({ message: '任务删除成功', task: result })
    } catch (error) {
      res.status(500).json({ error: '删除任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  return router
}
