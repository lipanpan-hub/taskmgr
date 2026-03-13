import {Command} from '@oclif/core'
import {readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'

export default class List extends Command {
  static description = '列出用户配置目录下的所有脚本'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    const scriptsDir = join(this.config.configDir, 'scripts')
    const files = readdirSync(scriptsDir)

    this.log('脚本目录: ' + scriptsDir)
    this.log('')

    if (files.length === 0) {
      this.log('暂无脚本')
      return
    }

    for (const file of files) {
      const filePath = join(scriptsDir, file)
      const stats = statSync(filePath)
      const size = (stats.size / 1024).toFixed(2)
      this.log(`  ${file} (${size} KB)`)
    }
  }
}
