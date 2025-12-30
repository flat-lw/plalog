# plalog 環境データ連携仕様書

## 概要

本ドキュメントは、plalogにおける環境データ（気温・湿度）の外部連携機能を定義する。

### 目的

- 環境データの蓄積と長期分析
- 過去データのインポートによる履歴の確保
- 複数のデータソースに対応し、拡張性を確保

### 基本方針

- **蓄積重視**: リアルタイム性よりも長期データの蓄積を優先
- **CSVインポート**: 各種センサーからエクスポートしたデータを取り込み
- **2層構造**: 時間粒度（1時間）と日粒度（最高・最低・平均）で保存

### 対応データソース

| データソース | 対応状況 | 優先度 |
|--------------|----------|--------|
| SwitchBot CSVインポート | Phase 1 | 高 |
| 天気API（Open-Meteo） | Phase 2 | 中 |
| SwitchBot API連携 | Phase 3 | 低 |
| Home Assistant | Phase 4 | 低 |

---

## データ粒度

### 2層構造

長期利用を想定し、時間粒度と日粒度の2層でデータを保存する。

```
┌─────────────────────────────────────────────────────────────┐
│                    CSVインポート                            │
│           （5分/15分/30分/1時間 など様々な粒度）             │
└─────────────────────────────┬───────────────────────────────┘
                              ↓ 集約
┌─────────────────────────────────────────────────────────────┐
│  EnvironmentLog（時間粒度）                                  │
│  • 1時間ごとの平均値                                        │
│  • 10:00, 11:00, 12:00 ... のように丸める                   │
│  • 詳細な傾向分析用                                         │
└─────────────────────────────┬───────────────────────────────┘
                              ↓ 集約
┌─────────────────────────────────────────────────────────────┐
│  DailyEnvironmentSummary（日粒度）                           │
│  • 日ごとの最高・最低・平均                                  │
│  • 長期トレンド・季節比較用                                  │
└─────────────────────────────────────────────────────────────┘
```

### データ量見積もり（1場所あたり）

| 期間 | EnvironmentLog | DailyEnvironmentSummary |
|------|----------------|-------------------------|
| 1年 | 8,760件 | 365件 |
| 5年 | 43,800件 | 1,825件 |
| 10年 | 87,600件 | 3,650件 |

5場所×10年でも時間データ約44万件、日データ約1.8万件。IndexedDBで十分扱える。

### 集約ルール

| 元データの粒度 | 1時間への集約方法 |
|----------------|-------------------|
| 1分間隔 | 60件の平均 |
| 5分間隔 | 12件の平均 |
| 15分間隔 | 4件の平均 |
| 30分間隔 | 2件の平均 |
| 1時間間隔 | そのまま |

---

## アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                         plalog                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  ImportManager                      │    │
│  │                                                     │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌───────────┐   │    │
│  │   │ SwitchBot   │  │ Inkbird     │  │ Generic   │   │    │
│  │   │ CSV Parser  │  │ CSV Parser  │  │ CSV Parser│   │    │
│  │   └──────┬──────┘  └──────┬──────┘  └─────┬─────┘   │    │
│  │          └────────────────┼───────────────┘         │    │
│  │                           ↓                         │    │
│  │                    Aggregator                       │    │
│  │                    (時間・日集約)                    │    │
│  │                           ↓                         │    │
│  │          ┌────────────────┴────────────────┐        │    │
│  │          ↓                                 ↓        │    │
│  │   EnvironmentLog              DailyEnvironmentSummary   │
│  │   (時間粒度)                        (日粒度)            │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                        IndexedDB                            │
└─────────────────────────────────────────────────────────────┘
```

### データフロー

```
1. ユーザーがCSVファイルを選択
2. CSVフォーマットを自動判定
3. 対応するParserで生データを抽出
4. Aggregatorで1時間粒度に集約
5. EnvironmentLogに保存
6. 日ごとに集約してDailyEnvironmentSummaryに保存
7. 結果をUIに表示
```

---

## 共通インターフェース

### データ型定義

```typescript
// src/features/environment/types/index.ts

