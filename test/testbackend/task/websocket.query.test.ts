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

describe('WebSocket 查询操作测试', function () {
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

  describe('task:getAll - 获取所有任务', () => {
    it('应该成功返回任务列表', async () => {
      const response = await emitAsync<ApiResponse<unknown[]>>(clientSocket, 'task:getAll')
      expect(response).to.have.property('success', true)
      if (response.success) {
        expect(response.data).to.be.an('array')
      }
    })
  })

  describe('task:getById - 根据ID获取任务', () => {
    it('应该在ID无效时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:getById', -1)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response).to.have.property('error')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:getById', 999999)
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务不存在')
      }
    })
  })

  describe('task:getByName - 根据名称获取任务', () => {
    it('应该在名称为空时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:getByName', '')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务名称不能为空')
      }
    })

    it('应该在任务不存在时返回错误', async () => {
      const response = await emitAsync<ApiResponse>(clientSocket, 'task:getByName', '不存在的任务名称')
      expect(response).to.have.property('success', false)
      if (!response.success) {
        expect(response.error).to.equal('任务不存在')
      }
    })
  })
})
