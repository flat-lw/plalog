import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, PageLayout } from '@/components/layout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useCsvImport } from '../hooks/useCsvImport'
import { ExportHelpModal } from '../components/ExportHelpModal'
import { locationRepository } from '@/db/repositories/locationRepository'
import type { Location } from '@/db/models'
import {
  FileUp,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'

type PageState = 'select' | 'preview' | 'complete'

export function CsvImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pageState, setPageState] = useState<PageState>('select')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [showHelp, setShowHelp] = useState(false)

  const {
    file,
    preview,
    result,
    isLoading,
    error,
    selectFile,
    executeImport,
    reset,
  } = useCsvImport()

  useEffect(() => {
    locationRepository.getAll().then((locs) => {
      setLocations(locs)
      if (locs.length > 0 && !selectedLocationId) {
        setSelectedLocationId(locs[0].id)
      }
    })
  }, [selectedLocationId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await selectFile(selectedFile)
      if (!error) {
        setPageState('preview')
      }
    }
  }

  const handleImport = async () => {
    if (!selectedLocationId) return

    const importResult = await executeImport(selectedLocationId)
    if (importResult?.success) {
      setPageState('complete')
    }
  }

  const handleReset = () => {
    reset()
    setPageState('select')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  // 選択画面
  if (pageState === 'select') {
    return (
      <>
        <Header title="環境データインポート" showBack />
        <PageLayout>
          <div className="space-y-6">
            <div className="text-gray-600">
              <p>
                SwitchBotなどの温湿度計からエクスポートしたCSVファイルを取り込んで環境データを記録します
              </p>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                対応フォーマット
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>・SwitchBot 温湿度計</li>
                <li className="text-gray-400">・（今後対応予定）</li>
              </ul>
            </div>

            <hr className="border-gray-200" />

            {locations.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-700 text-sm">
                  先に場所を登録してください
                </p>
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => navigate('/locations')}
                >
                  場所を管理
                </Button>
              </div>
            ) : (
              <>
                <Select
                  label="取り込み先の場所 *"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  options={locations.map((loc) => ({
                    value: loc.id,
                    label: loc.name,
                  }))}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !selectedLocationId}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FileUp size={20} />
                  {isLoading ? '読み込み中...' : 'CSVファイルを選択'}
                </Button>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle
                  className="text-red-500 shrink-0 mt-0.5"
                  size={20}
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <hr className="border-gray-200" />

            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <HelpCircle size={18} />
              <span>SwitchBotアプリからCSVをエクスポートする方法</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </PageLayout>

        <ExportHelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </>
    )
  }

  // プレビュー画面
  if (pageState === 'preview' && preview) {
    return (
      <>
        <Header title="環境データインポート" showBack />
        <PageLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-700">
              <FileUp size={20} />
              <span className="font-medium">{file?.name}</span>
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">
                  検出されたフォーマット
                </span>
                <p className="font-medium">{preview.format} 温湿度計</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">取り込み先</span>
                <p className="font-medium">{selectedLocation?.name}</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                データ概要
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">期間</span>
                  <span>
                    {preview.dateRange.from} 〜 {preview.dateRange.to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">元データ</span>
                  <span>{preview.rawRecords.toLocaleString()}件</span>
                </div>
                <hr className="border-gray-200" />
                <div className="text-sm text-gray-500">変換後:</div>
                <div className="flex justify-between">
                  <span className="text-gray-600">時間データ</span>
                  <span>{preview.hourlyRecords.toLocaleString()}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">日データ</span>
                  <span>{preview.dailyRecords.toLocaleString()}件</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle
                className="text-amber-500 shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-amber-700">
                既存データと重複する時間帯はスキップされます
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle
                  className="text-red-500 shrink-0 mt-0.5"
                  size={20}
                />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isLoading}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'インポート中...' : 'インポート実行'}
              </Button>
            </div>
          </div>
        </PageLayout>
      </>
    )
  }

  // 完了画面
  if (pageState === 'complete' && result) {
    return (
      <>
        <Header title="環境データインポート" showBack />
        <PageLayout>
          <div className="space-y-6">
            <div className="text-center py-4">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
              <h2 className="text-lg font-semibold">インポート完了</h2>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">結果</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">時間データ</span>
                  <span>{result.hourlyRecords.toLocaleString()}件 追加</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">日データ</span>
                  <span>{result.dailyRecords.toLocaleString()}件 追加</span>
                </div>
                {result.skipped > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>スキップ</span>
                    <span>{result.skipped.toLocaleString()}件（重複）</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-gray-600">期間</span>
                  <span>
                    {result.dateRange.from} 〜 {result.dateRange.to}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() =>
                  navigate(`/locations/${selectedLocationId}`)
                }
                className="w-full"
              >
                {selectedLocation?.name}の詳細を見る
              </Button>

              <Button
                variant="secondary"
                onClick={handleReset}
                className="w-full"
              >
                続けてインポート
              </Button>
            </div>
          </div>
        </PageLayout>
      </>
    )
  }

  return null
}
