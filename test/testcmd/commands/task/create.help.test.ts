import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create - 帮助信息', () => {
  it('显示帮助信息', async () => {
    const {stdout} = await runCommand(['task', 'create', '--help'])
    expect(stdout).to.contain('创建定时任务到数据库')
    expect(stdout).to.contain('--interactive')
    expect(stdout).to.contain('--path')
    expect(stdout).to.contain('--trigger')
    expect(stdout).to.contain('--interval')
    expect(stdout).to.contain('--weekdays')
    expect(stdout).to.contain('--months')
    expect(stdout).to.contain('--monthdays')
    expect(stdout).to.contain('--weeks-of-month')
  })
})
