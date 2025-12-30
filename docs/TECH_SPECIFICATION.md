# plalog 技術仕様書

## 概要

本ドキュメントは、plalog（園芸管理PWAアプリケーション）の技術的な設計を定義する。

---

## 技術スタック

### コア技術

| カテゴリ | 技術 | バージョン | 選定理由 |
|----------|------|------------|----------|
| フレームワーク | React | 18.x | 情報量が多く、Claude Codeとの相性が良い |
| ビルドツール | Vite | 5.x | 高速なHMR、シンプルな設定 |
| 言語 | TypeScript | 5.x | 型安全性、IDE補完 |
| データベース | Dexie.js | 4.x | IndexedDBの使いやすいラッパー |
| スタイリング | Tailwind CSS | 3.x | ユーティリティファースト、高速開発 |
| ルーティング | React Router | 6.x | SPA標準のルーティング |
| PWA | vite-plugin-pwa | 0.x | Viteとの統合が容易 |

### 開発ツール

| ツール | 用途 |
|--------|------|
| ESLint | コード品質チェック |
| Prettier | コードフォーマット |
| Vitest | ユニットテスト |

---

## ディレクトリ構成

```
plalog/
├── .github/
│   └── workflows/         # GitHub Actions
│       └── deploy.yml     # Cloudflare Pagesデプロイ
├── public/
│   ├── icons/             # PWAアイコン（192x192, 512x512）
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/        # 共通UIコンポーネント
│   │   ├── ui/            # 基本UI（Button, Input, Modal等）
│   │   ├── layout/        # レイアウト（Header, BottomTab等）
│   │   └── common/        # 汎用（Toast, EmptyState等）
│   │
│   ├── features/          # 機能別モジュール
│   │   ├── plants/        # 植物管理
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── watering/      # 水やり
│   │   ├── flowering/     # 開花記録
│   │   ├── growth-events/ # 成長イベント
│   │   ├── locations/     # 場所管理
│   │   ├── environment/   # 環境データ
│   │   └── settings/      # 設定（エクスポート/インポート）
│   │
│   ├── db/                # データベース
│   │   ├── database.ts    # Dexieインスタンス
│   │   ├── models/        # 型定義
│   │   └── repositories/  # データアクセス層
│   │
│   ├── hooks/             # グローバルカスタムフック
│   │   ├── useToast.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── types/             # グローバル型定義
│   │   └── index.ts
│   │
│   ├── utils/             # ユーティリティ関数
│   │   ├── date.ts        # 日付操作
│   │   ├── uuid.ts        # UUID生成
│   │   └── export.ts      # エクスポート/インポート
│   │
│   ├── styles/            # グローバルスタイル
│   │   └── index.css      # Tailwind directives
│   │
│   ├── App.tsx            # アプリケーションルート
│   ├── Router.tsx         # ルーティング定義
│   └── main.tsx           # エントリーポイント
│
├── docs/                  # ドキュメント
│   ├── DATABASE_SPECIFICATION.md
│   ├── UI_SPECIFICATION.md
│   └── TECH_SPECIFICATION.md
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 主要ライブラリ

### package.json 依存関係

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "dexie": "^4.0.10",
    "dexie-react-hooks": "^1.1.7",
    "uuid": "^11.0.3",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.468.0",
    "jspdf": "^3.0.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^10.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "vite": "^6.0.5",
    "vite-plugin-pwa": "^0.21.1"
  }
}
```

### ライブラリ選定理由

| ライブラリ | 用途 | 選定理由 |
|------------|------|----------|
| dexie | IndexedDBラッパー | 直感的なAPI、リアクティブフック対応 |
| dexie-react-hooks | Dexie + React連携 | useLiveQueryでリアクティブにDB監視 |
| uuid | ID生成 | 標準的なUUID v4生成 |
| date-fns | 日付操作 | 軽量、Tree-shaking対応 |
| lucide-react | アイコン | 軽量、React対応、豊富なアイコン |
| jspdf | PDF生成 | Plant PassportのPDF出力に使用 |