// データソースの種別
type DataSourceType = 
  | 'switchbot-csv'
  | 'inkbird-csv'
  | 'generic-csv'
  | 'manual'
  | 'open-meteo'
  | 'switchbot-api'
  | 'home-assistant'

// 生データ（CSVパース後）
interface RawEnvironmentRecord {
  timestamp: Date
  temperature: number
  humidity?: number
}

// 時間粒度データ
interface EnvironmentLog {
  id: string
  locationId: string
  recordedAt: Date        // 時間単位（例: 2024-12-28T10:00:00）
  temperature: number     // ℃（平均値）
  humidity?: number       // %（平均値）
  source: DataSourceType
  createdAt: Date
  updatedAt: Date
}

// 日粒度データ
interface DailyEnvironmentSummary {
  id: string
  locationId: string
  date: string            // "2024-12-28"（YYYY-MM-DD形式）
  
  // 気温
  tempMax: number         // 最高気温
  tempMin: number         // 最低気温
  tempAvg: number         // 平均気温
  
  // 湿度
  humidityMax?: number    // 最高湿度
  humidityMin?: number    // 最低湿度
  humidityAvg?: number    // 平均湿度
  
  // メタ情報
  dataPoints: number      // 元データ件数（24件なら完全なデータ）
  source: DataSourceType
  
  createdAt: Date
  updatedAt: Date
}

// インポート結果
interface ImportResult {
  success: boolean
  hourlyRecords: number   // 保存した時間データ件数
  dailyRecords: number    // 保存した日データ件数
  skipped: number         // スキップ件数（重複など）
  errors: string[]        // エラーメッセージ
  dateRange: {
    from: string
    to: string
  }
}
```

### CSVパーサーインターフェース

```typescript
// src/features/environment/types/csvParser.ts

interface CsvParser {
  // フォーマット名
  name: string
  
  // このパーサーで処理できるか判定
  canParse(header: string): boolean
  
  // CSVをパース
  parse(content: string): RawEnvironmentRecord[]
}
```

---

## Phase 1: SwitchBot CSVインポート

### SwitchBotアプリでのエクスポート手順

1. SwitchBotアプリを開く
2. 温湿度計デバイスを選択
3. 右上の「履歴」または「データエクスポート」
4. 期間を選択（最大1年）
5. 「エクスポート」→ CSVファイルを保存

### CSVフォーマット

```csv
Date,Temperature_Celsius(℃),Relative_Humidity(%),DPT(℃),VPD(kPa),Abs Humidity(g/m³)
2025-03-08 22:20,22.4,50,11.5,1.35,9.93
2025-03-08 22:21,24.1,39,9.3,1.83,8.53
2025-03-08 22:22,25.3,39,10.3,1.97,9.13
...
```

| カラム | 説明 | 使用 |
|--------|------|------|
| Date | 日時（YYYY-MM-DD HH:mm） | ✅ |
| Temperature_Celsius(℃) | 気温 | ✅ |
| Relative_Humidity(%) | 相対湿度 | ✅ |
| DPT(℃) | 露点温度 | ❌ |
| VPD(kPa) | 飽差 | ❌（将来対応検討） |
| Abs Humidity(g/m³) | 絶対湿度 | ❌ |

### SwitchBot CSVパーサー

SwitchBotアプリからエクスポートされるCSVフォーマットに対応。

```typescript
// src/features/environment/services/parsers/switchbotParser.ts

export const switchbotParser: CsvParser = {
  name: 'SwitchBot',

  canParse(header: string): boolean {
    // SwitchBotのヘッダーフォーマットを検出
    return header.includes('Temperature_Celsius') &&
           header.includes('Relative_Humidity')
  },

  parse(content: string): RawEnvironmentRecord[] {
    const lines = content.trim().split('\n')
    const records: RawEnvironmentRecord[] = []

    // ヘッダーからカラムインデックスを特定
    const header = lines[0].split(',')
    const dateIdx = header.findIndex(h => h.trim() === 'Date')
    const tempIdx = header.findIndex(h => h.includes('Temperature_Celsius'))
    const humidityIdx = header.findIndex(h => h.includes('Relative_Humidity'))

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue

      const cols = line.split(',')
      const timestamp = new Date(cols[dateIdx])

      // 無効な日付をスキップ
      if (isNaN(timestamp.getTime())) continue

      records.push({
        timestamp,
        temperature: parseFloat(cols[tempIdx]),
        humidity: parseFloat(cols[humidityIdx]),
      })
    }

    return records
  },
}
```

**注意**: 大量データ（数万件）のインポート時にスタックオーバーフローを避けるため、実装ではループベースの集計を使用しています。

---

## 集約処理

### 時間集約（1時間単位）

```typescript
// src/features/environment/services/aggregator.ts

