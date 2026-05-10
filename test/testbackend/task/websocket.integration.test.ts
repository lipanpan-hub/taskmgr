import { expect } from 'chai'
import sinon from 'sinon'
import type { Socket as ClientSocket } from 'socket.io-client'
import type { Server as HttpServer } from 'node:http'
import type { NewTask } from '../../../src/db/schema.js'
import {
  type ApiResponse,
  startTestServer,
  stopTestServer,
  connectClient,
  disconnectClient,
  emitAsync,
  cleanupTasks,
} from './websocket.setup.js'

describe('WebSocket 集成测试', function () {
  // 设置全局超时时间
  this.timeout(5000)

  let httpServer: HttpServer
  let clientSocket: ClientSocket
  let sandbox: sinon.SinonSandbox
  const createdTaskIds: number[] = []

  before(async () => {
    httpServer = await startTestServer()
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()
    clientSocket = await connectClient()
  })

  afterEach(async () => {
    await cleanupTasks(clientSocket, createdTaskIds)
    disconnectClient(clientSocket)
    sandbox.restore()
  })

  after(async () => {
    await stopTestServer(httpServer)
  })

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

      const createResponse = await emitAsync<ApiResponse<{ id: number; name: string }>>(clientSocket, 'task:create', newTask)
      expect(createResponse.success).to.be.true
      if (!createResponse.success) return

      const taskId = createResponse.data.id
      createdTaskIds.push(taskId)

      // 步骤2: 根据ID查询任务
      const getResponse = await emitAsync<ApiResponse<{ name: string }>>(clientSocket, 'task:getById', taskId)
      expect(getResponse.success).to.be.true
      if (getResponse.success) {
        expect(getResponse.data.name).to.equal(taskName)
      }

      // 步骤3: 删除任务
      const deleteResponse = await emitAsync<ApiResponse>(clientSocket, 'task:delete', taskId)
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

      const createResponse = await emitAsync<ApiResponse<{ id: number; name: string }>>(clientSocket, 'task:create', newTask)
      expect(createResponse.success).to.be.true
      if (!createResponse.success) return

      createdTaskIds.push(createResponse.data.id)

      // 根据名称查询
      const getResponse = await emitAsync<ApiResponse<{ name: string }>>(clientSocket, 'task:getByName', taskName)
      expect(getResponse.success).to.be.true
      if (getResponse.success) {
        expect(getResponse.data.name).to.equal(taskName)
      }

      // 清理：删除任务
      await emitAsync<ApiResponse>(clientSocket, 'task:delete', createResponse.data.id)
      const index = createdTaskIds.indexOf(createResponse.data.id)
      if (index > -1) {
        createdTaskIds.splice(index, 1)
      }
    })
  })
})
