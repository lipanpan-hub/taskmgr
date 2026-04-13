import express, { type Request, type Response } from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'

import { setupWebSocketHandlers } from './websocket/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createApp() {
  const app = express()
  const httpServer = createServer(app)
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  app.use(express.json())

  // 静态文件中间件
  app.use(express.static(path.join(__dirname, '../../public')))

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' })
  })

  setupWebSocketHandlers(io)

  return { app, httpServer, io }
}
