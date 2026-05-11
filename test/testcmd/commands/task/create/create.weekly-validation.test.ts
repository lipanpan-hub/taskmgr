import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - Weekly 触发类型验证', () => {
  it('weekly 触发类型缺少 weekdays 参数时报错', async () => {
    // 验证 weekly 触发类型必须提供 weekdays 参数
    const result = await runCommand([
      'task',
      'create',
      'testTask1',
      '--path=notepad.exe',
      '--trigger=weekly',
      '--start-time=11:30',
    ])
    
    expect(result.error?.message).to.contain('weekly 触发类型需要 --weekdays 参数')
  })

  it('weekly 触发类型提供有效 weekdays 参数时不报错', async () => {
    // 验证提供有效的 weekdays 参数后命令可以正常执行（使用数字格式）
    const result = await runCommand([
      'task',
      'create',
      'testTask2',
      '--path=notepad.exe',
      '--trigger=weekly',
      '--start-time=11:30',
      '--weekdays=1,3,5',
    ])

    expect(result.error).to.be.undefined
  })

  it('weekly 触发类型提供无效 weekdays 参数时报错', async () => {
    // 验证无效的 weekdays 参数会被拒绝
    const result = await runCommand([
      'task',
      'create',
      'testTask3',
      '--path=notepad.exe',
      '--trigger=weekly',
      '--start-time=11:30',
      '--weekdays=7,8,9',
    ])

    expect(result.error?.message).to.contain('weekdays 必须是 0-6 之间的数字')
  })
})