---

## コンポーネント設計

### 基本UIコンポーネント

```
src/components/ui/
├── Button.tsx        # ボタン
├── Input.tsx         # テキスト入力
├── TextArea.tsx      # 複数行テキスト
├── Select.tsx        # セレクトボックス
├── Checkbox.tsx      # チェックボックス
├── RadioGroup.tsx    # ラジオボタン
├── DatePicker.tsx    # 日付選択
├── DateTimePicker.tsx # 日時選択
├── NumberInput.tsx   # 数値入力
├── Modal.tsx         # モーダルダイアログ
├── Toast.tsx         # 通知トースト
└── index.ts          # エクスポート
```

### レイアウトコンポーネント

```
src/components/layout/
├── Header.tsx        # ヘッダー（タイトル、戻るボタン、メニュー）
├── BottomTab.tsx     # ボトムタブナビゲーション
├── HamburgerMenu.tsx # サイドメニュー
├── PageLayout.tsx    # ページ共通レイアウト
├── TabLayout.tsx     # タブ画面レイアウト
└── index.ts
```

### 共通コンポーネント

```
src/components/common/
├── FAB.tsx           # フローティングアクションボタン
├── ListItem.tsx      # リストアイテム
├── EmptyState.tsx    # データなし表示
├── LoadingSpinner.tsx # ローディング
└── index.ts
```

---

## 状態管理

### 方針

- **ローカル状態**: useState, useReducer
- **サーバー状態（DB）**: Dexie useLiveQuery
- **グローバル状態**: React Context（最小限）

### Context一覧

| Context | 用途 |
|---------|------|
| ToastContext | トースト通知の表示制御 |

### Dexieのリアクティブクエリ

```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'

// 植物一覧を取得（DBの変更を自動検知）
const plants = useLiveQuery(
  () => db.plants.where('isActive').equals(true).toArray()
)
```

---

## ルーティング

### ルート定義

```typescript
// src/Router.tsx
const routes = [
  // タブ画面
  { path: '/', element: <Navigate to="/plants" replace /> },
  { path: '/plants', element: <PlantListPage /> },
  { path: '/watering', element: <WateringPage /> },
  { path: '/locations', element: <LocationListPage /> },
  
  // 詳細画面
  { path: '/plants/:id', element: <PlantDetailPage /> },
  { path: '/locations/:id', element: <LocationDetailPage /> },
  
  // 設定
  { path: '/settings/export', element: <ExportPage /> },
  { path: '/settings/import', element: <ImportPage /> },
  { path: '/settings/google-drive', element: <GoogleDriveSyncPage /> },
  { path: '/settings/environment-import', element: <CsvImportPage /> },
  { path: '/about', element: <AboutPage /> },

  // 追加ページ
  { path: '/plants/:id/passport', element: <PlantPassportExportPage /> },
  { path: '/species/:species', element: <SpeciesSummaryPage /> },
  { path: '/watering/history', element: <WateringHistoryPage /> },
]
```

### ナビゲーションパターン

```typescript
// プログラムによるナビゲーション
const navigate = useNavigate()
navigate('/plants/123')

// 戻る
navigate(-1)
```

---

## データベース操作

### リポジトリパターン

```typescript
// src/db/repositories/plantRepository.ts
import { db } from '../database'
import { Plant } from '../models'
import { v4 as uuidv4 } from 'uuid'

export const plantRepository = {
  async getAll(): Promise<Plant[]> {
    return db.plants.where('isActive').equals(true).toArray()
  },

  async getById(id: string): Promise<Plant | undefined> {
    return db.plants.get(id)
  },

  async create(data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const id = uuidv4()
    await db.plants.add({
      ...data,
      id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },

  async update(id: string, data: Partial<Plant>): Promise<void> {
    await db.plants.update(id, {
      ...data,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    // 論理削除
    await db.plants.update(id, {
      isActive: false,
      updatedAt: new Date(),
    })
  },
}
```

