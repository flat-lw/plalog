# 園芸アプリ データベース仕様書

## 概要

本ドキュメントは、園芸管理PWAアプリケーションのデータベース設計を定義する。

### 基本方針

- **ローカルファースト**: データはユーザーのブラウザ（IndexedDB）に保存
- **オフライン対応**: ネットワーク接続なしで動作
- **拡張性**: 後からテーブル・フィールドを追加可能
- **同期対応**: 将来的にGoogle Drive等への同期を想定

### 技術スタック

- **データベース**: IndexedDB
- **ORMラッパー**: Dexie.js
- **型定義**: TypeScript

---

## エンティティ関連図

```
Location（場所）
    │
    ├──< EnvironmentLog（環境データ）
    │
    └──< PlantLocationHistory（移動履歴）>── Plant（植物）
                                                │
                                                ├──< WateringLog（水やり記録）
                                                │
                                                ├──< GrowthEvent（成長イベント）
                                                │
                                                └──< FloweringRecord（開花記録）
```

---

## テーブル定義

### 1. Plant（植物）

管理対象の植物を表す。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| name | string | ✓ | ユーザーが付ける名前 |
| species | string | | 種名・品種名 |
| currentLocationId | string | | 現在の場所ID |
| plantedAt | Date | | 植え付け日 |
| acquiredAt | Date | | 入手日 |
| notes | string | | メモ |
| isActive | boolean | ✓ | 管理中かどうか（デフォルト: true） |
| isDead | boolean | | 枯死状態（デフォルト: false） |
| inheritedFrom | InheritedInfo | | Plant Passportからの引き継ぎ情報 |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`, `name`, `species`, `currentLocationId`, `isActive`

#### InheritedInfo（引き継ぎ情報）

Plant Passportからインポートした場合に設定される。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| displayName | string | | 前の管理者の表示名 |
| contact | string | | 前の管理者の連絡先 |
| managementDays | number | ✓ | 前の管理日数 |
| importedAt | Date | ✓ | インポート日時 |

---

### 2. Location（場所）

植物を置く場所を表す。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| name | string | ✓ | 場所名（例: ベランダ、室内窓際） |
| description | string | | 説明・補足情報 |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`, `name`

---

### 3. PlantLocationHistory（植物移動履歴）

植物がいつどの場所に移動したかを記録する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| plantId | string | ✓ | 植物ID（外部キー） |
| locationId | string | ✓ | 場所ID（外部キー） |
| movedAt | Date | ✓ | 移動日時 |
| notes | string | | 移動理由などのメモ |

**インデックス**: `id`, `plantId`, `locationId`, `movedAt`, `[plantId+movedAt]`

**用途**: 過去のある時点で植物がどの場所にいたかを特定し、その場所の環境データと紐付ける。

---

### 4. WateringLog（水やり記録）

水やりの実施を記録する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| plantId | string | ✓ | 植物ID（外部キー） |
| timestamp | Date | ✓ | 水やり日時 |
| amount | number | | 水の量（ml） |
| batchId | string | | 一括入力時のグループID |
| notes | string | | メモ |

**インデックス**: `id`, `plantId`, `timestamp`, `batchId`, `[plantId+timestamp]`

**batchIdについて**: 複数の植物に同時に水やりした場合、同じbatchIdを付与することで一括操作として記録できる。

---

### 5. GrowthEvent（成長イベント）

植物の成長に関するイベントを記録する。開花関連のイベントはFloweringRecordで管理する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| plantId | string | ✓ | 植物ID（外部キー） |
| timestamp | Date | ✓ | イベント発生日時 |
| eventType | GrowthEventType | ✓ | イベント種別 |
| notes | string | | メモ |

**インデックス**: `id`, `plantId`, `timestamp`, `eventType`, `[plantId+timestamp]`

#### GrowthEventType（成長イベント種別）

| 値 | 説明 |
|----|------|
| seed | 播種 |
| germination | 発芽 |
| transplant | 植え替え |
| harvest | 収穫 |
| dormancy_start | 休眠開始 |
| dormancy_end | 休眠終了 |
| death | 枯死 |
| other | その他 |

