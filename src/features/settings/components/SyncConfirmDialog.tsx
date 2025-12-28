import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface SyncConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: 'upload' | 'download'
  isLoading: boolean
}

export function SyncConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  isLoading,
}: SyncConfirmDialogProps) {
  const isUpload = type === 'upload'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUpload ? 'Google Driveに保存' : 'Google Driveから復元'}
    >
      <div className="space-y-4">
        {isUpload ? (
          <p className="text-gray-600">
            現在のデータをGoogle Driveに保存します。
            <br />
            既存のバックアップは上書きされます。
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-700">
                <p className="font-semibold">注意</p>
                <p>
                  Google Driveのデータで現在のデータを上書きします。
                  この操作は取り消せません。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '処理中...' : isUpload ? '保存' : '復元'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
