import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import type { Server as HttpServer } from 'node:http'
import { createApp } from '../../../src/backend/app.js'

// 响应类型定义
export interface SuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ErrorResponse {
  success: false
  error: string
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

// 测试配置
export const TEST_PORT = 3001

// 共享的测试上下文
export interface TestContext {
  httpServer: HttpServer
  clientSocket: ClientSocket
  createdTaskIds: number[]
}

// 启动测试服务器
export async function startTestServer(): Promise<HttpServer> {
  const { httpServer } = createApp()
  await new Promise<void>((resolve) => {
    httpServer.listen(TEST_PORT, () => {
      console.log(`测试服务器启动在端口 ${TEST_PORT}`)
      resolve()
    })
  })
  return httpServer
}

// 停止测试服务器
export async function stopTestServer(httpServer: HttpServer): Promise<void> {
  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      console.log('测试服务器已关闭')
      resolve()
    })
  })
}

// 连接客户端
export async function connectClient(): Promise<ClientSocket> {
  return new Promise<ClientSocket>((resolve) => {
    const clientSocket = ioClient(`http://localhost:${TEST_PORT}`)
    clientSocket.on('connect', () => resolve(clientSocket))
  })
}

// 断开客户端
export function disconnectClient(clientSocket: ClientSocket): void {
  if (clientSocket.connected) {
    clientSocket.disconnect()
  }
}

// 辅助函数：将 socket.emit 转换为 Promise
export function emitAsync<T>(clientSocket: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve) => {
    clientSocket.emit(event, ...args, (response: T) => {
      resolve(response)
    })
  })
}

// 辅助函数：等待特定事件
export function waitForEvent<T>(clientSocket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    clientSocket.once(event, (data: T) => {
      resolve(data)
    })
  })
}

// 清理创建的任务
export async function cleanupTasks(clientSocket: ClientSocket, taskIds: number[]): Promise<void> {
  for (const taskId of taskIds) {
    await emitAsync<ApiResponse>(clientSocket, 'task:delete', taskId)
  }
  taskIds.length = 0
}
