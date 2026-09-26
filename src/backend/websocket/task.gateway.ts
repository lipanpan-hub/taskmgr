import { Inject } from '@nestjs/common'
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'

import type { NewTask } from '../../db/schema.js'
import { TaskDeleteHandler } from '../../lib/task/task-delete-handler.js'
import { TaskService } from '../../lib/task/task-service.js'
import { updateTask, updateTaskByName } from '../../lib/task/task-update-handler.js'
import { validateNewTask, validateTaskId } from '../../lib/task/validators.js'

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Nest 在 app.init() 期间注入 io Server，供 app.ts 取用
  @WebSocketServer()
  public server!: Server

  // 构造参数全部显式 @Inject：tsx/esbuild 不产出 design:paramtypes 元数据
  constructor(
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(TaskDeleteHandler) private readonly deleteHandler: TaskDeleteHandler,
  ) {}

  // #region 连接生命周期
  handleConnection(socket: Socket): void {
    console.log('客户端已连接:', socket.id)
  }

  handleDisconnect(socket: Socket): void {
    console.log('客户端已断开:', socket.id)
  }
  // #endregion

  // #region 查询操作
  @SubscribeMessage('task:getAll')
  async handleGetAll() {
    // 无 @MessageBody：该事件的载荷只有 ack 回调
    try {
      const tasks = await this.taskService.getAllTasksWithTriggers()
      return { success: true, data: tasks }
    } catch (error) {
      return { success: false, error: '查询任务失败', message: (error as Error).message }
    }
  }

  @SubscribeMessage('task:getById')
  async handleGetById(@MessageBody() id: number) {
    try {
      const idResult = validateTaskId(String(id))
      if (typeof idResult !== 'number') {
        return { success: false, ...idResult }
      }

      const task = await this.taskService.getTaskById(idResult)
      if (!task) {
        return { success: false, error: '任务不存在' }
      }

      return { success: true, data: task }
    } catch (error) {
      return { success: false, error: '查询任务失败', message: (error as Error).message }
    }
  }

  @SubscribeMessage('task:getByName')
  async handleGetByName(@MessageBody() name: string) {
    try {
      if ((!name) || (name.trim() === '')) {
        return { success: false, error: '任务名称不能为空' }
      }

      const task = await this.taskService.getTaskByName(name)
      if (!task) {
        return { success: false, error: '任务不存在' }
      }

      return { success: true, data: task }
    } catch (error) {
      return { success: false, error: '查询任务失败', message: (error as Error).message }
    }
  }
  // #endregion

  // #region 创建操作
  @SubscribeMessage('task:create')
  async handleCreate(@MessageBody() newTask: NewTask) {
    try {
      const validationError = validateNewTask(newTask)
      if (validationError) {
        return { success: false, ...validationError }
      }

      const result = await this.taskService.createTask(newTask)
      this.server.emit('task:created', result)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: '创建任务失败', message: (error as Error).message }
    }
  }
  // #endregion

  // #region 更新操作
  @SubscribeMessage('task:update')
  async handleUpdate(@MessageBody() data: { id: number; updates: Partial<NewTask> }) {
    try {
      const idResult = validateTaskId(String(data.id))
      if (typeof idResult !== 'number') {
        return { success: false, ...idResult }
      }

      const result = await updateTask(idResult, data.updates)
      if (!result.success) {
        return { success: false, error: result.message }
      }

      this.server.emit('task:updated', { id: result.taskId, name: result.taskName })
      return { success: true, message: result.message, taskId: result.taskId, taskName: result.taskName }
    } catch (error) {
      return { success: false, error: '更新任务失败', message: (error as Error).message }
    }
  }

  @SubscribeMessage('task:updateByName')
  async handleUpdateByName(@MessageBody() data: { name: string; updates: Partial<NewTask> }) {
    try {
      if ((!data.name) || (data.name.trim() === '')) {
        return { success: false, error: '任务名称不能为空' }
      }

      const result = await updateTaskByName(data.name, data.updates)
      if (!result.success) {
        return { success: false, error: result.message }
      }

      this.server.emit('task:updated', { id: result.taskId, name: result.taskName })
      return { success: true, message: result.message, taskId: result.taskId, taskName: result.taskName }
    } catch (error) {
      return { success: false, error: '更新任务失败', message: (error as Error).message }
    }
  }
  // #endregion

  // #region 删除操作
  @SubscribeMessage('task:delete')
  async handleDelete(@MessageBody() id: number) {
    try {
      const idResult = validateTaskId(String(id))
      if (typeof idResult !== 'number') {
        return { success: false, ...idResult }
      }

      const result = await this.deleteHandler.deleteById(idResult, true)
      if (!result.success) {
        return { success: false, error: result.message }
      }

      this.server.emit('task:deleted', { id: idResult })
      return { success: true, message: result.message, taskId: result.taskId, taskName: result.taskName }
    } catch (error) {
      return { success: false, error: '删除任务失败', message: (error as Error).message }
    }
  }

  @SubscribeMessage('task:deleteByName')
  async handleDeleteByName(@MessageBody() name: string) {
    try {
      if ((!name) || (name.trim() === '')) {
        return { success: false, error: '任务名称不能为空' }
      }

      const result = await this.deleteHandler.deleteByName(name, true)
      if (!result.success) {
        return { success: false, error: result.message }
      }

      this.server.emit('task:deleted', { name })
      return { success: true, message: result.message, taskId: result.taskId, taskName: result.taskName }
    } catch (error) {
      return { success: false, error: '删除任务失败', message: (error as Error).message }
    }
  }

  @SubscribeMessage('task:deleteAll')
  async handleDeleteAll() {
    // 无 @MessageBody：该事件的载荷只有 ack 回调
    try {
      const result = await this.taskService.deleteAllTasks()
      this.server.emit('task:allDeleted')
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: '删除所有任务失败', message: (error as Error).message }
    }
  }
  // #endregion
}