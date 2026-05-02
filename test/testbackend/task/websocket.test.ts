import { expect } from 'chai'
import sinon from 'sinon'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import type { Server as HttpServer } from 'node:http'
import { createApp } from '../../../src/backend/app.js'
import type { NewTask } from '../../../src/db/schema.js'

// 响应类型定义
interface SuccessResponse<T = unknown> {
  success: true
  data: T
}

interface ErrorResponse {
  success: false
  error: string
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

describe('WebSocket 任务接口测试', function () {
  // 设置全局超时时间
  this.timeout(5000)

  let httpServer: HttpServer
  let clientSocket: ClientSocket
  let sandbox: sinon.SinonSandbox
  const TEST_PORT = 3001
  const createdTaskIds: number[] = [] // 跟踪创建的任务ID，用于清理

  // 测试前启动服务器
  before(async () => {
    const { httpServer: server } = createApp()
    await new Promise<void>((resolve) => {
      httpServer = server.listen(TEST_PORT, () => {
        console.log(`测试服务器启动在端口 ${TEST_PORT}`)
        resolve()
      })
    })
  })

  // 每个测试前连接客户端并创建 sandbox
  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    await new Promise<void>((resolve) => {
      clientSocket = ioClient(`http://localhost:${TEST_PORT}`)
      clientSocket.on('connect', () => resolve())
    })
  })

  // 每个测试后断开客户端、清理创建的任务并恢复 sandbox
  afterEach(async () => {
    // 清理测试中创建的任务
    for (const taskId of createdTaskIds) {
      await emitAsync<ApiResponse>('task:delete', taskId)
    }
    createdTaskIds.length = 0

    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
    sandbox.restore()
  })