**注意**: 開花関連（蕾、開花、結実）はFloweringRecordで管理するため、GrowthEventTypeには含まない。

---

### 6. FloweringRecord（開花記録）

開花サイクルを1レコードで管理する。1株が年に複数回咲く場合は、サイクルごとに別レコードとなる。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| plantId | string | ✓ | 植物ID（外部キー） |
| budDate | Date | | 蕾確認日 |
| floweringDate | Date | | 開花日 |
| wiltedDate | Date | | 花が枯れた日 |
| fruitRipeDate | Date | | 果実が熟した日 |
| notes | string | | メモ |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`, `plantId`, `budDate`, `floweringDate`, `[plantId+budDate]`, `[plantId+floweringDate]`

#### 運用フロー

```
1. 蕾を発見     → 新規レコード作成（budDateのみ）
2. 開花した     → 同じレコードにfloweringDateを追加
3. 花が枯れた   → wiltedDateを追加
4. 果実が熟した → fruitRipeDateを追加
```

#### 想定されるパターン

| パターン | 記録される日付 |
|----------|----------------|
| 観葉植物の開花 | budDate → floweringDate → wiltedDate |
| 果樹の結実 | budDate → floweringDate → wiltedDate → fruitRipeDate |
| 開花から記録開始 | floweringDate → wiltedDate |
| 蕾のまま落ちた | budDate のみ（notesに記録） |

---

### 7. EnvironmentLog（環境データ）

場所ごとの環境データを記録する（1時間粒度）。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| locationId | string | ✓ | 場所ID（外部キー） |
| timestamp | Date | ✓ | 記録日時（1時間単位に丸め） |
| temperature | number | | 気温（℃、平均値） |
| humidity | number | | 湿度（%、平均値） |
| source | DataSourceType | | データソース |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`, `locationId`, `timestamp`, `[locationId+timestamp]`

#### DataSourceType（データソース種別）

| 値 | 説明 |
|----|------|
| switchbot-csv | SwitchBotからのCSVインポート |
| inkbird-csv | InkbirdからのCSVインポート |
| generic-csv | 汎用CSVインポート |
| manual | 手入力 |
| open-meteo | Open-Meteo API（将来対応） |
| switchbot-api | SwitchBot API（将来対応） |
| home-assistant | Home Assistant連携（将来対応） |

---

### 8. DailyEnvironmentSummary（日別環境サマリー）

日ごとの環境データを集約して保存する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 一意識別子（UUID） |
| locationId | string | ✓ | 場所ID（外部キー） |
| date | string | ✓ | 日付（"YYYY-MM-DD"形式） |
| tempMax | number | ✓ | 最高気温（℃） |
| tempMin | number | ✓ | 最低気温（℃） |
| tempAvg | number | ✓ | 平均気温（℃） |
| humidityMax | number | | 最高湿度（%） |
| humidityMin | number | | 最低湿度（%） |
| humidityAvg | number | | 平均湿度（%） |
| dataPoints | number | ✓ | 元データ件数（24件なら完全なデータ） |
| source | DataSourceType | ✓ | データソース |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`, `locationId`, `date`, `[locationId+date]`

---

### 9. UserProfile（ユーザープロフィール）

Plant Passportエクスポート時に使用する表示名などを保存する。

| フィールド | 型 | 必須 | 説明 |
|------------|-----|------|------|
| id | string | ✓ | 固定値 'default' |
| displayName | string | | 表示名 |
| contact | string | | 連絡先（SNSアカウントなど） |
| createdAt | Date | ✓ | 作成日時 |
| updatedAt | Date | ✓ | 更新日時 |

**インデックス**: `id`

---

## Dexieスキーマ定義

```typescript
import Dexie, { Table } from 'dexie'

// 型定義
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
  id: string  // 固定値 'default'
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
  createdAt: Date
  updatedAt: Date
}

