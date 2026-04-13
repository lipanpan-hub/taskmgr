import { exec } from 'node:child_process'

import { createApp } from './app.js'

const DEFAULT_PORT = 3000

export function startServer(port?: number) {
  const envPort = process.env.PORT ? Number(process.env.PORT) : undefined
  const PORT = port ?? envPort ?? DEFAULT_PORT
  const { httpServer } = createApp()

  return httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    console.log(`WebSocket server is running on ws://localhost:${PORT}`)
    exec(`start http://localhost:${PORT}`)
  })
}
