import { db } from '../database'
import type { Location } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const locationRepository = {
  async getAll(): Promise<Location[]> {
    return db.locations.toArray()
  },

  async getById(id: string): Promise<Location | undefined> {
    return db.locations.get(id)
  },

  async create(data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const id = uuidv4()
    await db.locations.add({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },

  async update(id: string, data: Partial<Location>): Promise<void> {
    await db.locations.update(id, {
      ...data,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    await db.locations.delete(id)
  },
}
