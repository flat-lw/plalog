import { db } from '@/db/database'
import type { DataSourceType } from '@/db/models'
import type { ImportResult, ImportPreview, RawEnvironmentRecord } from '../types'
import { selectParser } from './parsers'
import { aggregateToHourly, aggregateToDaily } from './aggregator'

export async function previewCsv(
  content: string
): Promise<ImportPreview | null> {
  const lines = content.split('\n')
  const header = lines[0]

  const parser = selectParser(header)
  if (!parser) {
    return null
  }

  const rawRecords = parser.parse(content)
  if (rawRecords.length === 0) {
    return null
  }

  // プレビュー用に集約数を計算
  const hourlyCount = countHourlyRecords(rawRecords)
  const dailyCount = countDailyRecords(rawRecords)

  const dates = rawRecords.map((r) => r.timestamp.getTime())
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  return {
    format: parser.name,
    rawRecords: rawRecords.length,
    hourlyRecords: hourlyCount,
    dailyRecords: dailyCount,
    dateRange: {
      from: formatDate(minDate),
      to: formatDate(maxDate),
    },
  }
}

export async function importCsv(
  content: string,
  locationId: string
): Promise<ImportResult> {
  const lines = content.split('\n')
  const header = lines[0]

  // パーサーを自動選択
  const parser = selectParser(header)
  if (!parser) {
    return {
      success: false,
      hourlyRecords: 0,
      dailyRecords: 0,
      skipped: 0,
      errors: ['対応していないCSV形式です'],
      dateRange: { from: '', to: '' },
    }
  }

  // パース
  const rawRecords = parser.parse(content)

  if (rawRecords.length === 0) {
    return {
      success: false,
      hourlyRecords: 0,
      dailyRecords: 0,
      skipped: 0,
      errors: ['データが見つかりませんでした'],
      dateRange: { from: '', to: '' },
    }
  }

  // 集約
  const source = `${parser.name.toLowerCase()}-csv` as DataSourceType
  const hourlyLogs = aggregateToHourly(rawRecords, locationId, source)
  const dailySummaries = aggregateToDaily(rawRecords, locationId, source)

  // 重複チェック＆保存
  let skipped = 0
  let savedHourly = 0
  let savedDaily = 0

  await db.transaction(
    'rw',
    [db.environmentLogs, db.dailyEnvironmentSummaries],
    async () => {
      // 時間データの保存（重複はスキップ）
      for (const log of hourlyLogs) {
        const existing = await db.environmentLogs
          .where('[locationId+timestamp]')
          .equals([locationId, log.timestamp])
          .first()

        if (existing) {
          skipped++
        } else {
          await db.environmentLogs.add(log)
          savedHourly++
        }
      }

      // 日データの保存（重複は上書き）
      for (const summary of dailySummaries) {
        const existing = await db.dailyEnvironmentSummaries
          .where('[locationId+date]')
          .equals([locationId, summary.date])
          .first()

        if (existing) {
          await db.dailyEnvironmentSummaries.update(existing.id, {
            ...summary,
            id: existing.id,
          })
        } else {
          await db.dailyEnvironmentSummaries.add(summary)
        }
        savedDaily++
      }
    }
  )

  return {
    success: true,
    hourlyRecords: savedHourly,
    dailyRecords: savedDaily,
    skipped,
    errors: [],
    dateRange: {
      from: dailySummaries[0]?.date ?? '',
      to: dailySummaries[dailySummaries.length - 1]?.date ?? '',
    },
  }
}

function countHourlyRecords(records: RawEnvironmentRecord[]): number {
  const hours = new Set<string>()
  for (const record of records) {
    const hourKey = `${record.timestamp.getFullYear()}-${record.timestamp.getMonth()}-${record.timestamp.getDate()}-${record.timestamp.getHours()}`
    hours.add(hourKey)
  }
  return hours.size
}

function countDailyRecords(records: RawEnvironmentRecord[]): number {
  const days = new Set<string>()
  for (const record of records) {
    const dayKey = `${record.timestamp.getFullYear()}-${record.timestamp.getMonth()}-${record.timestamp.getDate()}`
    days.add(dayKey)
  }
  return days.size
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}
