import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ExportHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportHelpModal({ isOpen, onClose }: ExportHelpModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SwitchBotからCSVエクスポート">
      <div className="space-y-4">
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>SwitchBotアプリを開く</li>
          <li>温湿度計デバイスをタップ</li>
          <li>右上の「履歴」をタップ</li>
          <li>「エクスポート」をタップ</li>
          <li>期間を選択（最大1年分まで）</li>
          <li>「確認」でCSVを保存</li>
        </ol>

        <hr className="border-gray-200" />

        <div className="text-sm text-gray-500 space-y-2">
          <p>
            定期的にエクスポートしてplalogにインポートするとデータが蓄積されます
          </p>
        </div>

        <Button onClick={onClose} variant="secondary" className="w-full">
          閉じる
        </Button>
      </div>
    </Modal>
  )
}
