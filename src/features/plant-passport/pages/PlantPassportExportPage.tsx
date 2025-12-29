import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header, PageLayout } from '@/components/layout'
import { Button } from '@/components/ui/Button'
import { TextArea } from '@/components/ui/TextArea'
import { Checkbox } from '@/components/ui/Checkbox'
import { useExportPassport } from '../hooks/useExportPassport'
import { useUserProfile } from '../hooks/useUserProfile'
import { UserProfileEditor } from '../components/UserProfileEditor'
import { plantRepository } from '@/db/repositories/plantRepository'
import type { Plant } from '@/db/models'
import type { ExportOptions } from '../types'
import {
  User,
  ChevronRight,
  FileJson,
  FileText,
  CheckCircle,
  Share2,
  AlertCircle,
} from 'lucide-react'

type PageState = 'settings' | 'complete'

export function PlantPassportExportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [pageState, setPageState] = useState<PageState>('settings')
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  const { profile } = useUserProfile()
  const { isLoading, error, result, exportPassport, downloadFile, reset } =
    useExportPassport()

  const [options, setOptions] = useState<ExportOptions>({
    includeSummary: true,
    includeGrowthEvents: true,
    includeFloweringRecords: true,
    includeEnvironment: false,
    exportJson: true,
    exportPdf: true,
    publicNotes: '',
  })

  useEffect(() => {
    if (id) {
      plantRepository.getById(id).then((p) => {
        if (p) {
          setPlant(p)
          setOptions((prev) => ({ ...prev, publicNotes: p.notes || '' }))
        }
      })
    }
  }, [id])

  const handleExport = async () => {
    if (!plant) return

    const exportResult = await exportPassport(plant, options)
    if (exportResult) {
      setPageState('complete')
    }
  }

  const handleDownloadJson = () => {
    if (result?.jsonBlob) {
      downloadFile(result.jsonBlob, `${result.fileName}_passport.json`)
    }
  }

  const handleDownloadPdf = () => {
    if (result?.pdfBlob) {
      downloadFile(result.pdfBlob, `${result.fileName}_passport.pdf`)
    }
  }

  const handleShareJson = async () => {
    if (result?.jsonBlob && navigator.share) {
      const file = new File(
        [result.jsonBlob],
        `${result.fileName}_passport.json`,
        { type: 'application/json' }
      )
      try {
        await navigator.share({ files: [file] })
      } catch {
        handleDownloadJson()
      }
    } else {
      handleDownloadJson()
    }
  }

  const handleSharePdf = async () => {
    if (result?.pdfBlob && navigator.share) {
      const file = new File(
        [result.pdfBlob],
        `${result.fileName}_passport.pdf`,
        { type: 'application/pdf' }
      )
      try {
        await navigator.share({ files: [file] })
      } catch {
        handleDownloadPdf()
      }
    } else {
      handleDownloadPdf()
    }
  }

  const handleReset = () => {
    reset()
    setPageState('settings')
  }

  if (!plant) {
    return (
      <>
        <Header title="Plant Passport" showBack />
        <PageLayout>
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        </PageLayout>
      </>
    )
  }

  // 設定画面
  if (pageState === 'settings') {
    return (
      <>
        <Header title="Plant Passport" showBack />
        <PageLayout>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                {plant.name}のPlant Passportを作成
              </h2>
              {plant.species && (
                <p className="text-sm text-gray-500">{plant.species}</p>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* ユーザー情報 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                あなたの情報
              </h3>
              <button
                onClick={() => setShowProfileEditor(true)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-gray-500" />
                  <div className="text-left">
                    {profile?.displayName ? (
                      <>
                        <p className="font-medium">{profile.displayName}</p>
                        {profile.contact && (
                          <p className="text-sm text-gray-500">
                            {profile.contact}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">未設定</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* 公開メモ */}
            <div>
              <TextArea
                label="公開メモ（任意）"
                value={options.publicNotes}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, publicNotes: e.target.value }))
                }
                placeholder="この植物について伝えたいことを書いてください"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                ※ 元のメモとは別に設定できます
              </p>
            </div>

            <hr className="border-gray-200" />

            {/* 含めるデータ */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                含めるデータ
              </h3>
              <div className="space-y-2">
                <Checkbox
                  label="管理サマリー"
                  checked={options.includeSummary}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeSummary: e.target.checked,
                    }))
                  }
                />
                <Checkbox
                  label="成長イベント"
                  checked={options.includeGrowthEvents}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeGrowthEvents: e.target.checked,
                    }))
                  }
                />
                <Checkbox
                  label="開花記録"
                  checked={options.includeFloweringRecords}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeFloweringRecords: e.target.checked,
                    }))
                  }
                />
                <Checkbox
                  label="環境データ"
                  checked={options.includeEnvironment}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeEnvironment: e.target.checked,
                    }))
                  }
                />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* 出力形式 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                出力形式
              </h3>
              <div className="space-y-2">
                <Checkbox
                  label="JSON（アプリ連携用）"
                  checked={options.exportJson}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      exportJson: e.target.checked,
                    }))
                  }
                />
                <Checkbox
                  label="PDF（印刷・共有用）"
                  checked={options.exportPdf}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      exportPdf: e.target.checked,
                    }))
                  }
                />
              </div>
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

            <Button
              onClick={handleExport}
              disabled={isLoading || (!options.exportJson && !options.exportPdf)}
              className="w-full"
            >
              {isLoading ? 'エクスポート中...' : 'エクスポート'}
            </Button>
          </div>
        </PageLayout>

        <UserProfileEditor
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
        />
      </>
    )
  }

  // 完了画面
  return (
    <>
      <Header title="エクスポート完了" showBack />
      <PageLayout>
        <div className="space-y-6">
          <div className="text-center py-4">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
            <h2 className="text-lg font-semibold">エクスポート完了</h2>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              作成されたファイル
            </h3>
            <div className="space-y-3">
              {result?.jsonBlob && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileJson size={24} className="text-blue-500" />
                    <div>
                      <p className="font-medium">
                        {result.fileName}_passport.json
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(result.jsonBlob.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleShareJson}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <Share2 size={20} className="text-gray-600" />
                  </button>
                </div>
              )}

              {result?.pdfBlob && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={24} className="text-red-500" />
                    <div>
                      <p className="font-medium">
                        {result.fileName}_passport.pdf
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(result.pdfBlob.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSharePdf}
                    className="p-2 hover:bg-gray-200 rounded-full"
                  >
                    <Share2 size={20} className="text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          <p className="text-sm text-gray-500 text-center">
            ファイルを植物と一緒にお渡しください
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(`/plants/${id}`)}
              className="w-full"
            >
              植物の詳細に戻る
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              className="w-full"
            >
              別の形式でエクスポート
            </Button>
          </div>
        </div>
      </PageLayout>
    </>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
