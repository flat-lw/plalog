import { db } from '@/db/database'
import type { ExportData } from '@/db/models'

export async function getAllData(): Promise<ExportData['data']> {
  return {
    plants: await db.plants.toArray(),
    locations: await db.locations.toArray(),
    plantLocationHistory: await db.plantLocationHistory.toArray(),
    wateringLogs: await db.wateringLogs.toArray(),
    growthEvents: await db.growthEvents.toArray(),
    floweringRecords: await db.floweringRecords.toArray(),
    environmentLogs: await db.environmentLogs.toArray(),
    dailyEnvironmentSummaries: await db.dailyEnvironmentSummaries.toArray(),
  }
}

export async function exportData(): Promise<string> {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'plalog',
    data: await getAllData(),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadJson(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importDataFromObject(
  data: ExportData['data']
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.plants,
      db.locations,
      db.plantLocationHistory,
      db.wateringLogs,
      db.growthEvents,
      db.floweringRecords,
      db.environmentLogs,
      db.dailyEnvironmentSummaries,
    ],
    async () => {
      await Promise.all([
        db.plants.clear(),
        db.locations.clear(),
        db.plantLocationHistory.clear(),
        db.wateringLogs.clear(),
        db.growthEvents.clear(),
        db.floweringRecords.clear(),
        db.environmentLogs.clear(),
        db.dailyEnvironmentSummaries.clear(),
      ])

      await Promise.all([
        db.plants.bulkAdd(data.plants),
        db.locations.bulkAdd(data.locations),
        db.plantLocationHistory.bulkAdd(data.plantLocationHistory),
        db.wateringLogs.bulkAdd(data.wateringLogs),
        db.growthEvents.bulkAdd(data.growthEvents),
        db.floweringRecords.bulkAdd(data.floweringRecords),
        db.environmentLogs.bulkAdd(data.environmentLogs),
        data.dailyEnvironmentSummaries?.length > 0
          ? db.dailyEnvironmentSummaries.bulkAdd(data.dailyEnvironmentSummaries)
          : Promise.resolve(),
      ])
    }
  )
}

export async function importData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString)

  if (data.app !== 'plalog') {
    throw new Error('Invalid file format')
  }

  await db.transaction(
    'rw',
    [
      db.plants,
      db.locations,
      db.plantLocationHistory,
      db.wateringLogs,
      db.growthEvents,
      db.floweringRecords,
      db.environmentLogs,
      db.dailyEnvironmentSummaries,
    ],
    async () => {
      await Promise.all([
        db.plants.clear(),
        db.locations.clear(),
        db.plantLocationHistory.clear(),
        db.wateringLogs.clear(),
        db.growthEvents.clear(),
        db.floweringRecords.clear(),
        db.environmentLogs.clear(),
        db.dailyEnvironmentSummaries.clear(),
      ])

      await Promise.all([
        db.plants.bulkAdd(data.data.plants),
        db.locations.bulkAdd(data.data.locations),
        db.plantLocationHistory.bulkAdd(data.data.plantLocationHistory),
        db.wateringLogs.bulkAdd(data.data.wateringLogs),
        db.growthEvents.bulkAdd(data.data.growthEvents),
        db.floweringRecords.bulkAdd(data.data.floweringRecords),
        db.environmentLogs.bulkAdd(data.data.environmentLogs),
        data.data.dailyEnvironmentSummaries?.length > 0
          ? db.dailyEnvironmentSummaries.bulkAdd(data.data.dailyEnvironmentSummaries)
          : Promise.resolve(),
      ])
    }
  )
}
