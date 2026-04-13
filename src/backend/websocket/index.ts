import type { Server, Socket } from 'socket.io'

import { registerTaskHandlers } from './task-handler.js'

export function setupWebSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('客户端已连接:', socket.id)

    registerTaskHandlers(io, socket)

    socket.on('disconnect', () => {
      console.log('客户端已断开:', socket.id)
    })
  })
}
