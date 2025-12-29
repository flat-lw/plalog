export interface InheritedInfo {
  displayName?: string
  contact?: string
  managementDays: number
  importedAt: Date
}

export interface Plant {
  id: string
  name: string
  species?: string
  currentLocationId?: string
  plantedAt?: Date
  acquiredAt?: Date
  notes?: string
  isActive: boolean
  isDead?: boolean
  inheritedFrom?: InheritedInfo
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string // 'default'
  displayName?: string
  contact?: string
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface PlantLocationHistory {
  id: string
  plantId: string
  locationId: string
  movedAt: Date
  notes?: string
}

export interface WateringLog {
  id: string
  plantId: string
  timestamp: Date
  amount?: number
  batchId?: string
  notes?: string
}

export type GrowthEventType =
  | 'seed'
  | 'germination'
  | 'transplant'
  | 'harvest'
  | 'dormancy_start'
  | 'dormancy_end'
  | 'death'
  | 'other'

export const GROWTH_EVENT_LABELS: Record<GrowthEventType, string> = {
  seed: '播種',
  germination: '発芽',
  transplant: '植え替え',
  harvest: '収穫',
  dormancy_start: '休眠開始',
  dormancy_end: '休眠終了',
  death: '枯死',
  other: 'その他',
}

export interface GrowthEvent {
  id: string
  plantId: string
  timestamp: Date
  eventType: GrowthEventType
  notes?: string
}

export interface FloweringRecord {
  id: string
  plantId: string
  budDate?: Date
  floweringDate?: Date
  wiltedDate?: Date
  fruitRipeDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type DataSourceType =
  | 'switchbot-csv'
  | 'inkbird-csv'
  | 'generic-csv'
  | 'manual'
  | 'open-meteo'
  | 'switchbot-api'
  | 'home-assistant'

export interface EnvironmentLog {
  id: string
  locationId: string
  timestamp: Date
  temperature?: number
  humidity?: number
  source?: DataSourceType
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface DailyEnvironmentSummary {
  id: string
  locationId: string
  date: string // "YYYY-MM-DD"
  tempMax: number
  tempMin: number
  tempAvg: number
  humidityMax?: number
  humidityMin?: number
  humidityAvg?: number
  dataPoints: number
  source: DataSourceType
  createdAt: Date
  updatedAt: Date
}

export interface ExportData {
  version: number
  exportedAt: string
  app: 'plalog'
  data: {
    plants: Plant[]
    locations: Location[]
    plantLocationHistory: PlantLocationHistory[]
    wateringLogs: WateringLog[]
    growthEvents: GrowthEvent[]
    floweringRecords: FloweringRecord[]
    environmentLogs: EnvironmentLog[]
    dailyEnvironmentSummaries: DailyEnvironmentSummary[]
  }
}
