import {runCommand as oclifRunCommand} from '@oclif/test'
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'
import type {Interfaces} from '@oclif/core'

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '../..')

/**
 * 运行 CLI 命令的辅助函数，自动设置项目根目录
 * @param args 命令参数
 * @param loadOpts 可选的加载选项
 * @param captureOpts 可选的捕获选项
 * @returns 命令执行结果
 */
export async function runCommand<T>(
  args: string | string[],
  loadOpts?: Interfaces.LoadOptions,
  captureOpts?: {print?: boolean; stripAnsi?: boolean; testNodeEnv?: string},
) {
  // 如果没有提供 loadOpts，使用项目根目录
  const finalLoadOpts = loadOpts ?? {root: projectRoot}
  return oclifRunCommand<T>(args, finalLoadOpts, captureOpts)
}
