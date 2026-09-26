import 'reflect-metadata' // 必须首行：装饰器元数据依赖需先于任何装饰器执行

import type { Server as HttpServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module.js'
import { TaskGateway } from './websocket/task.gateway.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'], // 抑制 Nest 启动噪声，只保留项目自己的日志
  })

  // 静态文件中间件，等价于原先的 express.static
  app.useStaticAssets(path.join(__dirname, '../../public'))

  // init() 内部才创建 io Server 并注入到 @WebSocketServer() 属性上
  await app.init()

  const httpServer = app.getHttpServer() as HttpServer
  const io = app.get(TaskGateway).server

  return { app, httpServer, io }
}