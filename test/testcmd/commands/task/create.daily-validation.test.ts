import {expect} from 'chai'
import {runCommand} from '@oclif/test'

describe('task create - Daily 触发类型验证', () => {
  it('daily 触发类型缺少 start-time 参数时报错', async () => {
    // 验证 daily 触发类型必须提供 start-time 参数
    const result = await runCommand([
        'task', 
        'create', 
        'testTask1', 
        '--path=notepad.exe', 
        '--trigger=daily',
    ])
    
    expect(result.error?.message).to.contain('daily 触发类型需要 --start-time 参数')
  })

  it('daily 触发类型提供有效 start-time 参数时不报错', async () => {
    // 验证提供有效的 start-time 参数后命令可以正常执行（默认 interval=1）
    const taskName = `testDailyTask_${Date.now()}_1`
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=11:30',
    ])

    expect(result.error).to.be.undefined
  })

  it('daily 触发类型提供 interval 参数时不报错', async () => {
    // 验证可以指定自定义的 interval 参数（每隔几天触发）
    const taskName = `testDailyTask_${Date.now()}_2`
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=11:30',
      '--interval=3',
    ])

    expect(result.error).to.be.undefined
  })
})
