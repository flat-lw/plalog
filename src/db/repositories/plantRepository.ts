import { db } from '../database'
import type { Plant } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const plantRepository = {
  async getAll(): Promise<Plant[]> {
    return db.plants.filter((p) => p.isActive).toArray()
  },

  async getById(id: string): Promise<Plant | undefined> {
    return db.plants.get(id)
  },

  async getByLocationId(locationId: string): Promise<Plant[]> {
    return db.plants
      .where('currentLocationId')
      .equals(locationId)
      .filter((p) => p.isActive)
      .toArray()
  },

  async create(
    data: Omit<Plant, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date()
    const id = uuidv4()
    await db.plants.add({
      ...data,
      id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },

  async update(id: string, data: Partial<Plant>): Promise<void> {
    await db.plants.update(id, {
      ...data,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.plants.update(id, {
      isActive: false,
      updatedAt: new Date(),
    })
  },
}
