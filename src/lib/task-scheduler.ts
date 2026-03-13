import edge from 'edge-js'

const TASK_SCHEDULER_DLL = `${process.cwd()}/TaskScheduler.2.12.2/lib/net45/Microsoft.Win32.TaskScheduler.dll`
const TASK_FOLDER = 'taskmgr'

function getCreateTaskCs() {
  return `
#r "${TASK_SCHEDULER_DLL.replaceAll('\\', '\\\\')}"
#r "System.Xml.dll"

using Microsoft.Win32.TaskScheduler;
using System;
using System.Threading.Tasks;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            string taskName = (string)input.taskName;
            string executablePath = (string)input.executablePath;
            string arguments = input.arguments != null ? (string)input.arguments : "";
            string description = input.description != null ? (string)input.description : "";
            string triggerType = input.triggerType != null ? (string)input.triggerType : "Daily";
            string startTime = input.startTime != null ? (string)input.startTime : "09:00";
            
            bool enabled = input.enabled != null ? (bool)input.enabled : true;
            bool startWhenAvailable = input.startWhenAvailable != null ? (bool)input.startWhenAvailable : false;
            bool hidden = input.hidden != null ? (bool)input.hidden : false;
            bool wakeToRun = input.wakeToRun != null ? (bool)input.wakeToRun : true;
            bool disallowStartIfOnBatteries = input.disallowStartIfOnBatteries != null ? (bool)input.disallowStartIfOnBatteries : false;
            bool stopIfGoingOnBatteries = input.stopIfGoingOnBatteries != null ? (bool)input.stopIfGoingOnBatteries : false;
            
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
                
                switch (triggerType.ToLower())
                {
                    case "daily":
                        td.Triggers.Add(new DailyTrigger { 
                            StartBoundary = DateTime.Today.Add(TimeSpan.Parse(startTime))
                        });
                        break;
                    case "weekly":
                        td.Triggers.Add(new WeeklyTrigger { 
                            StartBoundary = DateTime.Today.Add(TimeSpan.Parse(startTime)),
                            DaysOfWeek = DaysOfTheWeek.Monday | DaysOfTheWeek.Wednesday | DaysOfTheWeek.Friday
                        });
                        break;
                    case "monthly":
                        td.Triggers.Add(new MonthlyTrigger { 
                            StartBoundary = DateTime.Today.Add(TimeSpan.Parse(startTime))
                        });
                        break;
                    case "once":
                        td.Triggers.Add(new TimeTrigger { 
                            StartBoundary = DateTime.Parse(startTime)
                        });
                        break;
                    case "boot":
                        td.Triggers.Add(new BootTrigger());
                        break;
                    case "logon":
                        td.Triggers.Add(new LogonTrigger());
                        break;
                    default:
                        td.Triggers.Add(new DailyTrigger { 
                            StartBoundary = DateTime.Today.Add(TimeSpan.Parse(startTime))
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
using System.Threading.Tasks;
using System.Web.Script.Serialization;

public class Startup {
    public async Task<object> Invoke(dynamic input) {
        try {
            string taskName = (string)input.taskName;
            
            using (TaskService ts = new TaskService())
            {
                TaskFolder taskFolder = ts.GetFolder("${TASK_FOLDER}");
                var task = taskFolder.GetTask(taskName);
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
  startTime?: string
  startWhenAvailable?: boolean
  stopIfGoingOnBatteries?: boolean
  taskName: string
  triggerType?: 'boot' | 'daily' | 'logon' | 'monthly' | 'once' | 'weekly'
  wakeToRun?: boolean
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

  return new Promise((resolve, reject) => {
    fn(options, (error: Error | null, result: string) => {
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
