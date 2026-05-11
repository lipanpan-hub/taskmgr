import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'
import {TaskService} from '../../../../../src/lib/task/task-service.js'

describe('task delete - 删除所有任务', () => {
  let taskService: TaskService
  const createdTaskIds: number[] = []

  before(() => {
    taskService = new TaskService()
  })

  afterEach(async () => {
    // 清理所有创建的测试任务
    for (const taskId of createdTaskIds) {
      try {
        await taskService.deleteTask(taskId)
      } catch {
        // 忽略删除失败（任务可能已被测试删除）
      }
    }
    createdTaskIds.length = 0
  })

  it('删除所有任务', async () => {
    // 步骤1: 创建多个测试任务
    const task1 = await taskService.createTask({
      name: 'test-task-all-1',
      executablePath: 'notepad.exe',
      triggerType: 'daily',
      enabled: true,
    })
    createdTaskIds.push(task1.id)

    await taskService.createDailyTrigger({
      taskId: task1.id,
      startTime: '09:00',
      intervalDays: 1,
    })

    const task2 = await taskService.createTask({
      name: 'test-task-all-2',
      executablePath: 'calc.exe',
      triggerType: 'weekly',
      enabled: false,
    })
    createdTaskIds.push(task2.id)

    await taskService.createWeeklyTrigger({
      taskId: task2.id,
      startTime: '10:00',
      daysOfWeek: '1,3,5',
    })

    const task3 = await taskService.createTask({
      name: 'test-task-all-3',
      executablePath: 'cmd.exe',
      triggerType: 'once',
      enabled: true,
    })
    createdTaskIds.push(task3.id)

    await taskService.createOnceTrigger({
      taskId: task3.id,
      startTime: '2026-12-31 23:59',
    })

    // 步骤2: 验证任务已创建
    const tasksBeforeDelete = await taskService.getAllTasks()
    expect(tasksBeforeDelete.length).to.be.at.least(3)

    // 步骤3: 删除所有任务（使用 --force 跳过确认）
    const {stdout} = await runCommand(['task', 'delete', '--all', '--force'])

    // 步骤4: 验证删除成功
    expect(stdout).to.contain('已删除')
    expect(stdout).to.match(/\d+/)

    // 步骤5: 验证数据库中没有任务
    const tasksAfterDelete = await taskService.getAllTasks()
    expect(tasksAfterDelete.length).to.equal(0)

    // 清空已删除的任务ID列表
    createdTaskIds.length = 0
  })

})
