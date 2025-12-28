import { db } from '../database'
import type { WateringLog } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const wateringRepository = {
  async getByPlantId(plantId: string): Promise<WateringLog[]> {
    return db.wateringLogs.where('plantId').equals(plantId).reverse().sortBy('timestamp')
  },

  async getLatestByPlantId(plantId: string): Promise<WateringLog | undefined> {
    const logs = await db.wateringLogs
      .where('plantId')
      .equals(plantId)
      .reverse()
      .sortBy('timestamp')
    return logs[0]
  },

  async create(data: Omit<WateringLog, 'id'>): Promise<string> {
    const id = uuidv4()
    await db.wateringLogs.add({
      ...data,
      id,
    })
    return id
  },

  async createBatch(
    plantIds: string[],
    timestamp: Date,
    notes?: string
  ): Promise<string> {
    const batchId = uuidv4()
    const logs: WateringLog[] = plantIds.map((plantId) => ({
      id: uuidv4(),
      plantId,
      timestamp,
      batchId,
      notes,
    }))
    await db.wateringLogs.bulkAdd(logs)
    return batchId
  },

  async delete(id: string): Promise<void> {
    await db.wateringLogs.delete(id)
  },

  async update(
    id: string,
    data: Partial<Omit<WateringLog, 'id'>>
  ): Promise<void> {
    await db.wateringLogs.update(id, data)
  },

  async getAll(): Promise<WateringLog[]> {
    return db.wateringLogs.reverse().sortBy('timestamp')
  },
}