import { startOfHour, format } from 'date-fns'

function aggregateToHourly(
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
  
  for (const [hourKey, items] of grouped) {
    const temps = items.map(i => i.temperature)
    const humidities = items.map(i => i.humidity).filter(h => h !== undefined)
    
    hourlyLogs.push({
      id: uuidv4(),
      locationId,
      recordedAt: new Date(hourKey),
      temperature: average(temps),
      humidity: humidities.length > 0 ? average(humidities) : undefined,
      source,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  return hourlyLogs.sort((a, b) => 
    a.recordedAt.getTime() - b.recordedAt.getTime()
  )
}

function average(values: number[]): number {
  return Math.round(
    (values.reduce((a, b) => a + b, 0) / values.length) * 10
  ) / 10
}
```

### 日集約

```typescript
function aggregateToDaily(
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
  
  for (const [dateKey, items] of grouped) {
    const temps = items.map(i => i.temperature)
    const humidities = items.map(i => i.humidity).filter(h => h !== undefined)
    
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
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
  
  return dailySummaries.sort((a, b) => a.date.localeCompare(b.date))
}
```

### インポート処理全体

```typescript
// src/features/environment/services/importService.ts

async function importCsv(
  file: File,
  locationId: string
): Promise<ImportResult> {
  const content = await file.text()
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
  
  await db.transaction('rw', [db.environmentLogs, db.dailyEnvironmentSummaries], async () => {
    // 時間データの保存（重複はスキップ）
    for (const log of hourlyLogs) {
      const existing = await db.environmentLogs
        .where(['locationId', 'recordedAt'])
        .equals([locationId, log.recordedAt])
        .first()
      
      if (existing) {
        skipped++
      } else {
        await db.environmentLogs.add(log)
      }
    }
    
    // 日データの保存（重複は上書き）
    for (const summary of dailySummaries) {
      const existing = await db.dailyEnvironmentSummaries
        .where(['locationId', 'date'])
        .equals([locationId, summary.date])
        .first()
      
      if (existing) {
        await db.dailyEnvironmentSummaries.update(existing.id, summary)
      } else {
        await db.dailyEnvironmentSummaries.add(summary)
      }
    }
  })
  
  return {
    success: true,
    hourlyRecords: hourlyLogs.length - skipped,
    dailyRecords: dailySummaries.length,
    skipped,
    errors: [],
    dateRange: {
      from: dailySummaries[0]?.date ?? '',
      to: dailySummaries[dailySummaries.length - 1]?.date ?? '',
    },
  }
}

function selectParser(header: string): CsvParser | null {
  const parsers = [switchbotParser, /* 将来: inkbirdParser, ... */]
  return parsers.find(p => p.canParse(header)) ?? null
}
```

---

## データベース拡張

### Dexieスキーマ更新

```typescript
// src/db/database.ts

this.version(2).stores({
  // 既存テーブル
  plants: 'id, name, isActive, createdAt',
  locations: 'id, name, isActive, createdAt',
  plantLocationHistory: 'id, plantId, locationId, movedAt',
  wateringLogs: 'id, locationId, wateredAt',
  growthEvents: 'id, plantId, eventType, eventDate',
  floweringRecords: 'id, plantId, budDate, bloomDate',
  
  // 更新: EnvironmentLog（複合インデックス追加）
  environmentLogs: 'id, locationId, recordedAt, [locationId+recordedAt]',
  
  // 新規: DailyEnvironmentSummary
  dailyEnvironmentSummaries: 'id, locationId, date, [locationId+date]',
})
```

### テーブル定義まとめ

| テーブル | 用途 | レコード量 |
|----------|------|------------|
| EnvironmentLog | 1時間ごとのデータ | 多い |
| DailyEnvironmentSummary | 日ごとの集約 | 少ない |

---

## UI設計

### 設定画面への導線

```
ハンバーガーメニュー
├── データエクスポート
├── データインポート
├── Google Drive 同期
├── 環境データインポート    ← 追加
└── このアプリについて
```

### 環境データインポート画面

```
┌─────────────────────────────────┐
│ ← 環境データインポート    ≡     │
├─────────────────────────────────┤
│                                 │
│  SwitchBotなどの温湿度計から    │
│  エクスポートしたCSVファイルを   │
│  取り込んで環境データを記録します │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  対応フォーマット               │
│  • SwitchBot 温湿度計           │
│  • （今後対応予定）              │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  取り込み先の場所 *             │
│  ┌───────────────────────────┐  │
│  │ ベランダ               ▼ │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  📁 CSVファイルを選択     │  │
│  └───────────────────────────┘  │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  💡 SwitchBotアプリから         │
│     CSVをエクスポートする方法   │
│     > 詳細を見る                │
│                                 │
└─────────────────────────────────┘
```

### プレビュー画面（ファイル選択後）

```
┌─────────────────────────────────┐
│ ← 環境データインポート    ≡     │
├─────────────────────────────────┤
│                                 │
│  📄 switchbot_export.csv        │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  検出されたフォーマット          │
│  SwitchBot 温湿度計             │
│                                 │
│  取り込み先                     │
│  ベランダ                       │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  データ概要                     │
│  ┌───────────────────────────┐  │
│  │ 期間: 2024/11/01〜12/28   │  │
│  │ 元データ: 8,352件         │  │
│  │                           │  │
│  │ 変換後:                   │  │
│  │  時間データ: 1,392件       │  │
│  │  日データ: 58件            │  │
│  └───────────────────────────┘  │
│                                 │
│  ⚠️ 既存データと重複する時間帯は │
│    スキップされます             │
│                                 │
│  ┌───────────────────────────┐  │
│  │       インポート実行       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 完了画面

```
┌─────────────────────────────────┐
│ ← 環境データインポート    ≡     │
├─────────────────────────────────┤
│                                 │
│            ✅                   │
│     インポート完了              │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  結果                           │
│  ┌───────────────────────────┐  │
│  │ 時間データ: 1,392件 追加   │  │
│  │ 日データ: 58件 追加        │  │
│  │ スキップ: 24件（重複）     │  │
│  │                           │  │
│  │ 期間: 2024/11/01〜12/28   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   ベランダの詳細を見る     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   続けてインポート         │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 場所詳細画面の環境データ表示

```
┌─────────────────────────────────┐
│ ← ベランダ              編集   │
├─────────────────────────────────┤
│                                 │
│  説明: 南向き、日当たり良好      │
│                                 │
├─────────────────────────────────┤
│  📊 環境データ                  │
│                                 │
│  今日 (12/28)                   │
│  🌡 最高 28.0℃ / 最低 22.5℃    │
│  💧 最高 65% / 最低 55%         │
│  📈 24件のデータ                │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  過去7日間                      │
│  ┌───────────────────────────┐  │
│  │ 12/27  🌡 25.0/20.5℃      │  │
│  │        💧 62/55%          │  │
│  ├───────────────────────────┤  │
│  │ 12/26  🌡 24.5/19.0℃      │  │
│  │        💧 60/52%          │  │
│  ├───────────────────────────┤  │
│  │ 12/25  🌡 26.0/21.0℃      │  │
│  │        💧 58/50%          │  │
│  └───────────────────────────┘  │
│  ...                            │
│                                 │
│  ┌───────────────────────────┐  │
│  │    📥 CSVをインポート      │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### エクスポート方法の説明モーダル

```
┌─────────────────────────────────┐
│  SwitchBotからCSVエクスポート   │
├─────────────────────────────────┤
│                                 │
│  1. SwitchBotアプリを開く       │
│                                 │
│  2. 温湿度計デバイスをタップ     │
│                                 │
│  3. 右上の「履歴」をタップ       │
│                                 │
│  4. 「エクスポート」をタップ     │
│                                 │
│  5. 期間を選択                  │
│     （最大1年分まで）            │
│                                 │
│  6. 「確認」でCSVを保存          │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  💡 定期的にエクスポートして     │
│     plalogにインポートすると     │
│     データが蓄積されます        │
│                                 │
│  ┌───────────────────────────┐  │
│  │          閉じる           │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

## エラーハンドリング

| エラー | 原因 | 表示 |
|--------|------|------|
| フォーマット不明 | 対応外のCSV | 「対応していないCSV形式です」 |
| データなし | 空のCSV | 「データが見つかりませんでした」 |
| パースエラー | 不正な値 | 「N行目: データの形式が不正です」 |
| 日付エラー | 日時パース失敗 | 「N行目: 日時を読み取れません」 |

---

## 実装ファイル構成

```
src/features/environment/
├── components/
│   └── ExportHelpModal.tsx        # エクスポート方法説明
├── hooks/
│   └── useCsvImport.ts            # インポート処理フック
├── pages/
│   └── CsvImportPage.tsx          # インポート画面
├── services/
│   ├── importService.ts           # インポート処理
│   ├── aggregator.ts              # 集約処理（時間・日）
│   └── parsers/
│       ├── index.ts               # パーサー管理
│       └── switchbotParser.ts     # SwitchBot CSV
├── types/
│   └── index.ts                   # 型定義
└── index.ts
```

---

## 実装状況

### 実装済み機能

| 機能 | 状態 | 備考 |
|------|------|------|
| SwitchBot CSVパーサー | ✅ 完了 | Temperature_Celsius, Relative_Humidity対応 |
| 時間粒度集約 | ✅ 完了 | 1時間単位の平均値 |
| 日粒度集約 | ✅ 完了 | 日単位の最高/最低/平均 |
| 重複チェック | ✅ 完了 | 時間データは重複スキップ |
| 大量データ対応 | ✅ 完了 | スタックオーバーフロー対策済み |
| プレビュー表示 | ✅ 完了 | データ概要・期間表示 |
| インポート結果表示 | ✅ 完了 | 追加/スキップ件数表示 |

### 未実装/将来対応

| 機能 | 状態 | 備考 |
|------|------|------|
| Inkbird CSVパーサー | 📋 計画中 | Phase 5 |
| Open-Meteo API連携 | 📋 計画中 | Phase 2 |
| SwitchBot API連携 | 📋 計画中 | Phase 3 |
| Home Assistant連携 | 📋 計画中 | Phase 4 |

---

## 拡張計画

### Phase 2: 天気API（Open-Meteo）

屋外の場所向けに、位置情報から気象データを取得。

```typescript
// 場所に緯度経度を設定し、自動取得
interface OpenMeteoConfig {
  locationId: string
  latitude: number
  longitude: number
}

// Open-Meteo APIから現在の気象データを取得
// 無料、APIキー不要
```

### Phase 3: SwitchBot API連携

CSVエクスポートの手間を省き、リアルタイムで現在値を取得。

```typescript
// Hub必須、トークン/シークレット必要
// 現在値のみ取得可能（履歴はCSVインポートを併用）
```

### Phase 4: Home Assistant連携

既存のHome Assistantセンサーから履歴を一括取得。

```typescript
interface HomeAssistantConfig {
  url: string              // http://homeassistant.local:8123
  token: string            // Long-lived access token
  temperatureEntity: string  // sensor.room_temperature
  humidityEntity?: string    // sensor.room_humidity
}
```

### Phase 5: その他のセンサー対応

| センサー | 形式 |
|----------|------|
| Inkbird | CSV |
| ThermoPro | CSV |
| Govee | CSV |

パーサーを追加することで対応可能。

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-12-28 | 1.0 | 初版作成 |
| 2024-12-28 | 1.1 | 2層構造（時間+日集約）採用、CSVインポート優先に変更 |
| 2024-12-30 | 1.2 | 実装状況セクション追加、ファイル構成を実装に合わせて更新、大量データ対応の注記追加 |
