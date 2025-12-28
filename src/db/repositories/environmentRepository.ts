import { db } from '../database'
import type { EnvironmentLog } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const environmentRepository = {
  async getByLocationId(locationId: string): Promise<EnvironmentLog[]> {
    return db.environmentLogs
      .where('locationId')
      .equals(locationId)
      .reverse()
      .sortBy('timestamp')
  },

  async getLatestByLocationId(locationId: string): Promise<EnvironmentLog | undefined> {
    const logs = await db.environmentLogs
      .where('locationId')
      .equals(locationId)
      .reverse()
      .sortBy('timestamp')
    return logs[0]
  },

  async create(data: Omit<EnvironmentLog, 'id'>): Promise<string> {
    const id = uuidv4()
    await db.environmentLogs.add({
      ...data,
      id,
    })
    return id
  },

  async delete(id: string): Promise<void> {
    await db.environmentLogs.delete(id)
  },
}
