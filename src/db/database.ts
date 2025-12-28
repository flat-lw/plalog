import Dexie, { Table } from 'dexie'
import type {
  Plant,
  Location,
  PlantLocationHistory,
  WateringLog,
  GrowthEvent,
  FloweringRecord,
  EnvironmentLog,
} from './models'

export class GardenDatabase extends Dexie {
  plants!: Table<Plant>
  locations!: Table<Location>
  plantLocationHistory!: Table<PlantLocationHistory>
  wateringLogs!: Table<WateringLog>
  growthEvents!: Table<GrowthEvent>
  floweringRecords!: Table<FloweringRecord>
  environmentLogs!: Table<EnvironmentLog>

  constructor() {
    super('plalog')

    this.version(1).stores({
      plants: 'id, name, currentLocationId',
      locations: 'id, name',
      plantLocationHistory: 'id, plantId, locationId, movedAt, [plantId+movedAt]',
      wateringLogs: 'id, plantId, timestamp, batchId, [plantId+timestamp]',
      growthEvents: 'id, plantId, timestamp, eventType, [plantId+timestamp]',
      floweringRecords: 'id, plantId, budDate, floweringDate, [plantId+budDate], [plantId+floweringDate]',
      environmentLogs: 'id, locationId, timestamp, [locationId+timestamp]',
    })
  }
}

export const db = new GardenDatabase()
