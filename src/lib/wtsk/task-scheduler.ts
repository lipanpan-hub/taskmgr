import edge from 'edge-js'

import {normalizeStartTime} from './trigger-utils.js'

const TASK_SCHEDULER_DLL = `${process.cwd()}/TaskScheduler.2.12.2/lib/net45/Microsoft.Win32.TaskScheduler.dll`
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
            string startTime = input.startTime != null ? (string)input.startTime : "09:00";
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
                        triggers = t.Definition.Triggers.Select(tr => tr.ToString()).ToList()
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
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            await System.Threading.Tasks.Task.Delay(0);
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTask(taskName);
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

let _createTask: null | ReturnType<typeof edge.func<string>> = null
let _deleteTask: null | ReturnType<typeof edge.func<string>> = null
let _getTasks: null | ReturnType<typeof edge.func<string>> = null
let _getTask: null | ReturnType<typeof edge.func<string>> = null
let _runTask: null | ReturnType<typeof edge.func<string>> = null

function getCreateTask() {
  if (!_createTask) {
    _createTask = edge.func<string>(getCreateTaskCs())
  }

  return _createTask
}

function getDeleteTask() {
  if (!_deleteTask) {
    _deleteTask = edge.func<string>(getDeleteTaskCs())
  }

  return _deleteTask
}

function getGetTasks() {
  if (!_getTasks) {
    _getTasks = edge.func<string>(getGetTasksCs())
  }

  return _getTasks
}

function getGetTask() {
  if (!_getTask) {
    _getTask = edge.func<string>(getGetTaskCs())
  }

  return _getTask
}

function getRunTask() {
  if (!_runTask) {
    _runTask = edge.func<string>(getRunTaskCs())
  }

  return _runTask
}

export interface CreateTaskOptions {
  arguments?: string
  description?: string
  disallowStartIfOnBatteries?: boolean
  enabled?: boolean
  executablePath: string
  hidden?: boolean
  interval?: number
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
  enabled: boolean
  lastRunTime: string
  lastTaskResult: number
  name: string
  nextRunTime: string
  numberOfMissedRuns: number
  path: string
  state: string
  triggers: string[]
}

export interface TaskDetail extends TaskInfo {
  definition: {
    actions: string[]
    triggers: string[]
  }
}

export async function createScheduledTask(options: CreateTaskOptions): Promise<string> {
  const fn = getCreateTask()
  const normalizedOptions = {
    ...options,
    startTime: options.startTime ? normalizeStartTime(options.startTime) : options.startTime,
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