  // 测试后关闭服务器
  after(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log('测试服务器已关闭')
        resolve()
      })
    })
  })

  // 辅助函数：将 socket.emit 转换为 Promise
  function emitAsync<T>(event: string, ...args: unknown[]): Promise<T> {
    return new Promise((resolve) => {
      clientSocket.emit(event, ...args, (response: T) => {
        resolve(response)
      })
    })
  }

  // 辅助函数：等待特定事件
  function waitForEvent<T>(event: string): Promise<T> {
    return new Promise((resolve) => {
      clientSocket.once(event, (data: T) => {
        resolve(data)
      })
    })
  }

  // #region 查询操作测试
  describe('task:getAll - 获取所有任务', () => {
    it('应该成功返回任务列表', async () => {
      const response = await emitAsync<ApiResponse<unknown[]>>('task:getAll')
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response.data).to.be.an('array')
      }
    })
  })

  describe('task:getById - 根据ID获取任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:getById', -1)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:getById', 999999)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务不存在')
      }
    })
  })

  describe('task:getByName - 根据名称获取任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:getByName', '')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:getByName', '不存在的任务名称')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务不存在')
      }
    })
  })
  // #endregion

  // #region 创建操作测试
  describe('task:create - 创建任务', () => {
    it('应该在缺少必要字段时返回错误', async () => {
      const invalidTask = {
        name: '',
        executablePath: '',
      } as NewTask

      const response = await emitAsync<ApiResponse>('task:create', invalidTask)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该成功创建有效任务', async () => {
      const validTask: NewTask = {
        name: `测试任务_${Date.now()}`,
        executablePath: 'notepad.exe',
        arguments: '',
        description: '测试任务描述',
      }

      const response = await emitAsync<ApiResponse<{ id: number; name: string }>>('task:create', validTask)
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response.data).to.have.property('id')
        expect(response.data.name).to.equal(validTask.name)
        createdTaskIds.push(response.data.id) // 记录创建的任务ID
      }
    })

    it('应该在创建任务后广播 task:created 事件', async () => {
      const validTask: NewTask = {
        name: `测试任务_广播_${Date.now()}`,
        executablePath: 'notepad.exe',
        arguments: '',
        description: '测试广播',
      }

      // 同时等待广播事件和创建响应
      const [broadcastData, createResponse] = await Promise.all([
        waitForEvent<{ id: number; name: string }>('task:created'),
        emitAsync<ApiResponse<{ id: number; name: string }>>('task:create', validTask),
      ])

      expect(broadcastData).to.have.property('id')
      expect(broadcastData.name).to.equal(validTask.name)
      if (createResponse.success) {
        createdTaskIds.push(createResponse.data.id)
      }
    })
  })
  // #endregion

  // #region 更新操作测试
  describe('task:update - 根据ID更新任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:update', { id: -1, updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:update', { id: 999999, updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:updateByName - 根据名称更新任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:updateByName', { name: '', updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:updateByName', { name: '不存在的任务', updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
    })
  })
  // #endregion

  // #region 删除操作测试
  describe('task:delete - 根据ID删除任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:delete', -1)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:delete', 999999)
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:deleteByName - 根据名称删除任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:deleteByName', '')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>('task:deleteByName', '不存在的任务')
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:deleteAll - 删除所有任务', () => {
    it('应该成功删除所有任务', async () => {
      const response = await emitAsync<ApiResponse>('task:deleteAll')
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response).to.have.property('data')
      }
    })

    it('应该在删除所有任务后广播 task:allDeleted 事件', async () => {
      // 同时等待广播事件和删除响应
      const [, deleteResponse] = await Promise.all([
        waitForEvent('task:allDeleted'),
        emitAsync<ApiResponse>('task:deleteAll'),
      ])

      expect(deleteResponse).to.have.property('success', true)
    })
  })
  // #endregion

  // #region 集成测试
  describe('完整流程测试', () => {
    it('应该能够创建、查询、删除任务', async () => {
      const taskName = `集成测试任务_${Date.now()}`

      // 步骤1: 创建任务
      const newTask: NewTask = {
        name: taskName,
        executablePath: 'notepad.exe',
        arguments: '',
        description: '集成测试',
      }

      const createResponse = await emitAsync<ApiResponse<{ id: number; name: string }>>('task:create', newTask)
      expect(createResponse.success).to.be.true
      if (!createResponse.success) return

      const taskId = createResponse.data.id
      createdTaskIds.push(taskId)

      // 步骤2: 根据ID查询任务
      const getResponse = await emitAsync<ApiResponse<{ name: string }>>('task:getById', taskId)
      expect(getResponse.success).to.be.true
      if (getResponse.success) {
        expect(getResponse.data.name).to.equal(taskName)
      }

      // 步骤3: 删除任务
      const deleteResponse = await emitAsync<ApiResponse>('task:delete', taskId)
      expect(deleteResponse.success).to.be.true

      // 从跟踪列表中移除（已删除）
      const index = createdTaskIds.indexOf(taskId)
      if (index > -1) {
        createdTaskIds.splice(index, 1)
      }
    })

    it('应该能够根据名称查询任务', async () => {
      const taskName = `名称查询测试_${Date.now()}`

      // 创建任务
      const newTask: NewTask = {
        name: taskName,
        executablePath: 'notepad.exe',
        arguments: '',
        description: '名称查询测试',
      }

      const createResponse = await emitAsync<ApiResponse<{ id: number; name: string }>>('task:create', newTask)
      expect(createResponse.success).to.be.true
      if (!createResponse.success) return

      createdTaskIds.push(createResponse.data.id)

      // 根据名称查询
      const getResponse = await emitAsync<ApiResponse<{ name: string }>>('task:getByName', taskName)
      expect(getResponse.success).to.be.true
      if (getResponse.success) {
        expect(getResponse.data.name).to.equal(taskName)
      }

      // 清理：删除任务
      await emitAsync<ApiResponse>('task:delete', createResponse.data.id)
      const index = createdTaskIds.indexOf(createResponse.data.id)
      if (index > -1) {
        createdTaskIds.splice(index, 1)
      }
    })
  })
  // #endregion
})
