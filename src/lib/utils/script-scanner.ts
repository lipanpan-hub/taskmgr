import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getOclifConfigDir } from './oclif-config-dir.js'

export interface ScriptInfo {
  name: string
  path: string
  size: number
}

/**
 * 扫描用户配置目录下的 scripts 目录中的所有脚本文件
 * @returns 脚本信息列表
 */
export function scanScripts(): ScriptInfo[] {
  const scriptsDir = join(getOclifConfigDir(), 'scripts')

  if (!existsSync(scriptsDir)) {
    return []
  }

  try {
    const files = readdirSync(scriptsDir)
    const scripts: ScriptInfo[] = []

    for (const file of files) {
      const filePath = join(scriptsDir, file)
      const stats = statSync(filePath)

      // 只返回文件，跳过目录
      if (stats.isFile()) {
        scripts.push({
          name: file,
          path: filePath,
          size: stats.size,
        })
      }
    }

    return scripts
  } catch {
    return []
  }
}

/**
 * 获取脚本文件名列表（用于 prompts 自动补全）
 * @returns 脚本文件名数组
 */
export function getScriptNames(): string[] {
  const scripts = scanScripts()
  return scripts.map((s) => s.name)
}
