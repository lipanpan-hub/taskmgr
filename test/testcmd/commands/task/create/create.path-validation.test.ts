import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - 可执行文件路径正常场景', () => {
  // 生成唯一任务名称的辅助函数
  const generateTaskName = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  // #region 绝对路径测试
  it('path 使用 Windows 系统绝对路径时正常工作', async () => {
    // 验证 Windows 系统路径格式
    const taskName = generateTaskName('testPathTask_absolute1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=C:\\Windows\\System32\\notepad.exe',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('path 使用其他盘符的绝对路径时正常工作', async () => {
    // 验证不同盘符的绝对路径（即使文件不存在也能创建任务）
    const taskName = generateTaskName('testPathTask_absolute2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=D:\\Tools\\test.exe',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 相对路径测试
  it('path 使用相对路径（当前目录）时正常工作', async () => {
    // 验证当前目录的相对路径
    const taskName = generateTaskName('testPathTask_relative1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=.\\scripts\\test.bat',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('path 使用相对路径（父目录）时正常工作', async () => {
    // 验证父目录的相对路径
    const taskName = generateTaskName('testPathTask_relative2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=..\\scripts\\test.bat',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 简单文件名测试
  it('path 使用简单文件名时正常工作（系统 PATH 中的程序）', async () => {
    // 验证系统 PATH 环境变量中的程序
    const taskName = generateTaskName('testPathTask_simple1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('path 使用不带扩展名的简单文件名时正常工作', async () => {
    // 验证不带扩展名的程序名
    const taskName = generateTaskName('testPathTask_simple2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 路径包含空格测试
  it('path 包含空格时正常工作', async () => {
    // 验证路径中包含空格的情况（使用引号包裹）
    const taskName = generateTaskName('testPathTask_space1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path="C:\\Program Files\\test app\\test.exe"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 不同文件类型测试
  it('path 指向批处理文件（.bat）时正常工作', async () => {
    // 验证批处理文件
    const taskName = generateTaskName('testPathTask_bat')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=test.bat',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('path 指向命令脚本（.cmd）时正常工作', async () => {
    // 验证命令脚本文件
    const taskName = generateTaskName('testPathTask_cmd')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=test.cmd',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('path 指向 PowerShell 脚本（.ps1）时正常工作', async () => {
    // 验证 PowerShell 脚本文件
    const taskName = generateTaskName('testPathTask_ps1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=test.ps1',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion
})
