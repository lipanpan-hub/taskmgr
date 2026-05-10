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
  waitForEvent,
  cleanupTasks,
} from './websocket.setup.js'

describe('WebSocket 创建操作测试', function () {
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

  describe('task:create - 创建任务', () => {
    it('应该在缺少必要字段时返回错误', async () => {
      const invalidTask = {
        name: '',
        executablePath: '',
      } as NewTask

      const response = await emitAsync<ApiResponse>(clientSocket, 'task:create', invalidTask)
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

      const response = await emitAsync<ApiResponse<{ id: number; name: string }>>(clientSocket, 'task:create', validTask)
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response.data).to.have.property('id')
        expect(response.data.name).to.equal(validTask.name)
        createdTaskIds.push(response.data.id)
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
        waitForEvent<{ id: number; name: string }>(clientSocket, 'task:created'),
        emitAsync<ApiResponse<{ id: number; name: string }>>(clientSocket, 'task:create', validTask),
      ])

      expect(broadcastData).to.have.property('id')
      expect(broadcastData.name).to.equal(validTask.name)
      if (createResponse.success) {
        createdTaskIds.push(createResponse.data.id)
      }
    })
  })
})