export interface DailyEnvironmentSummary {
  id: string
  locationId: string
  date: string  // "YYYY-MM-DD"
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
    userProfile: UserProfile[]
  }
}

// データベースクラス
export class PlalogDatabase extends Dexie {
  plants!: Table<Plant>
  locations!: Table<Location>
  plantLocationHistory!: Table<PlantLocationHistory>
  wateringLogs!: Table<WateringLog>
  growthEvents!: Table<GrowthEvent>
  floweringRecords!: Table<FloweringRecord>
  environmentLogs!: Table<EnvironmentLog>
  dailyEnvironmentSummaries!: Table<DailyEnvironmentSummary>
  userProfile!: Table<UserProfile>

  constructor() {
    super('plalog')

    // Version 1: 初期スキーマ
    this.version(1).stores({
      plants: 'id, name, species, currentLocationId, isActive',
      locations: 'id, name',
      plantLocationHistory: 'id, plantId, locationId, movedAt, [plantId+movedAt]',
      wateringLogs: 'id, plantId, timestamp, batchId, [plantId+timestamp]',
      growthEvents: 'id, plantId, timestamp, eventType, [plantId+timestamp]',
      floweringRecords: 'id, plantId, budDate, floweringDate, [plantId+budDate], [plantId+floweringDate]',
      environmentLogs: 'id, locationId, timestamp, [locationId+timestamp]'
    })

    // Version 2: 日別環境サマリー追加
    this.version(2).stores({
      plants: 'id, name, species, currentLocationId, isActive',
      locations: 'id, name',
      plantLocationHistory: 'id, plantId, locationId, movedAt, [plantId+movedAt]',
      wateringLogs: 'id, plantId, timestamp, batchId, [plantId+timestamp]',
      growthEvents: 'id, plantId, timestamp, eventType, [plantId+timestamp]',
      floweringRecords: 'id, plantId, budDate, floweringDate, [plantId+budDate], [plantId+floweringDate]',
      environmentLogs: 'id, locationId, timestamp, [locationId+timestamp]',
      dailyEnvironmentSummaries: 'id, locationId, date, [locationId+date]'
    })

    // Version 3: ユーザープロフィール追加
    this.version(3).stores({
      plants: 'id, name, species, currentLocationId, isActive',
      locations: 'id, name',
      plantLocationHistory: 'id, plantId, locationId, movedAt, [plantId+movedAt]',
      wateringLogs: 'id, plantId, timestamp, batchId, [plantId+timestamp]',
      growthEvents: 'id, plantId, timestamp, eventType, [plantId+timestamp]',
      floweringRecords: 'id, plantId, budDate, floweringDate, [plantId+budDate], [plantId+floweringDate]',
      environmentLogs: 'id, locationId, timestamp, [locationId+timestamp]',
      dailyEnvironmentSummaries: 'id, locationId, date, [locationId+date]',
      userProfile: 'id'
    })
  }
}

export const db = new PlalogDatabase()
```

---

## クエリ例

### 特定の植物の水やり履歴を取得

```typescript
const logs = await db.wateringLogs
  .where('plantId')
  .equals(plantId)
  .reverse()
  .sortBy('timestamp')
```

### 特定の場所にいる植物一覧を取得

```typescript
const plants = await db.plants
  .where('currentLocationId')
  .equals(locationId)
  .and(plant => plant.isActive)
  .toArray()
```

### 特定時点での植物の場所を特定

```typescript
async function getLocationAt(plantId: string, date: Date): Promise<string | null> {
  const history = await db.plantLocationHistory
    .where('[plantId+movedAt]')
    .between([plantId, Dexie.minKey], [plantId, date])
    .last()
  
  return history?.locationId ?? null
}
```

### 特定期間の環境データを取得

```typescript
const logs = await db.environmentLogs
  .where('[locationId+timestamp]')
  .between([locationId, startDate], [locationId, endDate])
  .toArray()
```

### 特定の植物の開花記録を取得（新しい順）

```typescript
const records = await db.floweringRecords
  .where('plantId')
  .equals(plantId)
  .toArray()

