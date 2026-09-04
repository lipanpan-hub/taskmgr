import { exec } from 'node:child_process'

import { createApp } from './app.js'

const DEFAULT_PORT = 3000
const HOST = '127.0.0.1'

export function startServer(port?: number) {
  const envPort = process.env.PORT ? Number(process.env.PORT) : undefined
  const PORT = port ?? envPort ?? DEFAULT_PORT
  const { httpServer } = createApp()

  return httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`)
    console.log(`WebSocket server is running on ws://${HOST}:${PORT}`)
    exec(`start http://${HOST}:${PORT}`)
  })
}
