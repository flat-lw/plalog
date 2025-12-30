# plalog システムフロー図

## 目次
1. [全体システムフロー](#1-全体システムフロー)
2. [処理フェーズ分割](#2-処理フェーズ分割)
3. [詳細関数フロー](#3-詳細関数フロー)
4. [データフロー](#4-データフロー)
5. [関数一覧表](#5-関数一覧表)
6. [エラーハンドリング](#6-エラーハンドリング)
7. [シーケンス図](#7-シーケンス図)
8. [状態遷移図](#8-状態遷移図)

---

## 1. 全体システムフロー

### 1.1 ページ遷移フロー

```mermaid
graph TB
    subgraph "エントリーポイント"
        Start([アプリ起動]) --> Root["/"]
        Root --> Plants
    end

    subgraph "BottomTab ナビゲーション"
        Plants["/plants<br/>植物一覧"]
        Watering["/watering<br/>水やり"]
        Locations["/locations<br/>場所一覧"]
    end

    subgraph "植物関連ページ"
        Plants --> PlantDetail["/plants/:id<br/>植物詳細"]
        Plants --> AddPlant["植物追加モーダル"]
        PlantDetail --> SpeciesPage["/species/:species<br/>種別サマリー"]
        PlantDetail --> PlantPassport["/plants/:id/passport<br/>Plant Passport"]
        PlantDetail --> LocationDetail
    end

    subgraph "水やり関連ページ"
        Watering --> WateringHistory["/watering/history<br/>水やり履歴"]
    end

    subgraph "場所関連ページ"
        Locations --> LocationDetail["/locations/:id<br/>場所詳細"]
        Locations --> AddLocation["場所追加モーダル"]
    end

    subgraph "ハンバーガーメニュー"
        Menu["メニュー"]
        Menu --> Export["/settings/export<br/>エクスポート"]
        Menu --> Import["/settings/import<br/>インポート"]
        Menu --> GoogleDrive["/settings/google-drive<br/>Google Drive同期"]
        Menu --> EnvImport["/settings/environment-import<br/>環境データインポート"]
        Menu --> About["/about<br/>アプリについて"]
    end

    Plants -.-> Menu

    style Start fill:#e1f5fe
    style Plants fill:#c8e6c9
    style Watering fill:#c8e6c9
    style Locations fill:#c8e6c9
```

### 1.2 植物詳細ページ タブ構造

```mermaid
graph LR
    subgraph "植物詳細ページ /plants/:id"
        Info[/"植物情報<br/>- 枯死済み表示<br/>- 種名リンク<br/>- 場所リンク<br/>- 入手日<br/>- メモ"/]

        subgraph "タブ"
            WateringTab["水やりタブ<br/>記録追加・履歴"]
            FloweringTab["開花タブ<br/>蕾→開花→枯れ→結実"]
            EventsTab["イベントタブ<br/>播種/発芽/植替/収穫等"]
        end

        Export[\"エクスポートボタン<br/>Plant Passport"/]
    end

    Info --> WateringTab
    Info --> FloweringTab
    Info --> EventsTab
    Info -.-> Export
```

---

## 2. 処理フェーズ分割

### 2.1 アプリケーション初期化フェーズ

```mermaid
graph LR
    subgraph "Phase 1: アプリ起動"
        P1Input[/"Input:<br/>- ブラウザアクセス"/]
        P1Process["Vite/React初期化<br/>Service Worker登録"]
        P1Output[\"Output:<br/>- Reactアプリマウント"/]
        P1Side[/"副作用:<br/>- PWAキャッシュ更新"/]

        P1Input --> P1Process
        P1Process --> P1Output
        P1Process -.-> P1Side
    end

    subgraph "Phase 2: データベース初期化"
        P2Input[/"Input:<br/>- Dexieスキーマ"/]
        P2Process["IndexedDB接続<br/>マイグレーション実行"]
        P2Output[\"Output:<br/>- dbインスタンス"/]
        P2Side[/"副作用:<br/>- スキーマ更新"/]

        P2Input --> P2Process
        P2Process --> P2Output
        P2Process -.-> P2Side
    end

    subgraph "Phase 3: UI表示"
        P3Input[/"Input:<br/>- ルーティング情報<br/>- dbインスタンス"/]
        P3Process["useLiveQueryで<br/>データ購読開始"]
        P3Output[\"Output:<br/>- UIレンダリング"/]

        P3Input --> P3Process
        P3Process --> P3Output
    end
```

### 2.2 データ操作フェーズ

```mermaid
graph LR
    subgraph "Phase 1: ユーザー入力"
        D1Input[/"Input:<br/>- フォーム入力<br/>- ボタン操作"/]
        D1Process["バリデーション"]
        D1Output[\"Output:<br/>- 検証済みデータ"/]

        D1Input --> D1Process
        D1Process --> D1Output
    end

    subgraph "Phase 2: リポジトリ処理"
        D2Input[/"Input:<br/>- 検証済みデータ"/]
        D2Process["Repository関数実行<br/>（CRUD操作）"]
        D2Output[\"Output:<br/>- 操作結果"/]
        D2Side[/"副作用:<br/>- IndexedDB更新"/]

        D2Input --> D2Process
        D2Process --> D2Output
        D2Process -.-> D2Side
    end

    subgraph "Phase 3: UI更新"
        D3Input[/"Input:<br/>- DB変更イベント"/]
        D3Process["useLiveQuery<br/>自動再取得"]
        D3Output[\"Output:<br/>- UI再レンダリング"/]
        D3Side[/"副作用:<br/>- Toast表示"/]

        D3Input --> D3Process
        D3Process --> D3Output
        D3Process -.-> D3Side
    end
```

---

## 3. 詳細関数フロー

### 3.1 水やり記録フロー

```mermaid
graph TD
    subgraph "wateringRepository.recordWatering"
        Start([開始]) --> SelectMode{選択モード}

        SelectMode -->|場所選択| GetPlantsByLocation["場所の植物取得<br/>plantRepository.getByLocation()"]
        SelectMode -->|個別選択| SelectedPlants["選択された植物リスト"]

        GetPlantsByLocation --> CreateBatchId["batchId生成<br/>uuidv4()"]
        SelectedPlants --> CreateBatchId

        CreateBatchId --> Loop{植物ループ}
        Loop -->|各植物| CreateLog["WateringLog作成"]
        CreateLog --> SaveLog["db.wateringLogs.add()"]
        SaveLog --> Loop

        Loop -->|完了| UpdateStats["植物の最終水やり日更新"]
        UpdateStats --> End([完了])
    end

    CreateBatchId -->|"副作用"| SE1[/"batchIdで<br/>一括操作を識別"/]
    SaveLog -->|"副作用"| SE2[/"IndexedDB<br/>書き込み"/]

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style SelectMode fill:#fff3e0
```

### 3.2 環境データCSVインポートフロー

```mermaid
graph TD
    subgraph "importService.importCsv"
        Start([開始]) --> ReadFile["ファイル読み込み<br/>file.text()"]
        ReadFile --> ParseHeader["ヘッダー解析"]
        ParseHeader --> SelectParser{パーサー選択}

        SelectParser -->|SwitchBot| SwitchBotParser["switchbotParser.parse()"]
        SelectParser -->|不明| Error1["エラー: 未対応形式"]

        SwitchBotParser --> ValidateData{データ検証}
        ValidateData -->|空| Error2["エラー: データなし"]
        ValidateData -->|有効| AggregateHourly["時間粒度に集約<br/>aggregateToHourly()"]

        AggregateHourly --> AggregateDaily["日粒度に集約<br/>aggregateToDaily()"]

        AggregateDaily --> Transaction["トランザクション開始"]
        Transaction --> CheckDuplicate{重複チェック}

        CheckDuplicate -->|重複| Skip["スキップ"]
        CheckDuplicate -->|新規| SaveHourly["EnvironmentLog保存"]

        Skip --> NextRecord
        SaveHourly --> NextRecord{次のレコード}
        NextRecord -->|あり| CheckDuplicate
        NextRecord -->|なし| SaveDaily["DailyEnvironmentSummary保存<br/>（上書き更新）"]

        SaveDaily --> Commit["トランザクション完了"]
        Commit --> End([完了])

        Error1 --> ErrorEnd([エラー終了])
        Error2 --> ErrorEnd
    end

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
    style ErrorEnd fill:#ffebee
    style SelectParser fill:#fff3e0
    style ValidateData fill:#fff3e0
    style CheckDuplicate fill:#fff3e0
```

### 3.3 Plant Passportエクスポートフロー

```mermaid
graph TD
    subgraph "passportBuilder.buildPassport"
        Start([開始]) --> GetPlant["植物データ取得"]
        GetPlant --> GetProfile["ユーザープロフィール取得"]
        GetProfile --> GetWatering["水やり統計計算"]
        GetWatering --> GetEvents["成長イベント取得"]
        GetEvents --> GetFlowering["開花記録取得"]
        GetFlowering --> GetEnvironment["環境データ集計"]

        GetEnvironment --> BuildSummary["サマリー構築"]
        BuildSummary --> BuildPassport["PlantPassport構築"]
        BuildPassport --> End([完了])
    end

    subgraph "出力形式"
        BuildPassport --> JSON["JSON出力"]
        BuildPassport --> PDF["PDF生成<br/>pdfGenerator"]
    end

    style Start fill:#e1f5fe
    style End fill:#c8e6c9
```

---

## 4. データフロー

### 4.1 アーキテクチャ層

```mermaid
graph TB
    subgraph "UI Layer"
        Pages["Pages<br/>PlantListPage, PlantDetailPage,<br/>WateringPage, LocationDetailPage"]
        Components["Components<br/>PlantForm, PlantList,<br/>WateringTab, FloweringTab"]
        Modals["Modals<br/>追加・編集フォーム"]
    end

    subgraph "Hooks Layer"
        LiveQuery["useLiveQuery<br/>リアルタイムデータ購読"]
        Toast["useToast<br/>通知表示"]
        CsvImport["useCsvImport<br/>CSVパース・インポート"]
        GoogleDrive["useGoogleDriveSync<br/>Google Drive同期"]
        UserProfile["useUserProfile<br/>ユーザー設定"]
    end

    subgraph "Repository Layer"
        PlantRepo["plantRepository"]
        WateringRepo["wateringRepository"]
        LocationRepo["locationRepository"]
        EnvRepo["environmentRepository"]
        FloweringRepo["floweringRepository"]
        GrowthRepo["growthEventRepository"]
    end

    subgraph "Database (Dexie/IndexedDB)"
        Plants[(plants)]
        Locations[(locations)]
        WateringLogs[(wateringLogs)]
        FloweringRecords[(floweringRecords)]
        GrowthEvents[(growthEvents)]
        EnvironmentLogs[(environmentLogs)]
        DailySummaries[(dailyEnvironmentSummaries)]
        LocationHistory[(plantLocationHistory)]
        UserProfiles[(userProfile)]
    end

    UI --> Hooks
    Hooks --> Repository
    Repository --> Database

    style Pages fill:#e3f2fd
    style Components fill:#e3f2fd
    style Modals fill:#e3f2fd
```

### 4.2 環境データ取り込みフロー

```mermaid
graph LR
    subgraph "Input Data"
        CSV["SwitchBot CSV<br/>・Date<br/>・Temperature<br/>・Humidity"]
    end

    subgraph "Processing"
        Parser["CSVパーサー<br/>switchbotParser"]
        Hourly["時間集約<br/>aggregateToHourly"]
        Daily["日集約<br/>aggregateToDaily"]
    end

    subgraph "Output Data"
        EnvLog["EnvironmentLog<br/>・1時間単位<br/>・平均値"]
        DaySum["DailyEnvironmentSummary<br/>・日単位<br/>・最高/最低/平均"]
    end

    CSV --> Parser
    Parser --> Hourly
    Hourly --> EnvLog
    Parser --> Daily
    Daily --> DaySum

    EnvLog -.参照.-> DaySum
```

---

## 5. 関数一覧表

### 5.1 リポジトリ関数

| 関数名 | Input | Output | 副作用 | 説明 |
|--------|-------|--------|--------|------|
| **plantRepository.getAll** | - | Plant[] | - | アクティブな植物一覧を取得 |
| **plantRepository.getById** | id: string | Plant \| undefined | - | ID指定で植物を取得 |
| **plantRepository.create** | PlantInput | string (id) | DB書き込み | 新規植物を登録 |
| **plantRepository.update** | id, PlantUpdate | void | DB更新 | 植物情報を更新 |
| **plantRepository.delete** | id: string | void | DB更新 | 植物を論理削除 |
| **wateringRepository.record** | plantIds, notes? | batchId | DB書き込み | 水やりを記録 |
| **wateringRepository.getHistory** | plantId, limit? | WateringLog[] | - | 水やり履歴を取得 |
| **environmentRepository.importCsv** | file, locationId | ImportResult | DB書き込み | CSVデータをインポート |

### 5.2 サービス関数

| 関数名 | Input | Output | 副作用 | 説明 |
|--------|-------|--------|--------|------|
| **aggregateToHourly** | RawRecord[], locationId | EnvironmentLog[] | - | 生データを時間粒度に集約 |
| **aggregateToDaily** | RawRecord[], locationId | DailySummary[] | - | 生データを日粒度に集約 |
| **passportBuilder.build** | plantId | PlantPassport | - | Plant Passportデータを構築 |
| **pdfGenerator.generate** | PlantPassport | Blob | - | PDFファイルを生成 |
| **googleDriveService.upload** | data | void | Google Drive更新 | データをアップロード |
| **googleDriveService.download** | - | ExportData | - | データをダウンロード |

### 5.3 パーサー関数

| 関数名 | Input | Output | 副作用 | 説明 |
|--------|-------|--------|--------|------|
| **switchbotParser.canParse** | header: string | boolean | - | SwitchBot形式か判定 |
| **switchbotParser.parse** | content: string | RawRecord[] | - | CSVをパース |

---

## 6. エラーハンドリング

### 6.1 CSVインポートエラー処理

```mermaid
graph TD
    subgraph "エラー処理フロー"
        Normal[CSVインポート開始] --> Check{エラーチェック}
        Check -->|成功| Continue[処理継続]
        Check -->|エラー| ErrorType{エラー種別}

        ErrorType -->|フォーマット不明| FormatError["「対応していない<br/>CSV形式です」"]
        ErrorType -->|データなし| EmptyError["「データが<br/>見つかりません」"]
        ErrorType -->|パース失敗| ParseError["「N行目: データの<br/>形式が不正です」"]
        ErrorType -->|日付エラー| DateError["「N行目: 日時を<br/>読み取れません」"]

        FormatError --> Log[ログ記録]
        EmptyError --> Log
        ParseError --> Log
        DateError --> Log

        Log --> ShowError["Toast表示"]
        ShowError --> Recovery{リカバリ可能?}
        Recovery -->|Yes| Retry[再試行を促す]
        Recovery -->|No| Abort[処理中断]

        Continue --> Success[成功Toast表示]
    end

    style ErrorType fill:#ffebee
    style Recovery fill:#fff3e0
    style Success fill:#c8e6c9
```

### 6.2 Google Drive同期エラー処理

```mermaid
graph TD
    subgraph "Google Drive エラー処理"
        Sync[同期開始] --> AuthCheck{認証確認}

        AuthCheck -->|未認証| AuthError["認証エラー"]
        AuthCheck -->|認証済| NetworkCheck{ネットワーク}

        NetworkCheck -->|オフライン| NetworkError["通信エラー"]
        NetworkCheck -->|接続OK| Operation{操作}

        Operation -->|アップロード| Upload[アップロード処理]
        Operation -->|ダウンロード| Download[ダウンロード処理]

        Download --> FileCheck{ファイル確認}
        FileCheck -->|存在しない| NotFound["同期データが<br/>見つかりません"]
        FileCheck -->|存在| DataCheck{データ検証}

        DataCheck -->|不正| InvalidData["データを読み込め<br/>ませんでした"]
        DataCheck -->|正常| Success[同期成功]

        AuthError --> RetryAuth["再認証を促す"]
        NetworkError --> RetryNetwork["リトライを促す"]
        NotFound --> SuggestUpload["アップロードを促す"]
        InvalidData --> SuggestManual["手動エクスポート/<br/>インポートを案内"]
    end

    style AuthCheck fill:#fff3e0
    style NetworkCheck fill:#fff3e0
    style FileCheck fill:#fff3e0
    style DataCheck fill:#fff3e0
    style Success fill:#c8e6c9
```

---

## 7. シーケンス図

### 7.1 水やり記録シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as WateringPage
    participant Hook as useToast
    participant Repo as wateringRepository
    participant DB as IndexedDB

    User->>UI: 場所/植物を選択
    UI->>UI: 選択状態を更新

    User->>UI: 「水やりを記録」押下
    UI->>UI: 確認モーダル表示

    User->>UI: 「記録する」押下

    UI->>Repo: recordWatering(plantIds, notes)
    Repo->>Repo: batchId生成

    loop 各植物
        Repo->>DB: wateringLogs.add()
        DB-->>Repo: 保存完了
    end

    Repo-->>UI: batchId返却
    UI->>Hook: showToast("記録しました")
    Hook-->>User: Toast表示

    Note over UI,DB: useLiveQueryで自動更新
    DB-->>UI: データ変更通知
    UI-->>User: 画面更新
```

### 7.2 CSVインポートシーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as CsvImportPage
    participant Hook as useCsvImport
    participant Parser as switchbotParser
    participant Agg as aggregator
    participant DB as IndexedDB

    User->>UI: CSVファイル選択
    UI->>Hook: handleFileSelect(file)
    Hook->>Hook: file.text()

    Hook->>Parser: canParse(header)
    Parser-->>Hook: true/false

    alt パーサー見つかった
        Hook->>Parser: parse(content)
        Parser-->>Hook: RawRecord[]

        Hook->>UI: プレビュー表示
        User->>UI: 「インポート実行」押下

        Hook->>Agg: aggregateToHourly()
        Agg-->>Hook: EnvironmentLog[]

        Hook->>Agg: aggregateToDaily()
        Agg-->>Hook: DailySummary[]

        Hook->>DB: transaction開始

        loop 各時間データ
            Hook->>DB: 重複チェック
            alt 重複なし
                Hook->>DB: environmentLogs.add()
            end
        end

        loop 各日データ
            Hook->>DB: 既存確認
            alt 既存あり
                Hook->>DB: update()
            else 新規
                Hook->>DB: add()
            end
        end

        Hook->>DB: transaction完了
        Hook-->>UI: ImportResult
        UI-->>User: 結果表示
    else パーサー見つからない
        Hook-->>UI: エラー
        UI-->>User: エラー表示
    end
```

### 7.3 Google Drive同期シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as GoogleDriveSyncPage
    participant Hook as useGoogleDriveSync
    participant GIS as Google Identity Services
    participant API as Google Drive API
    participant DB as IndexedDB

    User->>UI: 「連携」ボタン押下
    UI->>Hook: connect()
    Hook->>GIS: OAuth認証リクエスト

    GIS-->>User: Googleログイン画面
    User->>GIS: ログイン・同意
    GIS-->>Hook: アクセストークン

    Hook-->>UI: 連携完了
    UI-->>User: 連携済み表示

    Note over User,API: アップロードフロー
    User->>UI: 「保存」ボタン押下
    UI->>Hook: upload()
    Hook->>DB: 全データ取得
    DB-->>Hook: ExportData
    Hook->>API: ファイル検索

    alt ファイル存在
        Hook->>API: PATCH (更新)
    else ファイルなし
        Hook->>API: POST (新規作成)
    end

    API-->>Hook: 成功
    Hook-->>UI: 完了
    UI-->>User: 成功Toast
```

---

## 8. 状態遷移図

### 8.1 植物の状態遷移

```mermaid
stateDiagram-v2
    [*] --> 管理中: 植物を登録

    管理中 --> 管理中: 水やり記録
    管理中 --> 管理中: イベント記録
    管理中 --> 管理中: 開花記録
    管理中 --> 管理中: 場所移動

    管理中 --> 枯死: isDead = true
    管理中 --> 非アクティブ: isActive = false

    枯死 --> 管理中: isDead = false
    非アクティブ --> 管理中: isActive = true

    非アクティブ --> [*]: 完全削除

    state 管理中 {
        [*] --> 通常
        通常 --> 蕾確認: FloweringRecord作成
        蕾確認 --> 開花中: floweringDate設定
        開花中 --> 結実中: fruitRipeDate設定
        開花中 --> 通常: wiltedDate設定
        結実中 --> 通常: サイクル完了
    }

    note right of 枯死
        isDead=trueでも
        記録は保持される
    end note
```

### 8.2 Google Drive同期状態

```mermaid
stateDiagram-v2
    [*] --> 未連携

    未連携 --> 認証中: 連携ボタン押下
    認証中 --> 連携済み: 認証成功
    認証中 --> 未連携: 認証キャンセル/失敗

    連携済み --> アップロード中: 保存ボタン押下
    連携済み --> ダウンロード中: 復元ボタン押下

    アップロード中 --> 連携済み: 成功
    アップロード中 --> エラー: 失敗

    ダウンロード中 --> 連携済み: 成功
    ダウンロード中 --> エラー: 失敗

    エラー --> 連携済み: リトライ成功
    エラー --> 未連携: 再認証必要

    連携済み --> 未連携: 連携解除

    note right of 連携済み
        トークンはメモリのみ保持
        有効期限: 1時間
    end note
```

### 8.3 CSVインポート状態

```mermaid
stateDiagram-v2
    [*] --> 待機中

    待機中 --> ファイル選択済み: ファイル選択
    ファイル選択済み --> パース中: 自動パース開始

    パース中 --> プレビュー表示: パース成功
    パース中 --> エラー: パース失敗

    エラー --> 待機中: 別ファイル選択

    プレビュー表示 --> インポート中: インポート実行
    プレビュー表示 --> 待機中: キャンセル

    インポート中 --> 完了: 成功
    インポート中 --> エラー: 失敗

    完了 --> 待機中: 続けてインポート
    完了 --> [*]: 画面遷移

    state プレビュー表示 {
        [*] --> データ概要表示
        データ概要表示 --> 場所選択
        場所選択 --> インポート準備完了
    }
```

---

## エンティティ関連図

```mermaid
erDiagram
    Plant ||--o{ WateringLog : has
    Plant ||--o{ FloweringRecord : has
    Plant ||--o{ GrowthEvent : has
    Plant ||--o{ PlantLocationHistory : has
    Plant }o--|| Location : belongs_to

    Location ||--o{ EnvironmentLog : has
    Location ||--o{ DailyEnvironmentSummary : has
    Location ||--o{ PlantLocationHistory : has

    Plant {
        string id PK
        string name
        string species
        string currentLocationId FK
        date plantedAt
        date acquiredAt
        string notes
        boolean isActive
        boolean isDead
        json inheritedFrom
        date createdAt
        date updatedAt
    }

    Location {
        string id PK
        string name
        string description
        date createdAt
        date updatedAt
    }

    WateringLog {
        string id PK
        string plantId FK
        date timestamp
        number amount
        string batchId
        string notes
    }

    FloweringRecord {
        string id PK
        string plantId FK
        date budDate
        date floweringDate
        date wiltedDate
        date fruitRipeDate
        string notes
        date createdAt
        date updatedAt
    }

    GrowthEvent {
        string id PK
        string plantId FK
        date timestamp
        string eventType
        string notes
    }

    EnvironmentLog {
        string id PK
        string locationId FK
        date timestamp
        number temperature
        number humidity
        string source
    }

    DailyEnvironmentSummary {
        string id PK
        string locationId FK
        string date
        number tempMax
        number tempMin
        number tempAvg
        number humidityMax
        number humidityMin
        number humidityAvg
        number dataPoints
        string source
    }

    PlantLocationHistory {
        string id PK
        string plantId FK
        string locationId FK
        date movedAt
        string notes
    }

    UserProfile {
        string id PK
        string displayName
        string contact
        date createdAt
        date updatedAt
    }
```

---

## 技術スタック

```mermaid
graph TB
    subgraph "Frontend"
        React["React 18"]
        TypeScript["TypeScript 5"]
        Router["React Router 6"]
    end

    subgraph "Styling"
        Tailwind["Tailwind CSS 3"]
        Lucide["lucide-react"]
    end

    subgraph "Data"
        Dexie["Dexie 4"]
        IndexedDB["IndexedDB"]
    end

    subgraph "Build"
        Vite["Vite 6"]
        PWA["vite-plugin-pwa"]
    end

    subgraph "External"
        GoogleDrive["Google Drive API"]
        jsPDF["jsPDF"]
    end

    React --> Dexie
    Dexie --> IndexedDB
    Vite --> PWA

    style React fill:#61dafb
    style TypeScript fill:#3178c6
    style Tailwind fill:#38bdf8
```

---

## ディレクトリ構造

```
src/
├── components/           # 共有コンポーネント
│   ├── layout/          # Header, BottomTab, PageLayout
│   ├── common/          # FAB, EmptyState, ListItem, Toast
│   └── ui/              # Button, Input, Modal, Select
│
├── features/            # 機能別モジュール
│   ├── plants/          # 植物管理
│   ├── watering/        # 水やり
│   ├── locations/       # 場所管理
│   ├── flowering/       # 開花記録
│   ├── growth-events/   # 成長イベント
│   ├── environment/     # 環境データ
│   ├── plant-passport/  # Plant Passport
│   └── settings/        # 設定・同期
│
├── db/                  # データベース層
│   ├── database.ts      # Dexie設定
│   ├── models/          # データモデル定義
│   └── repositories/    # CRUD操作
│
├── hooks/               # カスタムフック
├── utils/               # ユーティリティ関数
├── Router.tsx           # ルーティング定義
└── App.tsx              # アプリエントリーポイント
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-12-30 | 2.0 | テンプレートに基づき全面改訂。詳細フロー図、シーケンス図、状態遷移図を追加 |
| 2024-12-28 | 1.0 | 初版作成 |
