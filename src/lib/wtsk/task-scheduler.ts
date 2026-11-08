import {exec} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'

import edge from 'edge-js'

import {normalizeStartTime} from './trigger-utils.js'

const execAsync = promisify(exec)

// 获取程序根目录：打包后 execPath 指向 exe 文件，开发环境指向 node.exe
// 判断是否打包：检查 execPath 是否以项目名结尾
const isPacked = process.execPath.includes('lppxtaskmgr')
// 本模块位于 <根目录>/dist/lib/wtsk（源码态为 src/lib/wtsk），向上三级即包根目录
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))
// 打包后 execPath 在 bin 目录下，需要向上两级到达 client 目录
// 未打包时不能依赖 cwd：cwd 是用户执行命令时所在的目录，与包安装位置无关
const APP_ROOT = isPacked
  ? path.resolve(path.dirname(process.execPath), '..')
  : path.resolve(MODULE_DIR, '../../..')
const TASK_SCHEDULER_DLL = path.join(APP_ROOT, 'TaskScheduler.2.12.2', 'lib', 'net45', 'Microsoft.Win32.TaskScheduler.dll')
const TASK_FOLDER = 'taskmgr'

function getCreateTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Collections;
using System.Threading.Tasks;
using System.Security.Principal;

public class Startup {
    private static int[] ReadIntArray(object value) {
        if (value == null) return new int[0];

        if (value is int[]) return (int[])value;
        if (value is object[]) {
            object[] arr = (object[])value;
            int[] parsed = new int[arr.Length];
            for (int i = 0; i < arr.Length; i++) parsed[i] = Convert.ToInt32(arr[i]);
            return parsed;
        }

        if (value is string) {
            string text = ((string)value).Trim();
            if (string.IsNullOrWhiteSpace(text)) return new int[0];
            string[] parts = text.Split(',');
            int[] parsed = new int[parts.Length];
            for (int i = 0; i < parts.Length; i++) parsed[i] = Convert.ToInt32(parts[i].Trim());
            return parsed;
        }

        if (value is IEnumerable) {
            var list = new System.Collections.Generic.List<int>();
            foreach (var item in (IEnumerable)value) {
                list.Add(Convert.ToInt32(item));
            }
            return list.ToArray();
        }

        return new[] { Convert.ToInt32(value) };
    }

    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            string executablePath = (string)input.executablePath;
            string arguments = input.arguments != null ? (string)input.arguments : "";
            string description = input.description != null ? (string)input.description : "";
            string triggerType = input.triggerType != null ? (string)input.triggerType : "Daily";
            string startTime = input.startTime != null ? (string)input.startTime : "11:30";
            int[] weekdays = ReadIntArray((object)input.weekdays);
            int[] months = ReadIntArray((object)input.months);
            int[] monthdays = ReadIntArray((object)input.monthdays);
            int[] weeksOfMonth = ReadIntArray((object)input.weeksOfMonth);
            short interval = input.interval != null ? (short)(int)input.interval : (short)1;

            
            bool enabled = input.enabled != null ? (bool)input.enabled : true;
            bool startWhenAvailable = input.startWhenAvailable != null ? (bool)input.startWhenAvailable : false;
            bool hidden = input.hidden != null ? (bool)input.hidden : false;
            bool wakeToRun = input.wakeToRun != null ? (bool)input.wakeToRun : true;
            bool disallowStartIfOnBatteries = input.disallowStartIfOnBatteries != null ? (bool)input.disallowStartIfOnBatteries : false;
            bool stopIfGoingOnBatteries = input.stopIfGoingOnBatteries != null ? (bool)input.stopIfGoingOnBatteries : false;
            bool runHighest = input.runHighest != null ? (bool)input.runHighest : false;
            string multipleInstances = input.multipleInstances != null ? (string)input.multipleInstances : "";
            string endTime = input.endTime != null ? (string)input.endTime : "";
            // 以下分钟数缺省为 -1，表示未设置
            int executionTimeLimitMinutes = input.executionTimeLimitMinutes != null ? (int)input.executionTimeLimitMinutes : -1;
            int repeatIntervalMinutes = input.repeatIntervalMinutes != null ? (int)input.repeatIntervalMinutes : -1;
            int repeatDurationMinutes = input.repeatDurationMinutes != null ? (int)input.repeatDurationMinutes : -1;
            int delayMinutes = input.delayMinutes != null ? (int)input.delayMinutes : -1;
            string currentUser = WindowsIdentity.GetCurrent().Name;
            bool isAdministrator = new WindowsPrincipal(WindowsIdentity.GetCurrent())
                .IsInRole(WindowsBuiltInRole.Administrator);
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder;
                try {
                    taskFolder = ts.GetFolder("${TASK_FOLDER}");
                }
                catch {
                    taskFolder = ts.RootFolder.CreateFolder("${TASK_FOLDER}");
                }
                
