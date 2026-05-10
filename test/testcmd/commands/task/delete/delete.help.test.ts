import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task delete - 帮助信息', () => {
  it('显示帮助信息', async () => {
    const {stdout} = await runCommand(['task', 'delete', '--help'])
    expect(stdout).to.contain('删除数据库中的定时任务及其关联配置')
    expect(stdout).to.contain('--interactive')
    expect(stdout).to.contain('--id')
    expect(stdout).to.contain('--force')
  })
})
