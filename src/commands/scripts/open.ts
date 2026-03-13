import {Command} from '@oclif/core'
import {spawn} from 'node:child_process'
import {existsSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'

export default class Open extends Command {
  static description = '打开脚本文件目录'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    const scriptsDir = join(this.config.configDir, 'scripts')

    if (!existsSync(scriptsDir)) {
      mkdirSync(scriptsDir, {recursive: true})
      this.log(`已创建脚本目录: ${scriptsDir}`)
    }

    spawn('explorer', [scriptsDir], {detached: true, stdio: 'ignore'}).unref()
    this.log(`正在打开: ${scriptsDir}`)
  }
}