                TaskDefinition td = ts.NewTask();
                td.RegistrationInfo.Description = description;
                
                td.Settings.Enabled = enabled;
                td.Settings.StartWhenAvailable = startWhenAvailable;
                td.Settings.Hidden = hidden;
                td.Settings.WakeToRun = wakeToRun;
                td.Settings.DisallowStartIfOnBatteries = disallowStartIfOnBatteries;
                td.Settings.StopIfGoingOnBatteries = stopIfGoingOnBatteries;
                td.Principal.UserId = currentUser;
                td.Principal.LogonType = TaskLogonType.InteractiveToken;
                if (runHighest) td.Principal.RunLevel = TaskRunLevel.Highest;
                if (executionTimeLimitMinutes >= 0) td.Settings.ExecutionTimeLimit = TimeSpan.FromMinutes(executionTimeLimitMinutes);
                switch (multipleInstances) {
                    case "parallel": td.Settings.MultipleInstances = TaskInstancesPolicy.Parallel; break;
                    case "queue": td.Settings.MultipleInstances = TaskInstancesPolicy.Queue; break;
                    case "ignore-new": td.Settings.MultipleInstances = TaskInstancesPolicy.IgnoreNew; break;
                    case "stop-existing": td.Settings.MultipleInstances = TaskInstancesPolicy.StopExisting; break;
                }
                
