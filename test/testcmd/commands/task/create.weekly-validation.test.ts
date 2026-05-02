import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create - Weekly 触发类型验证', () => {
  it('weekly 触发类型缺少 weekdays 参数时报错', async () => {
    // 验证 weekly 触发类型必须提供 weekdays 参数
    let error: Error | undefined
    try {
      await runCommand(['task', 'create', 'testTask', '--path=notepad.exe', '--trigger=weekly', '--start-time=09:00'])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('weekly 触发类型需要 --weekdays 参数')
  })

  it('weekly 触发类型提供有效 weekdays 参数时不报错', async () => {
    // 验证提供有效的 weekdays 参数后命令可以正常执行
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
        '--path=notepad.exe',
        '--trigger=weekly',
        '--start-time=09:00',
        '--weekdays=Monday,Wednesday,Friday',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.be.undefined
  })

  it('weekly 触发类型提供无效 weekdays 参数时报错', async () => {
    // 验证无效的 weekdays 参数会被拒绝
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
        '--path=notepad.exe',
        '--trigger=weekly',
        '--start-time=09:00',
        '--weekdays=InvalidDay',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
  })
})
