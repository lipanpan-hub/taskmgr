import {Hook} from '@oclif/core'
import {execSync} from 'node:child_process'
import {copyFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs'
import {platform} from 'node:os'
import {join} from 'node:path'

const hook: Hook.Init = async function (options) {
  // 首先检查当前系统是否是Windows系统，如果不是Windows系统，则直接给出警告并退出
  if (platform() !== 'win32') {
    this.warn('当前系统不是 Windows 系统，此工具仅支持在 Windows 系统上运行')
    return
  }

  // 如果系统是Windows系统，需要进一步检查是否支持运行PowerShell脚本，如果不支持运行PowerShell脚本，则需要给出警告
  try {
    execSync('powershell -Command "Get-Host"', {stdio: 'ignore'})
  } catch {
    this.warn('当前系统不支持运行 PowerShell 脚本，请确保已安装 PowerShell')
    return
  }

  const scriptsDir = join(options.config.configDir, 'scripts')
  // 若脚本目录不存在，则创建目录并从模板目录复制初始脚本文件
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, {recursive: true})
    const templatesDir = join(options.config.root, 'Templates')
    for (const file of readdirSync(templatesDir)) {
      copyFileSync(join(templatesDir, file), join(scriptsDir, file))
    }
  }
}

export default hook
