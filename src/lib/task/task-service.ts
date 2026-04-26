import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { 
  tasks, 
  dailyTriggers,
  weeklyTriggers,
  monthlyTriggers,
  onceTriggers,
  type NewTask, 
  type Task,
  type DailyTrigger,
  type WeeklyTrigger,
  type MonthlyTrigger,
  type OnceTrigger,
  type NewDailyTrigger,
  type NewWeeklyTrigger,
  type NewMonthlyTrigger,
  type NewOnceTrigger
} from '../../db/schema.js'

export class TaskService {
  private db = getDb()

  // #region 查询操作
  async getAllTasks(): Promise<Task[]> {
    return await this.db.select().from(tasks)
  }

  async getTaskById(id: number): Promise<Task | null> {
    const result = await this.db.select().from(tasks).where(eq(tasks.id, id))
    return result[0] || null
  }

  async getTaskByName(name: string): Promise<Task | null> {
    const result = await this.db.select().from(tasks).where(eq(tasks.name, name))
    return result[0] || null
  }

  async getDailyTriggerByTaskId(taskId: number): Promise<DailyTrigger | null> {
    const result = await this.db.select().from(dailyTriggers).where(eq(dailyTriggers.taskId, taskId))
    return result[0] || null
  }

  async getWeeklyTriggerByTaskId(taskId: number): Promise<WeeklyTrigger | null> {
    const result = await this.db.select().from(weeklyTriggers).where(eq(weeklyTriggers.taskId, taskId))
    return result[0] || null
  }

  async getMonthlyTriggerByTaskId(taskId: number): Promise<MonthlyTrigger | null> {
    const result = await this.db.select().from(monthlyTriggers).where(eq(monthlyTriggers.taskId, taskId))
    return result[0] || null
  }

  async getOnceTriggerByTaskId(taskId: number): Promise<OnceTrigger | null> {
    const result = await this.db.select().from(onceTriggers).where(eq(onceTriggers.taskId, taskId))
    return result[0] || null
  }
  // #endregion

  // #region 创建操作
  async createTask(newTask: NewTask): Promise<Task> {
    // returning() 返回插入的记录数组 Task[]，取第一个元素即为新创建的任务
    const result = await this.db.insert(tasks).values(newTask).returning()
    return result[0]
  }

  async createDailyTrigger(newTrigger: NewDailyTrigger): Promise<DailyTrigger> {
    const result = await this.db.insert(dailyTriggers).values(newTrigger).returning()
    return result[0]
  }

  async createWeeklyTrigger(newTrigger: NewWeeklyTrigger): Promise<WeeklyTrigger> {
    const result = await this.db.insert(weeklyTriggers).values(newTrigger).returning()
    return result[0]
  }

  async createMonthlyTrigger(newTrigger: NewMonthlyTrigger): Promise<MonthlyTrigger> {
    const result = await this.db.insert(monthlyTriggers).values(newTrigger).returning()
    return result[0]
  }

  async createOnceTrigger(newTrigger: NewOnceTrigger): Promise<OnceTrigger> {
    const result = await this.db.insert(onceTriggers).values(newTrigger).returning()
    return result[0]
  }
  // #endregion

  // #region 更新操作
  async updateTask(id: number, updateData: Partial<NewTask>): Promise<Task | null> {
    const data = { ...updateData, updatedAt: new Date().toISOString() }
    const result = await this.db.update(tasks).set(data).where(eq(tasks.id, id)).returning()
    return result[0] || null
  }

  async updateDailyTrigger(id: number, updateData: Partial<NewDailyTrigger>): Promise<DailyTrigger | null> {
    const result = await this.db.update(dailyTriggers).set(updateData).where(eq(dailyTriggers.id, id)).returning()
    return result[0] || null
  }

  async updateWeeklyTrigger(id: number, updateData: Partial<NewWeeklyTrigger>): Promise<WeeklyTrigger | null> {
    const result = await this.db.update(weeklyTriggers).set(updateData).where(eq(weeklyTriggers.id, id)).returning()
    return result[0] || null
  }

  async updateMonthlyTrigger(id: number, updateData: Partial<NewMonthlyTrigger>): Promise<MonthlyTrigger | null> {
    const result = await this.db.update(monthlyTriggers).set(updateData).where(eq(monthlyTriggers.id, id)).returning()
    return result[0] || null
  }

  async updateOnceTrigger(id: number, updateData: Partial<NewOnceTrigger>): Promise<OnceTrigger | null> {
    const result = await this.db.update(onceTriggers).set(updateData).where(eq(onceTriggers.id, id)).returning()
    return result[0] || null
  }
  // #endregion

  // #region 删除操作
  async deleteTask(id: number): Promise<Task | null> {
    const result = await this.db.delete(tasks).where(eq(tasks.id, id)).returning()
    return result[0] || null
  }

  async deleteTaskByName(name: string): Promise<Task | null> {
    const result = await this.db.delete(tasks).where(eq(tasks.name, name)).returning()
    return result[0] || null
  }

  async deleteAllTasks(): Promise<Task[]> {
    return await this.db.delete(tasks).returning()
  }
  // #endregion
}
