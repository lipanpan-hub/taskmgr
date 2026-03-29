import { exec } from 'node:child_process'

import { createApp } from './app.js'

const DEFAULT_PORT = 3000

export function startServer(port?: number) {
  const envPort = process.env.PORT ? Number(process.env.PORT) : undefined
  const PORT = port ?? envPort ?? DEFAULT_PORT
  const app = createApp()

  return app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
    exec(`start http://localhost:${PORT}`)
  })
}
