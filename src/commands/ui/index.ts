import { Command, Flags } from '@oclif/core'

import { startServer } from '../../backend/index.js'

export default class Ui extends Command {
  static description = '启动 Web UI 服务'
  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --port 8080']
  static flags = {
    port: Flags.integer({
      char: 'p',
      default: 3000,
      description: '指定服务端口',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Ui)
    this.log(`正在启动 Web UI 服务...`)
    startServer(flags.port)
  }
}
