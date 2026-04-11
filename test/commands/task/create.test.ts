import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create', () => {
  it('显示帮助信息', async () => {
    const {stdout} = await runCommand(['task', 'create', '--help'])
    expect(stdout).to.contain('创建定时任务到数据库')
    expect(stdout).to.contain('--interactive')
    expect(stdout).to.contain('--path')
    expect(stdout).to.contain('--trigger')
  })

  it('缺少必要参数时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('必须提供可执行文件路径')
    }
  })

  it('缺少触发类型时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('必须提供触发类型')
    }
  })
})
