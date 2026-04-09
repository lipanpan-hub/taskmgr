import { eq } from 'drizzle-orm'
import { getDb } from '../../db/index.js'
import { tasks, type NewTask, type Task } from '../../db/schema.js'

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
  // #endregion

  // #region 创建操作
  async createTask(newTask: NewTask): Promise<Task> {
    const result = await this.db.insert(tasks).values(newTask).returning()
    return result[0]
  }
  // #endregion

  // #region 更新操作
  async updateTask(id: number, updateData: Partial<NewTask>): Promise<Task | null> {
    const data = { ...updateData, updatedAt: new Date().toISOString() }
    const result = await this.db.update(tasks).set(data).where(eq(tasks.id, id)).returning()
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
