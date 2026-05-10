import { expect } from 'chai'
import sinon from 'sinon'
import type { Socket as ClientSocket } from 'socket.io-client'
import type { Server as HttpServer } from 'node:http'
import {
  type ApiResponse,
  startTestServer,
  stopTestServer,
  connectClient,
  disconnectClient,
  emitAsync,
  cleanupTasks,
} from './websocket.setup.js'

describe('WebSocket 更新操作测试', function () {
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

  describe('task:update - 根据ID更新任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:update', { id: -1, updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:update', { id: 999999, updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:updateByName - 根据名称更新任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:updateByName', { name: '', updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:updateByName', { name: '不存在的任务', updates: { description: '新描述' } })
      expect(response).to.have.property('success', false)
    })
  })
})
