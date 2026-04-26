import {existsSync} from 'node:fs'
import {extname, isAbsolute, resolve} from 'node:path'
import {detectAvailableRuntimes} from '../utils/runtime-detector.js'

export interface OptimizedTaskInput {
  executablePath: string
  arguments?: string
}



export async function optimizeTaskInput(
  executablePath: string,
  args?: string,
): Promise<OptimizedTaskInput> {
  const trimmedPath = executablePath.trim()
  const trimmedArgs = args?.trim() || undefined // 空字符串转为 undefined

  // 如果是绝对路径且文件存在，说明为用户自定义可执行文件  直接返回原参数
  if (isAbsolute(trimmedPath) && existsSync(trimmedPath)) {
    return {
      executablePath: trimmedPath,
      arguments: trimmedArgs,
    }
  }

  // 检查是否选择运行时 如果选择运行时 才会进行优化 
  const runtimes = await detectAvailableRuntimes()
  const availableRuntimeNames = runtimes.filter((r) => !r.disabled).map((r) => r.value || r.title)

  if (availableRuntimeNames.includes(trimmedPath.toLowerCase()) && trimmedArgs) {
    // 检查参数是否为单个脚本路径（不包含额外参数）
    const argParts = trimmedArgs.split(/\s+/)
    if (argParts.length === 1) {
      console.log("参数优化开始")
      const optimized = optimizeRuntimeArgs(trimmedPath, trimmedArgs)
      if (optimized) { return optimized }
    }
  }

  // 默认返回原始输入
  return {
    executablePath: trimmedPath,
    arguments: trimmedArgs,
  }
}


// #region 运行时参数优化
// 注意：调用此函数前必须确保 args 为单个脚本路径
function optimizeRuntimeArgs(
  runtime: string,
  args: string,
): OptimizedTaskInput | null {
  const scriptPath = args
  const ext = extname(scriptPath).toLowerCase()
  const lowerRuntime = runtime.toLowerCase()

  // PowerShell 脚本优化：后台静默执行
  if ((lowerRuntime === 'pwsh' || lowerRuntime === 'powershell') && ext === '.ps1') {
    const absoluteScriptPath = isAbsolute(scriptPath) ? scriptPath : resolve(scriptPath)
    return {
      executablePath: 'cmd.exe',
      arguments: `/c start /min "" powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "${absoluteScriptPath}"`,
    }
  }

  // Python uv 脚本优化：隔离环境执行
  if (lowerRuntime === 'uv' && ext === '.py') {
    const absoluteScriptPath = isAbsolute(scriptPath) ? scriptPath : resolve(scriptPath)
    return {
      executablePath: 'uv',
      arguments: `run --isolated --no-project "${absoluteScriptPath}"`,
    }
  }

  return null
}
// #endregion