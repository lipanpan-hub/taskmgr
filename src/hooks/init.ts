import {Hook} from '@oclif/core'
import {copyFileSync, existsSync, mkdirSync, readdirSync} from 'node:fs'
import {join} from 'node:path'

const hook: Hook.Init = async function (options) {
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
