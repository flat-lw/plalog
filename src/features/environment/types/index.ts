import type { DataSourceType } from '@/db/models'

// 生データ（CSVパース後）
export interface RawEnvironmentRecord {
  timestamp: Date
  temperature: number
  humidity?: number
}

// インポート結果
export interface ImportResult {
  success: boolean
  hourlyRecords: number
  dailyRecords: number
  skipped: number
  errors: string[]
  dateRange: {
    from: string
    to: string
  }
}

// インポートプレビュー
export interface ImportPreview {
  format: string
  rawRecords: number
  hourlyRecords: number
  dailyRecords: number
  dateRange: {
    from: string
    to: string
  }
}

// CSVパーサーインターフェース
export interface CsvParser {
  name: string
  canParse(header: string): boolean
  parse(content: string): RawEnvironmentRecord[]
}

export type { DataSourceType }
