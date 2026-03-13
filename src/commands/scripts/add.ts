import {Args, Command} from '@oclif/core'
import {copyFileSync, existsSync, mkdirSync} from 'node:fs'
import {basename, join} from 'node:path'

export default class Add extends Command {
  static args = {
    path: Args.string({
      description: '脚本文件路径',
      required: true,
    }),
  }
  static description = '添加脚本到用户配置目录'
  static examples = [
    '<%= config.bin %> <%= command.id %> ./script.ps1',
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(Add)
    const scriptPath = args.path
    const scriptsDir = join(this.config.configDir, 'scripts')

    if (!existsSync(scriptsDir)) {
      mkdirSync(scriptsDir, {recursive: true})
    }

    const fileName = basename(scriptPath)
    const destPath = join(scriptsDir, fileName)

    copyFileSync(scriptPath, destPath)
    this.log(`脚本已添加: ${fileName}`)
    this.log(`保存位置: ${destPath}`)
  }
}
