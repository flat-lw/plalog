import { db } from '../database'
import type { FloweringRecord } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const floweringRepository = {
  async getByPlantId(plantId: string): Promise<FloweringRecord[]> {
    const records = await db.floweringRecords.where('plantId').equals(plantId).toArray()
    return records.sort((a, b) => {
      const dateA = a.budDate ?? a.floweringDate ?? a.createdAt
      const dateB = b.budDate ?? b.floweringDate ?? b.createdAt
      return dateB.getTime() - dateA.getTime()
    })
  },

  async getById(id: string): Promise<FloweringRecord | undefined> {
    return db.floweringRecords.get(id)
  },

  async create(
    data: Omit<FloweringRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date()
    const id = uuidv4()
    await db.floweringRecords.add({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },

  async update(id: string, data: Partial<FloweringRecord>): Promise<void> {
    await db.floweringRecords.update(id, {
      ...data,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.floweringRecords.delete(id)
  },
}
