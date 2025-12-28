import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplets } from 'lucide-react'
import { db } from '@/db/database'
import { Header, PageLayout } from '@/components/layout'
import { Button, Input, Modal, TextArea } from '@/components/ui'
import { EmptyState } from '@/components/common'
import { wateringRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, formatDateTimeForInput } from '@/utils/date'
import type { WateringLog } from '@/db/models'

export function WateringHistoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WateringLog | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const { showToast } = useToast()

  const wateringLogs = useLiveQuery(async () => {
    const logs = await db.wateringLogs.toArray()
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  const plants = useLiveQuery(() => db.plants.toArray())

  const getPlantName = (plantId: string): string => {
    const plant = plants?.find((p) => p.id === plantId)
    return plant?.name || '不明な植物'
  }

  const resetForm = () => {
    setSelectedDateTime('')
    setNotes('')
    setEditingRecord(null)
  }

  const openEditModal = (record: WateringLog) => {
    setEditingRecord(record)
    setSelectedDateTime(formatDateTimeForInput(record.timestamp))
    setNotes(record.notes || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingRecord) return

    const data = {
      timestamp: selectedDateTime ? new Date(selectedDateTime) : editingRecord.timestamp,
      notes: notes.trim() || undefined,
    }

    await wateringRepository.update(editingRecord.id, data)
    showToast('水やり記録を更新しました')
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!editingRecord) return
    if (confirm('この水やり記録を削除しますか？')) {
      await wateringRepository.delete(editingRecord.id)
      setIsModalOpen(false)
      resetForm()
      showToast('水やり記録を削除しました')
    }
  }

  if (!wateringLogs || !plants) return null

  return (
    <>
      <Header
        title="過去の水やり一覧"
        showBack
      />
      <PageLayout>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-600">
                    <Droplets size={16} />
                    <span className="font-medium">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(log)}>
                    編集
                  </Button>
                </div>
                <p className="text-sm text-gray-800 mt-1 ml-6">
                  {getPlantName(log.plantId)}
                </p>
                {log.notes && (
                  <p className="text-sm text-gray-500 mt-1 ml-6">{log.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </PageLayout>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="水やり記録を編集"
      >
        <div className="space-y-4">
          {editingRecord && (
            <p className="text-sm text-gray-600">
              植物: {getPlantName(editingRecord.plantId)}
            </p>
          )}
          <Input
            label="日時"
            type="datetime-local"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
          />
          <TextArea
            label="メモ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="メモを入力"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              保存する
            </Button>
          </div>
          <Button variant="danger" onClick={handleDelete} className="w-full">
            削除
          </Button>
        </div>
      </Modal>
    </>
  )
}
