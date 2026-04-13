import type { Server, Socket } from 'socket.io'

import type { NewTask } from '../../db/schema.js'
import { TaskService } from '../../lib/task/task-service.js'
import { validateNewTask, validateTaskId } from '../../lib/task/validators.js'

export function registerTaskHandlers(io: Server, socket: Socket) {
  const taskService = new TaskService()

  // #region 查询操作
  socket.on('task:getAll', async (callback) => {
    try {
      const tasks = await taskService.getAllTasks()
      callback({ success: true, data: tasks })
    } catch (error) {
      callback({ success: false, error: '查询任务失败', message: (error as Error).message })
    }
  })

  socket.on('task:getById', async (id: number, callback) => {
    try {
      const idResult = validateTaskId(String(id))
      if (typeof idResult !== 'number') {
        callback({ success: false, ...idResult })
        return
      }

      const task = await taskService.getTaskById(idResult)
      if (!task) {
        callback({ success: false, error: '任务不存在' })
        return
      }

      callback({ success: true, data: task })
    } catch (error) {
      callback({ success: false, error: '查询任务失败', message: (error as Error).message })
    }
  })

  socket.on('task:getByName', async (name: string, callback) => {
    try {
      if (!name || name.trim() === '') {
        callback({ success: false, error: '任务名称不能为空' })
        return
      }

      const task = await taskService.getTaskByName(name)
      if (!task) {
        callback({ success: false, error: '任务不存在' })
        return
      }

      callback({ success: true, data: task })
    } catch (error) {
      callback({ success: false, error: '查询任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 创建操作
  socket.on('task:create', async (newTask: NewTask, callback) => {
    try {
      const validationError = validateNewTask(newTask)
      if (validationError) {
        callback({ success: false, ...validationError })
        return
      }

      const result = await taskService.createTask(newTask)
      io.emit('task:created', result)
      callback({ success: true, data: result })
    } catch (error) {
      callback({ success: false, error: '创建任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 更新操作
  socket.on('task:update', async (data: { id: number; updates: Partial<NewTask> }, callback) => {
    try {
      const idResult = validateTaskId(String(data.id))
      if (typeof idResult !== 'number') {
        callback({ success: false, ...idResult })
        return
      }

      const result = await taskService.updateTask(idResult, data.updates)
      if (!result) {
        callback({ success: false, error: '任务不存在' })
        return
      }

      io.emit('task:updated', result)
      callback({ success: true, data: result })
    } catch (error) {
      callback({ success: false, error: '更新任务失败', message: (error as Error).message })
    }
  })
  // #endregion

  // #region 删除操作
  socket.on('task:delete', async (id: number, callback) => {
    try {
      const idResult = validateTaskId(String(id))
      if (typeof idResult !== 'number') {
        callback({ success: false, ...idResult })
        return
      }

      const result = await taskService.deleteTask(idResult)
      if (!result) {
        callback({ success: false, error: '任务不存在' })
        return
      }

      io.emit('task:deleted', { id: idResult })
      callback({ success: true, data: result })
    } catch (error) {
      callback({ success: false, error: '删除任务失败', message: (error as Error).message })
    }
  })

  socket.on('task:deleteByName', async (name: string, callback) => {
    try {
      if (!name || name.trim() === '') {
        callback({ success: false, error: '任务名称不能为空' })
        return
      }

      const result = await taskService.deleteTaskByName(name)
      if (!result) {
        callback({ success: false, error: '任务不存在' })
        return
      }

      io.emit('task:deleted', { name })
      callback({ success: true, data: result })
    } catch (error) {
      callback({ success: false, error: '删除任务失败', message: (error as Error).message })
    }
  })

  socket.on('task:deleteAll', async (callback) => {
    try {
      const result = await taskService.deleteAllTasks()
      io.emit('task:allDeleted')
      callback({ success: true, data: result })
    } catch (error) {
      callback({ success: false, error: '删除所有任务失败', message: (error as Error).message })
    }
  })
  // #endregion
}
