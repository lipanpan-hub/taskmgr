import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - Monthly 触发类型验证', () => {
  it('monthly 触发类型缺少 months 参数时报错', async () => {
    // 验证 monthly 触发类型必须提供 months 参数
    const result = await runCommand([
      'task',
      'create',
      'testTask',
      '--path=notepad.exe',
      '--trigger=monthly',
      '--start-time=11:30',
    ])

    expect(result.error?.message).to.contain('monthly 触发类型需要 --months 参数')
  })

  it('monthly 触发类型缺少 monthdays 或 weeks-of-month 参数时报错', async () => {
    // 验证 monthly 触发类型必须提供 monthdays 或 weeks-of-month 参数之一
    const result = await runCommand([
      'task',
      'create',
      'testTask',
      '--path=notepad.exe',
      '--trigger=monthly',
      '--start-time=11:30',
      '--months=1,6,12',
    ])

    expect(result.error?.message).to.contain('monthly 触发类型需要 --monthdays 或 --weeks-of-month 参数')
  })

  it('monthly 触发类型同时使用 monthdays 和 weeks-of-month 时报错', async () => {
    // 验证 monthdays 和 weeks-of-month 参数互斥（由 oclif 框架的 exclusive 属性验证）
    const result = await runCommand([
      'task',
      'create',
      'testTask',
      '--path=notepad.exe',
      '--trigger=monthly',
      '--start-time=11:30',
      '--months=1,6,12',
      '--monthdays=1,15',
      '--weeks-of-month=1,3',
    ])

    // oclif 框架会生成类似 "cannot also be provided when using" 的错误消息
    expect(result.error?.message).to.contain('monthdays')
    expect(result.error?.message).to.contain('weeks-of-month')
    expect(result.error?.message).to.contain('cannot also be provided')
  })

  it('monthly 触发类型使用 weeks-of-month 但缺少 weekdays 时报错', async () => {
    // 验证使用 weeks-of-month 时必须同时指定 weekdays（由 oclif 框架的 dependsOn 属性验证）
    const result = await runCommand([
      'task',
      'create',
      'testTask',
      '--path=notepad.exe',
      '--trigger=monthly',
      '--start-time=11:30',
      '--months=1,6,12',
      '--weeks-of-month=1,3',
    ])

    // oclif 框架会生成类似 "All of the following must be provided when using" 的错误消息
    expect(result.error?.message).to.contain('weeks-of-month')
    expect(result.error?.message).to.contain('weekdays')
    expect(result.error?.message).to.contain('must be provided')
  })
})
