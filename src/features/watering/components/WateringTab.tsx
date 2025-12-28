import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplets } from 'lucide-react'
import { db } from '@/db/database'
import { Button, Modal, TextArea } from '@/components/ui'
import { FAB, EmptyState } from '@/components/common'
import { wateringRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/date'

interface WateringTabProps {
  plantId: string
}

export function WateringTab({ plantId }: WateringTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const { showToast } = useToast()

  const wateringLogs = useLiveQuery(
    () => db.wateringLogs.where('plantId').equals(plantId).reverse().sortBy('timestamp'),
    [plantId]
  )

  const handleSubmit = async () => {
    await wateringRepository.create({
      plantId,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    })
    setIsModalOpen(false)
    setNotes('')
    showToast('水やりを記録しました')
  }

  if (!wateringLogs) return null

  return (
    <>
      {wateringLogs.length === 0 ? (
        <EmptyState
          icon={<Droplets size={48} />}
          title="水やり記録がありません"
          description="水やりを記録してみましょう"
        />
      ) : (
        <div className="space-y-2">
          {wateringLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white p-3 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 text-primary-600">
                <Droplets size={16} />
                <span className="font-medium">{formatDateTime(log.timestamp)}</span>
              </div>
              {log.notes && (
                <p className="text-sm text-gray-600 mt-1 ml-6">{log.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <FAB onClick={() => setIsModalOpen(true)}>
        <Droplets size={20} />
        水やり記録
      </FAB>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="水やりを記録"
      >
        <div className="space-y-4">
          <TextArea
            label="メモ（任意）"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例: たっぷり"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              記録する
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
