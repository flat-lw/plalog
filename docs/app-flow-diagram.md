# plalog アプリケーション フロー図

## 概要

plalogは植物管理アプリケーションです。植物の水やり、開花記録、成長イベント、環境データを管理できます。

## ページ遷移フロー

```mermaid
flowchart TB
    subgraph Entry["エントリーポイント"]
        Start["/"] --> Plants
    end

    subgraph BottomTab["BottomTab ナビゲーション"]
        Plants["/plants<br>植物一覧"]
        Watering["/watering<br>水やり"]
        Locations["/locations<br>場所一覧"]
    end

    subgraph PlantPages["植物関連ページ"]
        Plants --> PlantDetail["/plants/:id<br>植物詳細"]
        Plants --> AddPlant["植物追加モーダル"]
        PlantDetail --> SpeciesPage["/species/:species<br>種別ページ"]
        PlantDetail --> LocationDetail
    end

    subgraph WateringPages["水やり関連ページ"]
        Watering --> WateringHistory["/watering/history<br>水やり履歴"]
    end

    subgraph LocationPages["場所関連ページ"]
        Locations --> LocationDetail["/locations/:id<br>場所詳細"]
        Locations --> AddLocation["場所追加モーダル"]
    end

    subgraph HamburgerMenu["ハンバーガーメニュー"]
        Menu["メニュー"]
        Menu --> Export["/settings/export<br>エクスポート"]
        Menu --> Import["/settings/import<br>インポート"]
        Menu --> GoogleDrive["/settings/google-drive<br>Google Drive同期"]
        Menu --> EnvImport["/settings/environment-import<br>環境データインポート"]
        Menu --> About["/about<br>アプリについて"]
    end

    Plants -.-> Menu
```

## 植物詳細ページ タブ構造

```mermaid
flowchart LR
    subgraph PlantDetail["植物詳細ページ /plants/:id"]
        Info["植物情報<br>- 枯死済み表示<br>- 種名リンク<br>- 場所リンク<br>- 入手日<br>- メモ"]

        subgraph Tabs["タブ"]
            WateringTab["水やりタブ<br>記録追加・履歴"]
            FloweringTab["開花タブ<br>蕾→開花→枯れ→結実"]
            EventsTab["イベントタブ<br>播種/発芽/植替/収穫等"]
        end
    end

    Info --> Tabs
```

## データフロー

```mermaid
flowchart TB
    subgraph UI["UI Layer"]
        Pages["Pages<br>PlantListPage, PlantDetailPage, etc."]
        Components["Components<br>PlantForm, PlantList, etc."]
        Modals["Modals<br>追加・編集フォーム"]
    end

    subgraph Hooks["Hooks Layer"]
        LiveQuery["useLiveQuery<br>リアルタイムデータ購読"]
        Toast["useToast<br>通知表示"]
        CsvImport["useCsvImport<br>CSVパース"]
    end

    subgraph Repository["Repository Layer"]
        PlantRepo["plantRepository"]
        WateringRepo["wateringRepository"]
        LocationRepo["locationRepository"]
        EnvRepo["environmentRepository"]
        FloweringRepo["floweringRepository"]
        GrowthRepo["growthEventRepository"]
    end

    subgraph Database["Dexie (IndexedDB)"]
        Plants[(Plants)]
        Locations[(Locations)]
        WateringLogs[(WateringLogs)]
        FloweringRecords[(FloweringRecords)]
        GrowthEvents[(GrowthEvents)]
        EnvironmentLogs[(EnvironmentLogs)]
        DailySummaries[(DailyEnvironmentSummaries)]
        LocationHistory[(PlantLocationHistory)]
    end

    UI --> Hooks
    Hooks --> Repository
    Repository --> Database
```

## ユーザーフロー

### 植物管理フロー

```mermaid
flowchart LR
    A["植物一覧"] --> B["+ 追加ボタン"]
    B --> C["PlantForm モーダル"]
    C --> D["保存"]
    D --> A

    A --> E["植物をタップ"]
    E --> F["植物詳細ページ"]

    F --> G["水やりタブ"]
    F --> H["開花タブ"]
    F --> I["イベントタブ"]

    G --> J["水やり記録追加"]
    H --> K["開花記録追加"]
    I --> L["イベント追加"]

    F --> M["編集ボタン"]
    M --> N["編集モーダル"]
    N --> O["枯死済みチェック"]
    O --> P["保存"]
```

### 水やりフロー

```mermaid
flowchart TB
    A["水やりページ"] --> B{"選択方法"}

    B --> C["場所で選択"]
    B --> D["植物で選択"]

    C --> E["場所選択"]
    E --> F["植物一括選択"]
    F --> G["水やり記録"]

    D --> H["植物個別選択"]
    H --> G

    A --> I["履歴ボタン"]
    I --> J["水やり履歴ページ"]
    J --> K["編集/削除"]
```

### 環境データフロー

```mermaid
flowchart LR
    A["メニュー"] --> B["環境データインポート"]
    B --> C["CSVアップロード"]
    C --> D["パース処理"]
    D --> E["場所選択"]
    E --> F["インポート確認"]
    F --> G["DB保存"]
    G --> H["日別集約生成"]

    H --> I["場所詳細で表示"]
    H --> J["種別ページで<br>耐えた気温範囲表示"]
```

### データ同期フロー

```mermaid
flowchart TB
    A["メニュー"] --> B["エクスポート"]
    A --> C["インポート"]
    A --> D["Google Drive同期"]

    B --> E["JSON生成"]
    E --> F["ダウンロード"]

    C --> G["JSONファイル選択"]
    G --> H["DB復元"]

    D --> I["Google認証"]
    I --> J{"操作選択"}
    J --> K["アップロード"]
    J --> L["ダウンロード"]
```

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
        string notes
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
```

## 技術スタック

```mermaid
block-beta
    columns 1

    block:frontend
        A["Frontend: React 18 + TypeScript"]
    end

    block:routing
        B["Routing: react-router-dom 6"]
    end

    block:styling
        C["Styling: Tailwind CSS 3"]
    end

    block:icons
        D["Icons: lucide-react"]
    end

    block:database
        E["Database: Dexie (IndexedDB)"]
    end

    block:state
        F["State: dexie-react-hooks"]
    end

    block:build
        G["Build: Vite + PWA"]
    end
```

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
