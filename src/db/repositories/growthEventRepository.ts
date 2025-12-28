import { db } from '../database'
import type { GrowthEvent } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const growthEventRepository = {
  async getByPlantId(plantId: string): Promise<GrowthEvent[]> {
    return db.growthEvents.where('plantId').equals(plantId).reverse().sortBy('timestamp')
  },

  async create(data: Omit<GrowthEvent, 'id'>): Promise<string> {
    const id = uuidv4()
    await db.growthEvents.add({
      ...data,
      id,
    })
    return id
  },

  async delete(id: string): Promise<void> {
    await db.growthEvents.delete(id)
  },
}
