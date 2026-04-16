import {createScheduledTask, taskExists} from './task-scheduler.js'

// 创建自动同步任务，在用户登录时自动执行 tm task sync2schd 命令
export async function createAutoSyncTask(): Promise<string> {
  const taskName = 'AutoSync'

  // 检查任务是否已存在
  const exists = await taskExists(taskName)
  if (exists) {
    return `任务 ${taskName} 已存在，无需重复创建`
  }

  const executablePath = 'tm'
  const execArguments = 'task sync2schd'

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
    startTime: '09:00',
    weekdays: [],
    months: [],
    monthdays: [],
    weeksOfMonth: [],
    interval: 1,
  })

  return result
}
