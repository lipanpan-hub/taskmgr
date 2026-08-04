import {createScheduledTask, taskExists} from './task-scheduler.js'

// 创建自动同步任务，在用户登录时自动执行 tm task sync2schd 命令
export async function createAutoSyncTask(): Promise<string> {
  const taskName = 'AutoSync'

  // 检查任务是否已存在
  const exists = await taskExists(taskName)
  if (exists) {
    return `任务 ${taskName} 已存在，无需重复创建`
  }

  // tm 实体是 tm.cmd, 任务计划程序的 ExecAction 不会用 PATHEXT 补全扩展名, 直接指定 tm 会报 0x80070002 找不到文件
  // 因此改用 cmd.exe /c 间接调用, 由 cmd 负责通过 PATH + PATHEXT 解析到 tm.cmd
  const executablePath = 'cmd.exe'
  const execArguments = '/c start /min "" tm task sync2schd'

  const result = await createScheduledTask({
    taskName,
    executablePath,
    arguments: execArguments,
    description: '用户登录时自动同步数据库任务到 Windows Task Scheduler',
    triggerType: 'logon',
    enabled: true,
    hidden: false,
    wakeToRun: false,
    disallowStartIfOnBatteries: false,
    stopIfGoingOnBatteries: false,
    startWhenAvailable: false,
    startTime: '11:30',
    weekdays: [],
    months: [],
    monthdays: [],
    weeksOfMonth: [],
    interval: 1,
  })

  return result
}