---

## PWA設定

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'plalog',
        short_name: 'plalog',
        description: '園芸管理アプリ',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

---

## エクスポート/インポート

### エクスポート形式

```typescript
interface ExportData {
  version: 1
  exportedAt: string  // ISO8601
  app: 'plalog'
  data: {
    plants: Plant[]
    locations: Location[]
    plantLocationHistory: PlantLocationHistory[]
    wateringLogs: WateringLog[]
    growthEvents: GrowthEvent[]
    floweringRecords: FloweringRecord[]
    environmentLogs: EnvironmentLog[]
  }
}
```

### エクスポート処理

```typescript
// src/utils/export.ts
export async function exportData(): Promise<string> {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'plalog',
    data: {
      plants: await db.plants.toArray(),
      locations: await db.locations.toArray(),
      plantLocationHistory: await db.plantLocationHistory.toArray(),
      wateringLogs: await db.wateringLogs.toArray(),
      growthEvents: await db.growthEvents.toArray(),
      floweringRecords: await db.floweringRecords.toArray(),
      environmentLogs: await db.environmentLogs.toArray(),
    },
  }
  return JSON.stringify(data, null, 2)
}

export function downloadJson(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### インポート処理

```typescript
export async function importData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString)
  
  if (data.app !== 'plalog') {
    throw new Error('Invalid file format')
  }
  
  // トランザクションで一括インポート
  await db.transaction('rw', 
    [db.plants, db.locations, db.plantLocationHistory, 
     db.wateringLogs, db.growthEvents, db.floweringRecords, db.environmentLogs],
    async () => {
      // 既存データをクリア
      await Promise.all([
        db.plants.clear(),
        db.locations.clear(),
        db.plantLocationHistory.clear(),
        db.wateringLogs.clear(),
        db.growthEvents.clear(),
        db.floweringRecords.clear(),
        db.environmentLogs.clear(),
      ])
      
      // 新データを挿入
      await Promise.all([
        db.plants.bulkAdd(data.data.plants),
        db.locations.bulkAdd(data.data.locations),
        db.plantLocationHistory.bulkAdd(data.data.plantLocationHistory),
        db.wateringLogs.bulkAdd(data.data.wateringLogs),
        db.growthEvents.bulkAdd(data.data.growthEvents),
        db.floweringRecords.bulkAdd(data.data.floweringRecords),
        db.environmentLogs.bulkAdd(data.data.environmentLogs),
      ])
    }
  )
}
```

---

## デプロイ

### Cloudflare Pages

1. GitHubリポジトリと連携
2. ビルド設定:
   - ビルドコマンド: `npm run build`
   - 出力ディレクトリ: `dist`
3. 自動デプロイ: mainブランチへのプッシュで自動デプロイ

### GitHub Actions（オプション）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: plalog
          directory: dist
```

---

## コーディング規約

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `PlantListPage.tsx` |
| 関数 | camelCase | `getPlantById()` |
| 定数 | UPPER_SNAKE_CASE | `MAX_PLANTS` |
| 型/インターフェース | PascalCase | `Plant`, `WateringLog` |
| ファイル（コンポーネント） | PascalCase | `Button.tsx` |
| ファイル（その他） | camelCase | `plantRepository.ts` |

### インポート順序

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. 外部ライブラリ
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

// 3. 内部モジュール（絶対パス）
import { db } from '@/db/database'
import { Button } from '@/components/ui'

// 4. 相対パス
import { PlantCard } from './components/PlantCard'

// 5. 型
import type { Plant } from '@/db/models'
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2024-12-28 | 1.0 | 初版作成 |
| 2024-12-30 | 1.1 | 実装に合わせて更新: ライブラリバージョン更新、jsPDF追加、ルーティング追加（Google Drive同期、環境データインポート、Plant Passport、種別サマリー、水やり履歴） |
