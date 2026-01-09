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

      // 日付フィールドをDateオブジェクトに変換してからインポート
      const normalizedPlants = data.plants.map(p => {
        const normalized = normalizeDates(p, ['plantedAt', 'acquiredAt', 'createdAt', 'updatedAt'])
        if (normalized.inheritedFrom?.importedAt) {
          normalized.inheritedFrom.importedAt = new Date(normalized.inheritedFrom.importedAt)
        }
        return normalized
      })

      const normalizedLocations = data.locations.map(l =>
        normalizeDates(l, ['createdAt', 'updatedAt'])
      )

      const normalizedPlantLocationHistory = data.plantLocationHistory.map(h =>
        normalizeDates(h, ['movedAt'])
      )

      const normalizedWateringLogs = data.wateringLogs.map(w =>
        normalizeDates(w, ['timestamp'])
      )

      const normalizedGrowthEvents = data.growthEvents.map(g =>
        normalizeDates(g, ['timestamp'])
      )

      const normalizedFloweringRecords = data.floweringRecords.map(f =>
        normalizeDates(f, ['budDate', 'floweringDate', 'wiltedDate', 'fruitRipeDate', 'createdAt', 'updatedAt'])
      )

      const normalizedEnvironmentLogs = data.environmentLogs.map(e =>
        normalizeDates(e, ['timestamp', 'createdAt', 'updatedAt'])
      )

      const normalizedDailySummaries = data.dailyEnvironmentSummaries?.map(s =>
        normalizeDates(s, ['createdAt', 'updatedAt'])
      ) || []

      await Promise.all([
        db.plants.bulkAdd(normalizedPlants),
        db.locations.bulkAdd(normalizedLocations),
        db.plantLocationHistory.bulkAdd(normalizedPlantLocationHistory),
        db.wateringLogs.bulkAdd(normalizedWateringLogs),
        db.growthEvents.bulkAdd(normalizedGrowthEvents),
        db.floweringRecords.bulkAdd(normalizedFloweringRecords),
        db.environmentLogs.bulkAdd(normalizedEnvironmentLogs),
        normalizedDailySummaries.length > 0
          ? db.dailyEnvironmentSummaries.bulkAdd(normalizedDailySummaries)
          : Promise.resolve(),
      ])
    }
  )
}

// 日付フィールドをDateオブジェクトに変換するヘルパー関数
function normalizeDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const normalized = { ...obj }
  for (const field of dateFields) {
    if (normalized[field]) {
      normalized[field] = new Date(normalized[field] as any) as any
    }
  }
  return normalized
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

      // 日付フィールドをDateオブジェクトに変換してからインポート
      const normalizedPlants = data.data.plants.map(p => {
        const normalized = normalizeDates(p, ['plantedAt', 'acquiredAt', 'createdAt', 'updatedAt'])
        if (normalized.inheritedFrom?.importedAt) {
          normalized.inheritedFrom.importedAt = new Date(normalized.inheritedFrom.importedAt)
        }
        return normalized
      })

      const normalizedLocations = data.data.locations.map(l =>
        normalizeDates(l, ['createdAt', 'updatedAt'])
      )

      const normalizedPlantLocationHistory = data.data.plantLocationHistory.map(h =>
        normalizeDates(h, ['movedAt'])
      )

      const normalizedWateringLogs = data.data.wateringLogs.map(w =>
        normalizeDates(w, ['timestamp'])
      )

      const normalizedGrowthEvents = data.data.growthEvents.map(g =>
        normalizeDates(g, ['timestamp'])
      )

      const normalizedFloweringRecords = data.data.floweringRecords.map(f =>
        normalizeDates(f, ['budDate', 'floweringDate', 'wiltedDate', 'fruitRipeDate', 'createdAt', 'updatedAt'])
      )

      const normalizedEnvironmentLogs = data.data.environmentLogs.map(e =>
        normalizeDates(e, ['timestamp', 'createdAt', 'updatedAt'])
      )

      const normalizedDailySummaries = data.data.dailyEnvironmentSummaries?.map(s =>
        normalizeDates(s, ['createdAt', 'updatedAt'])
      ) || []

      await Promise.all([
        db.plants.bulkAdd(normalizedPlants),
        db.locations.bulkAdd(normalizedLocations),
        db.plantLocationHistory.bulkAdd(normalizedPlantLocationHistory),
        db.wateringLogs.bulkAdd(normalizedWateringLogs),
        db.growthEvents.bulkAdd(normalizedGrowthEvents),
        db.floweringRecords.bulkAdd(normalizedFloweringRecords),
        db.environmentLogs.bulkAdd(normalizedEnvironmentLogs),
        normalizedDailySummaries.length > 0
          ? db.dailyEnvironmentSummaries.bulkAdd(normalizedDailySummaries)
          : Promise.resolve(),
      ])
    }
  )
}
