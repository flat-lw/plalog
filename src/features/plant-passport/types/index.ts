import type { GrowthEventType } from '@/db/models'

export interface PlantPassport {
  version: 1
  exportedAt: string
  app: 'plalog'

  exportedBy: {
    displayName?: string
    contact?: string
  }

  plant: {
    species?: string
    acquiredAt?: string
    notes?: string
  }

  summary: {
    managementDays: number
    wateringCount: number
    avgWateringInterval: number
    repottingCount: number
    floweringCount: number
  }

  environment?: {
    tempMin: number
    tempMax: number
    tempAvg: number
    humidityAvg?: number
    placement?: string
  }

  growthEvents: {
    date: string
    type: GrowthEventType
    notes?: string
  }[]

  floweringRecords: {
    year: number
    budDate?: string
    bloomDate?: string
    endDate?: string
    notes?: string
  }[]

  wateringStats: {
    periodFrom: string
    periodTo: string
    totalCount: number
    monthlyAverage: number
  }
}

export interface ExportOptions {
  includeSummary: boolean
  includeGrowthEvents: boolean
  includeFloweringRecords: boolean
  includeEnvironment: boolean
  exportJson: boolean
  exportPdf: boolean
  publicNotes?: string
}

export interface ExportResult {
  jsonBlob?: Blob
  pdfBlob?: Blob
  fileName: string
}
