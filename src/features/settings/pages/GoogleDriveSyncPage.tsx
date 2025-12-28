import { useState } from 'react'
import { Header, PageLayout } from '@/components/layout'
import { Button } from '@/components/ui/Button'
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync'
import { SyncConfirmDialog } from '../components/SyncConfirmDialog'
import {
  CloudOff,
  CloudCog,
  Upload,
  Download,
  Link2Off,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react'

export function GoogleDriveSyncPage() {
  const {
    isAuthenticated,
    isLoading,
    error,
    lastSyncedAt,
    connect,
    disconnect,
    upload,
    download,
    clearError,
  } = useGoogleDriveSync()

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'upload' | 'download'
  }>({ isOpen: false, type: 'upload' })

  const handleUpload = () => {
    setConfirmDialog({ isOpen: true, type: 'upload' })
  }

  const handleDownload = () => {
    setConfirmDialog({ isOpen: true, type: 'download' })
  }

  const handleConfirm = async () => {
    const success =
      confirmDialog.type === 'upload' ? await upload() : await download()
    if (success) {
      setConfirmDialog({ isOpen: false, type: 'upload' })
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Google Drive 同期" showBack />
      <PageLayout>
        <div className="space-y-6">
          {/* 説明セクション */}
          <div className="text-gray-600">
            <p>Google Driveと連携してデータをバックアップできます。</p>
          </div>

          <hr className="border-gray-200" />

          {/* ステータスセクション */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">ステータス:</span>
              {isAuthenticated ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check size={18} />
                  連携済み
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-500">
                  <CloudOff size={18} />
                  未連携
                </span>
              )}
            </div>
            {lastSyncedAt && (
              <p className="text-sm text-gray-500">
                最終同期: {formatDate(lastSyncedAt)}
              </p>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={clearError}
                  className="text-sm text-red-600 underline mt-1"
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* アクションセクション */}
          {!isAuthenticated ? (
            <Button
              onClick={connect}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <CloudCog size={20} />
              {isLoading ? '接続中...' : 'Googleアカウントと連携'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Google Driveに保存
              </Button>

              <Button
                onClick={handleDownload}
                disabled={isLoading}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Google Driveから復元
              </Button>

              <hr className="border-gray-200" />

              <Button
                onClick={disconnect}
                disabled={isLoading}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 text-gray-600"
              >
                <Link2Off size={20} />
                連携を解除
              </Button>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* 注意事項 */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>データはあなたのGoogle Driveの非公開領域に保存されます</p>
            </div>
            <div className="flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>他のユーザーからは見えません</p>
            </div>
            <div className="flex items-start gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>同期は手動で行います</p>
            </div>
          </div>
        </div>

        <SyncConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, type: 'upload' })}
          onConfirm={handleConfirm}
          type={confirmDialog.type}
          isLoading={isLoading}
        />
      </PageLayout>
    </>
  )
}
