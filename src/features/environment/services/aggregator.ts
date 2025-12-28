import { v4 as uuidv4 } from 'uuid'
import { startOfHour, format } from 'date-fns'
import type { EnvironmentLog, DailyEnvironmentSummary, DataSourceType } from '@/db/models'
import type { RawEnvironmentRecord } from '../types'

function average(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

export function aggregateToHourly(
  records: RawEnvironmentRecord[],
  locationId: string,
  source: DataSourceType
): EnvironmentLog[] {
  // 時間ごとにグループ化
  const grouped = new Map<string, RawEnvironmentRecord[]>()

  for (const record of records) {
    const hourKey = format(startOfHour(record.timestamp), "yyyy-MM-dd'T'HH:00:00")
    if (!grouped.has(hourKey)) {
      grouped.set(hourKey, [])
    }
    grouped.get(hourKey)!.push(record)
  }

  // 各時間の平均を計算
  const hourlyLogs: EnvironmentLog[] = []
  const now = new Date()

  for (const [hourKey, items] of grouped) {
    const temps = items.map((i) => i.temperature)
    const humidities = items
      .map((i) => i.humidity)
      .filter((h): h is number => h !== undefined)

    hourlyLogs.push({
      id: uuidv4(),
      locationId,
      timestamp: new Date(hourKey),
      temperature: average(temps),
      humidity: humidities.length > 0 ? average(humidities) : undefined,
      source,
      createdAt: now,
      updatedAt: now,
    })
  }

  return hourlyLogs.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
}

export function aggregateToDaily(
  records: RawEnvironmentRecord[],
  locationId: string,
  source: DataSourceType
): DailyEnvironmentSummary[] {
  // 日ごとにグループ化
  const grouped = new Map<string, RawEnvironmentRecord[]>()

  for (const record of records) {
    const dateKey = format(record.timestamp, 'yyyy-MM-dd')
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(record)
  }

  // 各日の統計を計算
  const dailySummaries: DailyEnvironmentSummary[] = []
  const now = new Date()

  for (const [dateKey, items] of grouped) {
    const temps = items.map((i) => i.temperature)
    const humidities = items
      .map((i) => i.humidity)
      .filter((h): h is number => h !== undefined)

    dailySummaries.push({
      id: uuidv4(),
      locationId,
      date: dateKey,
      tempMax: Math.max(...temps),
      tempMin: Math.min(...temps),
      tempAvg: average(temps),
      humidityMax: humidities.length > 0 ? Math.max(...humidities) : undefined,
      humidityMin: humidities.length > 0 ? Math.min(...humidities) : undefined,
      humidityAvg: humidities.length > 0 ? average(humidities) : undefined,
      dataPoints: items.length,
      source,
      createdAt: now,
      updatedAt: now,
    })
  }

  return dailySummaries.sort((a, b) => a.date.localeCompare(b.date))
}