                switch (triggerType.ToLower())
                {
                    case "daily":
                        td.Triggers.Add(new DailyTrigger { 
                            StartBoundary = DateTime.Parse(startTime),
                            DaysInterval = interval
                        });
                        break;
                    case "weekly":
                        DaysOfTheWeek weeklyDow = 0;
                        foreach (int d in weekdays) {
                            switch (d) {
                                case 0: weeklyDow |= DaysOfTheWeek.Sunday; break;
                                case 1: weeklyDow |= DaysOfTheWeek.Monday; break;
                                case 2: weeklyDow |= DaysOfTheWeek.Tuesday; break;
                                case 3: weeklyDow |= DaysOfTheWeek.Wednesday; break;
                                case 4: weeklyDow |= DaysOfTheWeek.Thursday; break;
                                case 5: weeklyDow |= DaysOfTheWeek.Friday; break;
                                case 6: weeklyDow |= DaysOfTheWeek.Saturday; break;
                            }
                        }
                        if (weeklyDow == 0) weeklyDow = DaysOfTheWeek.Monday;
                        td.Triggers.Add(new WeeklyTrigger { 
                            StartBoundary = DateTime.Parse(startTime),
                            DaysOfWeek = weeklyDow,
                            WeeksInterval = interval
                        });
                        break;
                    case "monthly":
                        if (weeksOfMonth.Length > 0) {
                            MonthlyDOWTrigger mtDow = new MonthlyDOWTrigger();
                            mtDow.StartBoundary = DateTime.Parse(startTime);
                            DaysOfTheWeek monthlyDow = 0;
                            foreach (int d in weekdays) {
                                switch (d) {
                                    case 0: monthlyDow |= DaysOfTheWeek.Sunday; break;
                                    case 1: monthlyDow |= DaysOfTheWeek.Monday; break;
                                    case 2: monthlyDow |= DaysOfTheWeek.Tuesday; break;
                                    case 3: monthlyDow |= DaysOfTheWeek.Wednesday; break;
                                    case 4: monthlyDow |= DaysOfTheWeek.Thursday; break;
                                    case 5: monthlyDow |= DaysOfTheWeek.Friday; break;
                                    case 6: monthlyDow |= DaysOfTheWeek.Saturday; break;
                                }
                            }
                            if (monthlyDow == 0) monthlyDow = DaysOfTheWeek.Monday;
                            mtDow.DaysOfWeek = monthlyDow;

                            WhichWeek ww = 0;
                            foreach (int w in weeksOfMonth) {
                                switch (w) {
                                    case 1: ww |= WhichWeek.FirstWeek; break;
                                    case 2: ww |= WhichWeek.SecondWeek; break;
                                    case 3: ww |= WhichWeek.ThirdWeek; break;
                                    case 4: ww |= WhichWeek.FourthWeek; break;
                                    case 5: ww |= WhichWeek.LastWeek; break;
                                }
                            }
                            if (ww == 0) ww = WhichWeek.FirstWeek;
                            mtDow.WeeksOfMonth = ww;

                            MonthsOfTheYear moyDow = 0;
                            if (months.Length > 0) {
                                foreach (int m in months) {
                                    if (m >= 1 && m <= 12) {
                                        moyDow |= (MonthsOfTheYear)(1 << (m - 1));
                                    }
                                }
                            } else {
                                int currentMonthDow = DateTime.Now.Month;
                                for (int i = 1; i <= 12; i++) {
                                    if (Math.Abs(i - currentMonthDow) % interval == 0) {
                                        moyDow |= (MonthsOfTheYear)(1 << (i - 1));
                                    }
                                }
                                if (interval == 1) moyDow = MonthsOfTheYear.AllMonths;
                            }
                            mtDow.MonthsOfYear = moyDow;
                            td.Triggers.Add(mtDow);
                        } else {
                            MonthlyTrigger mt = new MonthlyTrigger();
                            mt.StartBoundary = DateTime.Parse(startTime);
                            if (monthdays.Length > 0) {
                                mt.DaysOfMonth = monthdays;
                            }
                            MonthsOfTheYear moy = 0;
                            if (months.Length > 0) {
                                foreach (int m in months) {
                                    if (m >= 1 && m <= 12) {
                                        moy |= (MonthsOfTheYear)(1 << (m - 1));
                                    }
                                }
                            } else {
                                int currentMonth = DateTime.Now.Month;
                                for (int i = 1; i <= 12; i++) {
                                    if (Math.Abs(i - currentMonth) % interval == 0) {
                                        moy |= (MonthsOfTheYear)(1 << (i - 1));
                                    }
                                }
                                if (interval == 1) moy = MonthsOfTheYear.AllMonths;
                            }
                            mt.MonthsOfYear = moy;
                            td.Triggers.Add(mt);
                        }
                        break;
                    case "once":
                        td.Triggers.Add(new TimeTrigger { 
                            StartBoundary = DateTime.Parse(startTime)
                        });
                        break;
                    case "boot":
                        if (!isAdministrator) {
                            return "Error: 启动时任务需要管理员权限。请使用“以管理员身份运行”的终端后重试，或改用“登录时任务”。";
                        }
                        td.Principal.UserId = "SYSTEM";
                        td.Principal.LogonType = TaskLogonType.ServiceAccount;
                        td.Principal.RunLevel = TaskRunLevel.Highest;
                        td.Triggers.Add(new BootTrigger());
                        break;
                    case "logon":
                        td.Triggers.Add(new LogonTrigger { UserId = currentUser });
                        break;
                    default:
                        td.Triggers.Add(new DailyTrigger { 
                            StartBoundary = DateTime.Parse(startTime)
                        });
                        break;
                }
                
