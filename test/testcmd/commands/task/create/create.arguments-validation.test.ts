import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - arguments 参数正常场景', () => {
  // 生成唯一任务名称的辅助函数
  const generateTaskName = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  // #region 简单参数测试
  it('arguments 使用简单字符串参数时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_simple1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--arguments=test.txt',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用多个参数（空格分隔）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_simple2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c echo hello world"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 路径参数测试
  it('arguments 使用绝对路径作为参数时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_path1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--arguments=C:\\Windows\\System32\\drivers\\etc\\hosts',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用相对路径作为参数时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_path2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c .\\scripts\\test.bat"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 包含引号的参数测试
  it('arguments 包含双引号时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_quote1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c echo hello"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 包含路径和引号（路径有空格）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_quote2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--arguments="C:\\Program Files\\test file.txt"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 命令行开关参数测试
  it('arguments 使用命令行开关（单个短选项）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_switch1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c dir /w"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用命令行开关（多个选项）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_switch2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c dir /w /p /s"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用长选项（--option）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_switch3')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=node.exe',
      '--arguments=--version',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用带值的选项时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_switch4')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=node.exe',
      '--arguments="script.js --config=config.json --port=3000"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 特殊字符参数测试
  it('arguments 包含特殊字符（&）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_special1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c echo test^&test"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 包含特殊字符（|）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_special2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c echo test^|more"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 包含特殊字符（>）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_special3')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c echo test^>output.txt"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 脚本文件参数测试
  it('arguments 使用 PowerShell 脚本路径时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_script1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=powershell.exe',
      '--arguments="-ExecutionPolicy Bypass -File test.ps1"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用 Python 脚本路径时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_script2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=python.exe',
      '--arguments="script.py --arg1 value1"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用 Node.js 脚本路径时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_script3')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=node.exe',
      '--arguments="app.js --port 3000"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 空参数测试
  it('arguments 为空字符串时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_empty1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--arguments=',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('不提供 arguments 参数时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_empty2')
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
  // #endregion

  // #region 复杂参数组合测试
  it('arguments 使用复杂参数组合（路径+选项+值）时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_complex1')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c app.exe --config config.json --verbose"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('arguments 使用多层引号嵌套时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_complex2')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      '--arguments="/c powershell.exe -Command Write-Host"',
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 长参数测试
  it('arguments 使用很长的参数字符串时正常工作', async () => {
    const taskName = generateTaskName('testArgsTask_long')
    const longArgs = Array.from({length: 50}, (_, i) => `--option${i}=value${i}`).join(' ')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=cmd.exe',
      `--arguments="/c echo ${longArgs}"`,
      '--trigger=daily',
      '--start-time=10:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion
})
