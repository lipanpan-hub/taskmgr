import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task create - Daily 触发类型验证', () => {
  // 生成唯一任务名称的辅助函数
  const generateTaskName = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  // #region 必需参数验证
  it('daily 触发类型缺少 start-time 参数时报错', async () => {
    // 验证 daily 触发类型必须提供 start-time 参数
    const taskName = generateTaskName('testDailyTask_test1')
    const result = await runCommand([
        'task', 
        'create', 
        taskName, 
        '--path=notepad.exe', 
        '--trigger=daily',
    ])
    
    expect(result.error?.message).to.contain('daily 触发类型需要 --start-time 参数')
  })
  // #endregion

  // #region 基本功能测试
  it('daily 触发类型提供有效 start-time 参数时不报错', async () => {
    // 验证提供有效的 start-time 参数后命令可以正常执行（默认 interval=1）
    const taskName = generateTaskName('testDailyTask_test2')
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
    const taskName = generateTaskName('testDailyTask_test3')
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
  // #endregion

  // #region start-time 格式测试
  it('start-time 使用简短格式 HH:mm 时正常工作', async () => {
    // 验证简短时间格式（只有时分）
    const taskName = generateTaskName('testDailyTask_test4')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=09:00',
    ])

    expect(result.error).to.be.undefined
  })

  it('start-time 使用完整格式 YYYY-MM-DD HH:mm 时正常工作', async () => {
    // 验证完整时间格式（包含日期）
    const taskName = generateTaskName('testDailyTask_test5')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time="2026-12-31 23:59"',
    ])

    expect(result.error).to.be.undefined
  })

  it('start-time 使用午夜时间 00:00 时正常工作', async () => {
    // 验证边界时间：午夜
    const taskName = generateTaskName('testDailyTask_test6')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=00:00',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region interval 边界值测试
  it('interval 设置为 1 时正常工作（每天执行）', async () => {
    // 验证最小间隔值
    const taskName = generateTaskName('testDailyTask_test8')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=10:00',
      '--interval=1',
    ])

    expect(result.error).to.be.undefined
  })

  it('interval 设置为较大值时正常工作（每 30 天执行）', async () => {
    // 验证较大的间隔值
    const taskName = generateTaskName('testDailyTask_test9')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=10:00',
      '--interval=30',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 可选参数组合测试
  it('同时提供 description 和 arguments 参数时正常工作', async () => {
    // 验证与其他可选参数的组合
    const taskName = generateTaskName('testDailyTask_test11')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--arguments=test.txt',
      '--description=每日测试任务',
      '--trigger=daily',
      '--start-time=14:30',
      '--interval=2',
    ])

    expect(result.error).to.be.undefined
  })

  it('设置 enabled=false 时正常工作', async () => {
    // 验证创建禁用状态的任务
    const taskName = generateTaskName('testDailyTask_test12')
    const result = await runCommand([
      'task',
      'create',
      taskName,
      '--path=notepad.exe',
      '--trigger=daily',
      '--start-time=10:00',
      '--no-enabled',
    ])

    expect(result.error).to.be.undefined
  })
  // #endregion

  // #region 任务名称测试
  it('任务名称包含中文时正常工作', async () => {
    // 验证中文任务名
    const taskName = generateTaskName('每日任务测试_test13')
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

  it('任务名称包含特殊字符时正常工作', async () => {
    // 验证特殊字符任务名
    const taskName = generateTaskName('test-daily_task.v1_test14')
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

  // #region 可执行文件路径测试
  it('path 使用绝对路径时正常工作', async () => {
    // 验证绝对路径
    const taskName = generateTaskName('testDailyTask_test15')
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

  it('path 使用相对路径时正常工作', async () => {
    // 验证相对路径
    const taskName = generateTaskName('testDailyTask_test16')
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
  // #endregion
})
