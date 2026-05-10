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
  waitForEvent,
  cleanupTasks,
} from './websocket.setup.js'

describe('WebSocket 删除操作测试', function () {
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

  describe('task:delete - 根据ID删除任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:delete', -1)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:delete', 999999)
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:deleteByName - 根据名称删除任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:deleteByName', '')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:deleteByName', '不存在的任务')
      expect(response).to.have.property('success', false)
    })
  })

  describe('task:deleteAll - 删除所有任务', () => {
    it('应该成功删除所有任务', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:deleteAll')
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response).to.have.property('data')
      }
    })

    it('应该在删除所有任务后广播 task:allDeleted 事件', async () => {
      // 同时等待广播事件和删除响应
      const [, deleteResponse] = await Promise.all([
        waitForEvent(clientSocket, 'task:allDeleted'),
        emitAsync<ApiResponse>(clientSocket, 'task:deleteAll'),
      ])

      expect(deleteResponse).to.have.property('success', true)
    })
  })
})
