import { db } from '@/db/database'
import type { Plant, UserProfile } from '@/db/models'
import type { PlantPassport, ExportOptions } from '../types'
import { format, differenceInDays } from 'date-fns'

export async function buildPlantPassport(
  plant: Plant,
  options: ExportOptions
): Promise<PlantPassport> {
  const userProfile = await getUserProfile()
  const wateringLogs = await db.wateringLogs
    .where('plantId')
    .equals(plant.id)
    .sortBy('timestamp')
  const growthEvents = await db.growthEvents
    .where('plantId')
    .equals(plant.id)
    .sortBy('timestamp')
  const floweringRecords = await db.floweringRecords
    .where('plantId')
    .equals(plant.id)
    .toArray()

  const now = new Date()
  const acquiredAt = plant.acquiredAt || plant.createdAt
  const managementDays = differenceInDays(now, acquiredAt)

  // 水やり統計
  const wateringCount = wateringLogs.length
  const avgWateringInterval =
    wateringCount > 1
      ? Math.round(managementDays / wateringCount)
      : 0

  // 植え替え回数
  const repottingCount = growthEvents.filter(
    (e) => e.eventType === 'transplant'
  ).length

  // 開花回数
  const floweringCount = floweringRecords.filter(
    (r) => r.floweringDate
  ).length

  // 水やり期間
  const firstWatering = wateringLogs[0]?.timestamp
  const lastWatering = wateringLogs[wateringLogs.length - 1]?.timestamp
  const monthsOfData = firstWatering && lastWatering
    ? Math.max(1, differenceInDays(lastWatering, firstWatering) / 30)
    : 1

  const passport: PlantPassport = {
    version: 1,
    exportedAt: now.toISOString(),
    app: 'plalog',
    exportedBy: {
      displayName: userProfile?.displayName,
      contact: userProfile?.contact,
    },
    plant: {
      name: plant.name,
      species: plant.species,
      acquiredAt: acquiredAt ? format(acquiredAt, 'yyyy-MM-dd') : undefined,
      notes: options.publicNotes,
    },
    summary: {
      managementDays,
      wateringCount,
      avgWateringInterval,
      repottingCount,
      floweringCount,
    },
    growthEvents: options.includeGrowthEvents
      ? growthEvents.map((e) => ({
          date: format(e.timestamp, 'yyyy-MM-dd'),
          type: e.eventType,
          notes: e.notes,
        }))
      : [],
    floweringRecords: options.includeFloweringRecords
      ? floweringRecords.map((r) => ({
          year: r.floweringDate
            ? new Date(r.floweringDate).getFullYear()
            : new Date(r.createdAt).getFullYear(),
          budDate: r.budDate ? format(r.budDate, 'yyyy-MM-dd') : undefined,
          bloomDate: r.floweringDate
            ? format(r.floweringDate, 'yyyy-MM-dd')
            : undefined,
          endDate: r.wiltedDate
            ? format(r.wiltedDate, 'yyyy-MM-dd')
            : undefined,
          notes: r.notes,
        }))
      : [],
    wateringStats: {
      periodFrom: firstWatering
        ? format(firstWatering, 'yyyy-MM-dd')
        : format(acquiredAt, 'yyyy-MM-dd'),
      periodTo: lastWatering
        ? format(lastWatering, 'yyyy-MM-dd')
        : format(now, 'yyyy-MM-dd'),
      totalCount: wateringCount,
      monthlyAverage: Math.round((wateringCount / monthsOfData) * 10) / 10,
    },
  }

  // 環境データ
  if (options.includeEnvironment && plant.currentLocationId) {
    const envData = await getEnvironmentSummary(plant.currentLocationId)
    if (envData) {
      passport.environment = envData
    }
  }

  return passport
}

async function getUserProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.get('default')
}

async function getEnvironmentSummary(
  locationId: string
): Promise<PlantPassport['environment'] | undefined> {
  const summaries = await db.dailyEnvironmentSummaries
    .where('locationId')
    .equals(locationId)
    .toArray()

  if (summaries.length === 0) {
    return undefined
  }

  const temps = summaries.map((s) => s.tempAvg)
  const tempMax = Math.max(...summaries.map((s) => s.tempMax))
  const tempMin = Math.min(...summaries.map((s) => s.tempMin))
  const tempAvg = Math.round(
    (temps.reduce((a, b) => a + b, 0) / temps.length) * 10
  ) / 10

  const humidities = summaries
    .filter((s) => s.humidityAvg !== undefined)
    .map((s) => s.humidityAvg!)

  const humidityAvg =
    humidities.length > 0
      ? Math.round(
          (humidities.reduce((a, b) => a + b, 0) / humidities.length) * 10
        ) / 10
      : undefined

  // 場所の情報を取得
  const location = await db.locations.get(locationId)

  return {
    tempMin,
    tempMax,
    tempAvg,
    humidityAvg,
    placement: location?.name,
  }
}

export function passportToJson(passport: PlantPassport): string {
  return JSON.stringify(passport, null, 2)
}
