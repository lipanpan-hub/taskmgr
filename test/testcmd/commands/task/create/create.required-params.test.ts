import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - 必要参数验证', () => {
  it('缺少必要参数时报错', async () => {
    // 验证必须提供可执行文件路径
    const result = await runCommand([
      'task',
      'create',
      'testTask',
    ])

    expect(result.error).to.exist
    expect(result.error?.message).to.contain('必须提供可执行文件路径')
  })

  it('缺少触发类型时报错', async () => {
    // 验证必须提供触发类型参数
    const result = await runCommand([
      'task',
      'create',
      'testTask',
      '--path=notepad.exe',
    ])

    expect(result.error).to.exist
    expect(result.error?.message).to.contain('必须提供触发类型')
  })
})

