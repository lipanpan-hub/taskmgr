import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - 可执行文件路径错误场景', () => {
  // 生成唯一任务名称的辅助函数
  const generateTaskName = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  // #region 缺少 path 参数
  it('缺少 path 参数时报错', async () => {
    // 验证必须提供 path 参数
    const taskName = generateTaskName('testPathError_missing')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error?.message).to.contain('必须提供可执行文件路径')
  })
  // #endregion

  // #region 空路径测试
  it('path 为空字符串时报错', async () => {
    // 验证不能使用空路径
    const taskName = generateTaskName('testPathError_empty')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error?.message).to.contain('必须提供可执行文件路径')
  })
  // #endregion

  // #region 路径空格处理错误测试
  it('path 包含空格但未使用引号时报错', async () => {
    // 验证包含空格的路径必须用引号包裹（命令行参数解析会失败）
    const taskName = generateTaskName('testPathError_space')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=C:\\Program Files\\test.exe',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    // 这个测试会因为命令行参数解析问题而失败
    expect(result.error).to.not.be.undefined
  })
  // #endregion
})

