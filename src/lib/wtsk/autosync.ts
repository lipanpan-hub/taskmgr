import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {getOclifConfigDir} from '../utils/oclif-config-dir.js'
import {createScheduledTask, taskExists} from './task-scheduler.js'

// 生成隐藏窗口的 VBS 启动器并返回其绝对路径
// wscript.exe 是 GUI 脚本宿主, 本身不分配控制台窗口;
// WScript.Shell.Run 的窗口样式参数 0 (SW_HIDE) 让被拉起的 cmd 窗口完全不可见, 从而实现全程零窗口
function ensureHiddenLauncher(): string {
  const configDir = getOclifConfigDir()
  mkdirSync(configDir, {recursive: true})

  const launcherPath = join(configDir, 'autosync-launcher.vbs')
  // Run 参数含义: (要执行的命令, 窗口样式 = 0 隐藏, 是否等待返回 = False 不阻塞)
  const vbsContent = 'CreateObject("WScript.Shell").Run "cmd /c tm task sync2schd", 0, False\n'
  writeFileSync(launcherPath, vbsContent, {encoding: 'utf8'})

  return launcherPath
}

// 创建自动同步任务，在用户登录时自动执行 tm task sync2schd 命令
export async function createAutoSyncTask(): Promise<string> {
  const taskName = 'AutoSync'

  // 检查任务是否已存在
  const exists = await taskExists(taskName)
  if (exists) {
    return `任务 ${taskName} 已存在，无需重复创建`
  }

  // 通过 wscript.exe 运行隐藏启动器来执行命令, 避免 cmd 控制台窗口闪现
  // (tm 实体是 tm.cmd, 由启动器内部的 cmd /c 负责经 PATH + PATHEXT 解析)
  const launcherPath = ensureHiddenLauncher()
  const executablePath = 'wscript.exe'
  const execArguments = `"${launcherPath}"`

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