                // 触发器级高级选项：过期时间、重复、延迟（每个任务只有一个触发器）
                Trigger trig = td.Triggers[0];
                if (endTime != "") trig.EndBoundary = DateTime.Parse(endTime);
                if (repeatIntervalMinutes > 0) {
                    trig.Repetition.Interval = TimeSpan.FromMinutes(repeatIntervalMinutes);
                    // 持续时间缺省为 TimeSpan.Zero，即无限期重复
                    trig.Repetition.Duration = repeatDurationMinutes > 0 ? TimeSpan.FromMinutes(repeatDurationMinutes) : TimeSpan.Zero;
                }
                if (delayMinutes > 0) {
                    TimeSpan delay = TimeSpan.FromMinutes(delayMinutes);
                    if (trig is BootTrigger) ((BootTrigger)trig).Delay = delay;
                    else if (trig is LogonTrigger) ((LogonTrigger)trig).Delay = delay;
                    else if (trig is TimeTrigger) ((TimeTrigger)trig).RandomDelay = delay;
                    else if (trig is DailyTrigger) ((DailyTrigger)trig).RandomDelay = delay;
                    else if (trig is WeeklyTrigger) ((WeeklyTrigger)trig).RandomDelay = delay;
                    else if (trig is MonthlyTrigger) ((MonthlyTrigger)trig).RandomDelay = delay;
                    else if (trig is MonthlyDOWTrigger) ((MonthlyDOWTrigger)trig).RandomDelay = delay;
                }

                td.Actions.Add(new ExecAction(executablePath, arguments, null));
                
                taskFolder.RegisterTaskDefinition(taskName, td);
                
                return "Task '" + taskName + "' created successfully.";
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getDeleteTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                taskFolder.DeleteTask(taskName, false);
                return "Task '" + taskName + "' deleted successfully.";
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getGetTasksCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"
#r "System.Web.Extensions.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder;
                try {
                    taskFolder = ts.GetFolder("${TASK_FOLDER}");
                }
                catch {
                    return "[]";
                }
                var tasks = taskFolder.GetTasks()
                    .Select(t => new {
                        name = t.Name,
                        path = t.Path,
                        state = t.State.ToString(),
                        enabled = t.Enabled,
                        lastRunTime = t.LastRunTime.ToString("yyyy-MM-dd HH:mm:ss"),
                        nextRunTime = t.NextRunTime.ToString("yyyy-MM-dd HH:mm:ss"),
                        lastTaskResult = t.LastTaskResult,
                        numberOfMissedRuns = t.NumberOfMissedRuns,
                        actions = t.Definition.Actions.Select(a => a.ToString()).ToList(),
                        triggers = t.Definition.Triggers.Select(tr => tr.ToString()).ToList(),
                        registrationDate = t.Definition.RegistrationInfo.Date != null ? t.Definition.RegistrationInfo.Date.ToString("yyyy-MM-dd HH:mm:ss") : "",
                        uri = t.Definition.RegistrationInfo.URI != null ? t.Definition.RegistrationInfo.URI : "",
                        version = t.Definition.RegistrationInfo.Version != null ? t.Definition.RegistrationInfo.Version.ToString() : "",
                        author = t.Definition.RegistrationInfo.Author != null ? t.Definition.RegistrationInfo.Author : ""
                    })
                    .ToList();
                
                return new JavaScriptSerializer().Serialize(tasks);
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getGetTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"
#r "System.Web.Extensions.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTasks().FirstOrDefault(t => t.Name == taskName);
                if (task == null)
                {
                    return "Task '" + taskName + "' not found.";
                }
                
                var result = new {
                    name = task.Name,
                    path = task.Path,
                    state = task.State.ToString(),
                    lastRunTime = task.LastRunTime.ToString("yyyy-MM-dd HH:mm:ss"),
                    nextRunTime = task.NextRunTime.ToString("yyyy-MM-dd HH:mm:ss"),
                    definition = new {
                        actions = task.Definition.Actions.Select(a => a.ToString()).ToList(),
                        triggers = task.Definition.Triggers.Select(t => t.ToString()).ToList()
                    }
                };
                
                return new JavaScriptSerializer().Serialize(result);
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getRunTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Linq;
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTasks().FirstOrDefault(t => t.Name == taskName);
                if (task == null)
                {
                    return "Task '" + taskName + "' not found.";
                }
                
