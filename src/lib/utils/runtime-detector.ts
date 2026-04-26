import {execSync} from 'node:child_process'

// prompts 库的 Choice 对象格式
export interface RuntimeInfo {
  title: string
  value?: string
  description?: string
  disabled?: boolean
  selected?: boolean
}

// 检测系统中可用的运行时环境  返回一个 RuntimeInfo列表 
export async function detectAvailableRuntimes(): Promise<RuntimeInfo[]> {
  const runtimes = ['powershell', 'pwsh', 'uv', 'python', 'bun', 'node', 'deno', 'go']
  const results: RuntimeInfo[] = []

  for (const runtime of runtimes) {
    const info = await checkRuntime(runtime)
    results.push(info)
  }

  return results
}

// 获取可用的运行时选项列表（用于 prompts 自动补全）
export async function getAvailableRuntimeNames(): Promise<RuntimeInfo[]> {
  const runtimes = await detectAvailableRuntimes()
  return runtimes
}

// 检查单个运行时环境是否可用，返回 Choice 对象
async function checkRuntime(runtime: string): Promise<RuntimeInfo> {
  try {
    let versionCommand: string

    switch (runtime) {
      case 'powershell': {
        versionCommand = 'powershell -Command "$PSVersionTable.PSVersion.ToString()"'
        break
      }
      case 'pwsh': {
        versionCommand = 'pwsh -Command "$PSVersionTable.PSVersion.ToString()"'
        break
      }
      case 'uv': {
        versionCommand = 'uv --version'
        break
      }
      case 'python': {
        versionCommand = 'python --version'
        break
      }
      case 'bun': {
        versionCommand = 'bun --version'
        break
      }
      case 'node': {
        versionCommand = 'node --version'
        break
      }
      case 'deno': {
        versionCommand = 'deno --version'
        break
      }
      case 'go': {
        versionCommand = 'go version'
        break
      }
      default: {
        return {title: runtime, value: runtime, disabled: true}
      }
    }

    const output = execSync(versionCommand, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 3000,
    }).trim()

    const version = output.split('\n')[0]
    return {
      title: runtime,
      value: runtime,
      description: version,
    }
  } catch {
    return {
      title: runtime,
      value: runtime,
      disabled: true,
      description: '不可用',
    }
  }
}
