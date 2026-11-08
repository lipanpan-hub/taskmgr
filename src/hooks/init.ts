import {Hook} from '@oclif/core'
import {copyFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs'
import {platform} from 'node:os'
import {join} from 'node:path'

import {createAutoSyncTask} from '../lib/wtsk/autosync.js'

// 本 hook 每次启动都会执行, 属于启动热路径: 只放轻量逻辑, 不做同步子进程, 重依赖(数据库/edge-js)延迟到使用点加载
const hook: Hook.Init = async function (options) {
  // 首先检查当前系统是否是Windows系统，如果不是Windows系统，则直接给出警告并退出
  // Windows 自带 powershell.exe, 不再每次同步拉起它做可用性检查(约 350ms)
  if (platform() !== 'win32') {
    this.warn('当前系统不是 Windows 系统，此工具仅支持在 Windows 系统上运行')
    return
  }

  // console.log(options.config.configDir)
  const scriptsDir = join(options.config.configDir, 'scripts')
  const templatesDir = join(options.config.root, 'Templates')

  // 若脚本目录不存在，则创建目录
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, {recursive: true})
  }

  // 同步模板目录中的脚本，重名时强制覆盖
  for (const file of readdirSync(templatesDir)) {
    copyFileSync(join(templatesDir, file), join(scriptsDir, file))
  }

  // 数据库迁移已移到 src/db/index.ts 的 getDb() 首次调用时执行

  // 创建自动同步任务
  try {
    const result = await createAutoSyncTask()
    if (result.startsWith('Error:')) {
      this.warn(`创建自动同步任务失败: ${result}`)
    } else {
      this.log(`创建自动同步任务成功: ${result}`)
    }
  } catch (error) {
    this.warn(`创建自动同步任务失败: ${error instanceof Error ? error.message : String(error)}`)
  }

}

export default hook
