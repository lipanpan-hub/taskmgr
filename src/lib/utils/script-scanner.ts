import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getOclifConfigDir } from './oclif-config-dir.js'

// prompts 库的 Choice 对象格式
export interface ScriptInfo {
  title: string // 显示的脚本名称
  value: string // 脚本的完整路径
  description?: string // 脚本大小等描述信息
  disabled?: boolean
  selected?: boolean
}

// 扫描用户配置目录下的 scripts 目录中的所有脚本文件 
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
          title: file,
          value: filePath,
          description: `${(stats.size / 1024).toFixed(2)} KB`,
        })
      }
    }

    return scripts
  } catch {
    return []
  }
}

// 获取脚本 Choice 列表（用于 prompts 自动补全）
export function getScriptNames(): ScriptInfo[] {
  return scanScripts()
}
