import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - 必要参数验证', () => {
  it('缺少必要参数时报错', async () => {
    // 验证必须提供可执行文件路径
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('必须提供可执行文件路径')
  })

  it('缺少触发类型时报错', async () => {
    // 验证必须提供触发类型参数
    let error: Error | undefined
    try {
      await runCommand([
        'task',
        'create',
        'testTask',
        '--path=notepad.exe',
      ])
    } catch (err) {
      error = err as Error
    }

    expect(error).to.exist
    expect(error?.message).to.contain('必须提供触发类型')
  })
})