                task.Run();
                return "Task '" + taskName + "' started successfully.";
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getStopTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Linq;
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTasks().FirstOrDefault(t => t.Name == taskName);
                if (task == null)
                {
                    return "Task '" + taskName + "' not found.";
                }
                
                // 终止该任务当前所有正在运行的实例
                task.Stop();
                return "Task '" + taskName + "' stopped successfully.";
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

function getSetTaskEnabledCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Linq;
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            bool enabled = (bool)input.enabled;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTasks().FirstOrDefault(t => t.Name == taskName);
                if (task == null)
                {
                    return "Task '" + taskName + "' not found.";
                }
                
                task.Enabled = enabled;
                return "Task '" + taskName + "' " + (enabled ? "enabled" : "disabled") + " successfully.";
            }
        }
        catch (Exception ex)
        {
            return "Error: " + ex.Message;
        }
    }
}
`
}

let _createTask: null | ReturnType<typeof edge.func<unknown, string>> = null
let _deleteTask: null | ReturnType<typeof edge.func<unknown, string>> = null
let _getTasks: null | ReturnType<typeof edge.func<unknown, string>> = null
let _getTask: null | ReturnType<typeof edge.func<unknown, string>> = null
let _runTask: null | ReturnType<typeof edge.func<unknown, string>> = null
let _stopTask: null | ReturnType<typeof edge.func<unknown, string>> = null
let _setTaskEnabled: null | ReturnType<typeof edge.func<unknown, string>> = null

function getCreateTask() {
  if (!_createTask) {
    _createTask = edge.func<unknown, string>(getCreateTaskCs())
  }

  return _createTask
}

function getDeleteTask() {
  if (!_deleteTask) {
    _deleteTask = edge.func<unknown, string>(getDeleteTaskCs())
  }

  return _deleteTask
}

function getGetTasks() {
  if (!_getTasks) {
    _getTasks = edge.func<unknown, string>(getGetTasksCs())
  }

  return _getTasks
}

function getGetTask() {
  if (!_getTask) {
    _getTask = edge.func<unknown, string>(getGetTaskCs())
  }

  return _getTask
}

function getRunTask() {
  if (!_runTask) {
    _runTask = edge.func<unknown, string>(getRunTaskCs())
  }

  return _runTask
}

function getStopTask() {
  if (!_stopTask) {
    _stopTask = edge.func<unknown, string>(getStopTaskCs())
  }

  return _stopTask
}

function getSetTaskEnabled() {
  if (!_setTaskEnabled) {
    _setTaskEnabled = edge.func<unknown, string>(getSetTaskEnabledCs())
  }

  return _setTaskEnabled
}

export type MultipleInstancesPolicy = 'ignore-new' | 'parallel' | 'queue' | 'stop-existing'

export interface CreateTaskOptions {
  arguments?: string
  delayMinutes?: number // boot/logon: 触发后延迟；其余触发器: 开始时间后随机延迟上限
  description?: string
  disallowStartIfOnBatteries?: boolean
  enabled?: boolean
  endTime?: string // 触发器过期时间 (YYYY-MM-DD HH:mm)
  executablePath: string
  executionTimeLimitMinutes?: number // 0 表示不限制
  hidden?: boolean
  interval?: number
  multipleInstances?: MultipleInstancesPolicy
  repeatDurationMinutes?: number // 缺省表示无限期重复
  repeatIntervalMinutes?: number
  runHighest?: boolean
  months?: number[]
  monthdays?: number[]  // 每月执行日期 (1-31)，仅 monthly 触发器使用
  startTime?: string
  startWhenAvailable?: boolean
  stopIfGoingOnBatteries?: boolean
  taskName: string
  triggerType?: 'boot' | 'daily' | 'logon' | 'monthly' | 'once' | 'weekly'
  wakeToRun?: boolean
  weekdays?: number[]   // 每周执行星期 (0=周日, 1=周一 ... 6=周六)，仅 weekly 触发器使用
  weeksOfMonth?: number[] // 第几周执行 (1-4为1-4周，5为最后一周)，仅 monthly 且按周触发使用
}

export interface TaskInfo {
  actions: string[]
  author: string
  enabled: boolean
  lastRunTime: string
  lastTaskResult: number
  name: string
  nextRunTime: string
  numberOfMissedRuns: number
  path: string
  registrationDate: string
  state: string
  triggers: string[]
  uri: string
  version: string
}

export interface TaskDetail extends TaskInfo {
  definition: {
    actions: string[]
    triggers: string[]
  }
}

export async function createScheduledTask(options: CreateTaskOptions): Promise<string> {
  const fn = getCreateTask()
  // 可选字段显式补 null：edge-js 的动态对象缺失成员会抛异常，null 则可用 `!= null` 判断
  const normalizedOptions = {
    ...options,
    startTime: options.startTime ? normalizeStartTime(options.startTime) : options.startTime,
    runHighest: options.runHighest ?? false,
    multipleInstances: options.multipleInstances ?? null,
    endTime: options.endTime ? normalizeStartTime(options.endTime) : null,
    executionTimeLimitMinutes: options.executionTimeLimitMinutes ?? null,
    repeatIntervalMinutes: options.repeatIntervalMinutes ?? null,
    repeatDurationMinutes: options.repeatDurationMinutes ?? null,
    delayMinutes: options.delayMinutes ?? null,
  }

  return new Promise((resolve, reject) => {
    fn(normalizedOptions, (error: Error | null, result: string) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}

export async function deleteScheduledTask(taskName: string): Promise<string> {
  const fn = getDeleteTask()

  return new Promise((resolve, reject) => {
    fn({ taskName }, (error: Error | null, result: string) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}

export async function getAllTasks(): Promise<string | TaskInfo[]> {
  const fn = getGetTasks()

  return new Promise((resolve, reject) => {
    fn({}, (error: Error | null, result: string) => {
      if (error) {
        reject(error)
        return
      }

      if (!result) {
        resolve('获取任务列表失败')
        return
      }

      if (result.startsWith('Error:')) {
        resolve(result)
        return
      }

      if (result === '[]') {
        resolve([])
        return
      }

      resolve(JSON.parse(result) as TaskInfo[])
    })
  })
}

// 使用 schtasks 命令快速检查任务是否存在（比 edge-js 调用更快）
export async function taskExists(taskName: string): Promise<boolean> {
  try {
    await execAsync(`schtasks /query /tn "\\${TASK_FOLDER}\\${taskName}"`, {
      encoding: 'utf8',
      windowsHide: true,
    })
    return true
  } catch {
    return false
  }
}

export async function getScheduledTask(taskName: string): Promise<string | TaskDetail> {
  const fn = getGetTask()

  return new Promise((resolve, reject) => {
    fn({ taskName }, (error: Error | null, result: string) => {
      if (error) {
        reject(error)
        return
      }

      if (!result || result.startsWith('Error:') || result.includes('not found')) {
        resolve(result ?? '获取任务详情失败')
        return
      }

      resolve(JSON.parse(result) as TaskDetail)
    })
  })
}

export async function runScheduledTask(taskName: string): Promise<string> {
  const fn = getRunTask()

  return new Promise((resolve, reject) => {
    fn({ taskName }, (error: Error | null, result: string) => {
      if (error) reject(error)
      else resolve(result ?? '运行任务失败')
    })
  })
}

export async function stopScheduledTask(taskName: string): Promise<string> {
  const fn = getStopTask()

  return new Promise((resolve, reject) => {
    fn({ taskName }, (error: Error | null, result: string) => {
      if (error) reject(error)
      else resolve(result ?? '停止任务失败')
    })
  })
}

export async function setScheduledTaskEnabled(taskName: string, enabled: boolean): Promise<string> {
  const fn = getSetTaskEnabled()

  return new Promise((resolve, reject) => {
    fn({ taskName, enabled }, (error: Error | null, result: string) => {
      if (error) reject(error)
      else resolve(result ?? '设置任务启用状态失败')
    })
  })
}