// budDate または floweringDate で降順ソート
records.sort((a, b) => {
  const dateA = a.budDate ?? a.floweringDate ?? a.createdAt
  const dateB = b.budDate ?? b.floweringDate ?? b.createdAt
  return dateB.getTime() - dateA.getTime()
})
```

### 今年開花した植物を取得

```typescript
const thisYear = new Date().getFullYear()
const startOfYear = new Date(thisYear, 0, 1)
const endOfYear = new Date(thisYear, 11, 31, 23, 59, 59)

const records = await db.floweringRecords
  .where('floweringDate')
  .between(startOfYear, endOfYear)
  .toArray()

const plantIds = [...new Set(records.map(r => r.plantId))]
const plants = await db.plants.bulkGet(plantIds)
```

### 進行中の開花サイクルを取得（蕾あり、まだ枯れていない）

```typescript
const inProgress = await db.floweringRecords
  .filter(r => r.budDate != null && r.wiltedDate == null)
  .toArray()
```

---

## 拡張計画

### 将来追加予定のテーブル

| テーブル名 | 用途 | 優先度 |
|------------|------|--------|
| FertilizerLog | 肥料記録 | 中 |
| PestLog | 病害虫記録 | 中 |
| PruningLog | 剪定記録 | 低 |
| SoilChangeLog | 土替え記録 | 低 |
| CostLog | 費用記録 | 低 |
| ImageReference | 外部画像参照 | 中 |

### 将来追加予定のフィールド

| テーブル | フィールド | 用途 |
|----------|------------|------|
| Plant | imageUrl | 外部ストレージの画像参照 |
| Plant | tags | タグ付け |
| GrowthEvent | imageUrl | イベント時の写真 |
| FloweringRecord | imageUrls | 各段階の写真（配列） |

---

## バージョン管理方針

1. **新規テーブル追加**: バージョン番号を上げてstoresに追加
2. **フィールド追加**: インデックス不要ならバージョン変更不要
3. **インデックス追加**: バージョン番号を上げて定義を更新
4. **データ移行**: upgradeコールバックで既存データを変換

### バージョン更新例

```typescript
// v2: 肥料記録を追加
this.version(2).stores({
  plants: 'id, name, currentLocationId',
  locations: 'id, name',
  plantLocationHistory: 'id, plantId, locationId, movedAt, [plantId+movedAt]',
  wateringLogs: 'id, plantId, timestamp, batchId, [plantId+timestamp]',
  growthEvents: 'id, plantId, timestamp, eventType, [plantId+timestamp]',
  floweringRecords: 'id, plantId, budDate, floweringDate, [plantId+budDate], [plantId+floweringDate]',
  environmentLogs: 'id, locationId, timestamp, [locationId+timestamp]',
  fertilizerLogs: 'id, plantId, timestamp, type, [plantId+timestamp]'  // 新規
})
```

---

## データ同期（将来実装）

### Google Drive連携

- App Dataフォルダに全データをJSON形式でエクスポート
- 差分同期ではなく全体同期（シンプルな実装）
- 競合時は「最終更新日時が新しい方を優先」

### エクスポート/インポート形式

```typescript
interface ExportData {
  version: number
  exportedAt: Date
  plants: Plant[]
  locations: Location[]
  plantLocationHistory: PlantLocationHistory[]
  wateringLogs: WateringLog[]
  growthEvents: GrowthEvent[]
  floweringRecords: FloweringRecord[]
  environmentLogs: EnvironmentLog[]
}
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-12-28 | 1.0 | 初版作成 |
| 2024-12-28 | 1.1 | FloweringRecord追加、GrowthEventTypeから開花関連を分離 |
| 2024-12-30 | 1.2 | 実装に合わせて更新: isDead/inheritedFromフィールド追加、DailyEnvironmentSummary・UserProfileテーブル追加、DataSourceType定義、ExportData型追加、Dexieスキーマをv3に更新 |
