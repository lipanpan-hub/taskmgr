import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const packageJson = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as {
  oclif?: {
    dirname?: string
  }
}

export function getOclifConfigDir() {
  const oclifDirname = packageJson.oclif?.dirname ?? 'taskmgr'

  return process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), oclifDirname)
    : join(homedir(), '.config', oclifDirname)
}
