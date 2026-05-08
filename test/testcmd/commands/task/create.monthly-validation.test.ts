import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create - Monthly 触发类型验证', () => {
  it('monthly 触发类型缺少 months 参数时报错', async () => {
    // 验证 monthly 触发类型必须提供 months 参数
    let error: Error | undefined
    try {
      await runCommand([
        'task', 
        'create', 
        'testTask', 
        '--path=notepad.exe', 
        '--trigger=monthly', 
        '--start-time=11:30',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('monthly 触发类型需要 --months 参数')
  })

  it('monthly 触发类型缺少 monthdays 或 weeks-of-month 参数时报错', async () => {
    // 验证 monthly 触发类型必须提供 monthdays 或 weeks-of-month 参数之一
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
        '--path=notepad.exe',
        '--trigger=monthly',
        '--start-time=11:30',
        '--months=1,6,12',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('monthly 触发类型需要 --monthdays 或 --weeks-of-month 参数')
  })

  it('monthly 触发类型同时使用 monthdays 和 weeks-of-month 时报错', async () => {
    // 验证 monthdays 和 weeks-of-month 参数互斥
    let error: Error | undefined
    try {
      await runCommand([
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
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('--monthdays 和 --weeks-of-month 不能同时使用')
  })

  it('monthly 触发类型使用 weeks-of-month 但缺少 weekdays 时报错', async () => {
    // 验证使用 weeks-of-month 时必须同时指定 weekdays
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
        '--path=notepad.exe',
        '--trigger=monthly',
        '--start-time=11:30',
        '--months=1,6,12',
        '--weeks-of-month=1,3',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('使用 --weeks-of-month 时必须同时指定 --weekdays 参数')
  })
})
