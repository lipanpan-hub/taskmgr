import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create', () => {
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

  it('weekly 触发类型缺少 weekdays 参数时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=weekly', '--start-time=09:00'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('weekly 触发类型需要 --weekdays 参数')
    }
  })

  it('monthly 触发类型缺少 months 参数时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=monthly', '--start-time=09:00'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('monthly 触发类型需要 --months 参数')
    }
  })

  it('monthly 触发类型缺少 monthdays 或 weeks-of-month 参数时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=monthly', '--start-time=09:00', '--months=1,6,12'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('monthly 触发类型需要 --monthdays 或 --weeks-of-month 参数')
    }
  })

  it('monthly 触发类型同时使用 monthdays 和 weeks-of-month 时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=monthly', '--start-time=09:00', '--months=1,6,12', '--monthdays=1,15', '--weeks-of-month=1,3'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('--monthdays 和 --weeks-of-month 不能同时使用')
    }
  })

  it('monthly 触发类型使用 weeks-of-month 但缺少 weekdays 时报错', async () => {
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=monthly', '--start-time=09:00', '--months=1,6,12', '--weeks-of-month=1,3'])
      expect.fail('应该抛出错误')
    } catch (error: any) {
      expect(error.message).to.contain('使用 --weeks-of-month 时必须同时指定 --weekdays 参数')
    }
  })
})
