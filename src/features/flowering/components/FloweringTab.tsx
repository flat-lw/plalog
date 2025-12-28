import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Flower2 } from 'lucide-react'
import { db } from '@/db/database'
import { Button, Modal, Input, TextArea } from '@/components/ui'
import { FAB, EmptyState } from '@/components/common'
import { floweringRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatDateForInput } from '@/utils/date'
import type { FloweringRecord } from '@/db/models'

interface FloweringTabProps {
  plantId: string
}

export function FloweringTab({ plantId }: FloweringTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FloweringRecord | null>(null)
  const [budDate, setBudDate] = useState('')
  const [floweringDate, setFloweringDate] = useState('')
  const [wiltedDate, setWiltedDate] = useState('')
  const [fruitRipeDate, setFruitRipeDate] = useState('')
  const [notes, setNotes] = useState('')
  const { showToast } = useToast()

  const floweringRecords = useLiveQuery(async () => {
    const records = await db.floweringRecords.where('plantId').equals(plantId).toArray()
    return records.sort((a, b) => {
      const dateA = a.budDate ?? a.floweringDate ?? a.createdAt
      const dateB = b.budDate ?? b.floweringDate ?? b.createdAt
      return dateB.getTime() - dateA.getTime()
    })
  }, [plantId])

  const resetForm = () => {
    setBudDate('')
    setFloweringDate('')
    setWiltedDate('')
    setFruitRipeDate('')
    setNotes('')
    setEditingRecord(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (record: FloweringRecord) => {
    setEditingRecord(record)
    setBudDate(record.budDate ? formatDateForInput(record.budDate) : '')
    setFloweringDate(record.floweringDate ? formatDateForInput(record.floweringDate) : '')
    setWiltedDate(record.wiltedDate ? formatDateForInput(record.wiltedDate) : '')
    setFruitRipeDate(record.fruitRipeDate ? formatDateForInput(record.fruitRipeDate) : '')
    setNotes(record.notes || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!budDate && !floweringDate) {
      showToast('蕾確認日または開花日を入力してください', 'error')
      return
    }

    const data = {
      plantId,
      budDate: budDate ? new Date(budDate) : undefined,
      floweringDate: floweringDate ? new Date(floweringDate) : undefined,
      wiltedDate: wiltedDate ? new Date(wiltedDate) : undefined,
      fruitRipeDate: fruitRipeDate ? new Date(fruitRipeDate) : undefined,
      notes: notes.trim() || undefined,
    }

    if (editingRecord) {
      await floweringRepository.update(editingRecord.id, data)
      showToast('開花記録を更新しました')
    } else {
      await floweringRepository.create(data)
      showToast('開花記録を追加しました')
    }

    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!editingRecord) return
    if (confirm('この開花記録を削除しますか？')) {
      await floweringRepository.delete(editingRecord.id)
      setIsModalOpen(false)
      resetForm()
      showToast('開花記録を削除しました')
    }
  }

  if (!floweringRecords) return null

  const formatRecordDates = (record: FloweringRecord) => {
    const parts: string[] = []
    if (record.budDate) parts.push(`蕾: ${formatDate(record.budDate)}`)
    if (record.floweringDate) parts.push(`開花: ${formatDate(record.floweringDate)}`)
    if (record.wiltedDate) parts.push(`枯れ: ${formatDate(record.wiltedDate)}`)
    if (record.fruitRipeDate) parts.push(`結実: ${formatDate(record.fruitRipeDate)}`)
    return parts.join(' → ')
  }

  return (
    <>
      {floweringRecords.length === 0 ? (
        <EmptyState
          icon={<Flower2 size={48} />}
          title="開花記録がありません"
          description="開花を記録してみましょう"
        />
      ) : (
        <div className="space-y-2">
          {floweringRecords.map((record, index) => {
            const year = (record.budDate ?? record.floweringDate ?? record.createdAt).getFullYear()
            return (
              <div
                key={record.id}
                className="bg-white p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-600">
                    <Flower2 size={16} />
                    <span className="font-medium">{year}年 #{floweringRecords.length - index}</span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(record)}>
                    編集
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  {formatRecordDates(record)}
                </p>
                {record.notes && (
                  <p className="text-sm text-gray-500 mt-1 ml-6">{record.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <FAB onClick={openAddModal}>
        <Flower2 size={20} />
        開花を記録
      </FAB>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingRecord ? '開花記録を編集' : '開花を記録'}
      >
        <div className="space-y-4">
          <Input
            label="蕾を確認した日"
            type="date"
            value={budDate}
            onChange={(e) => setBudDate(e.target.value)}
          />
          <Input
            label="開花日"
            type="date"
            value={floweringDate}
            onChange={(e) => setFloweringDate(e.target.value)}
          />
          <Input
            label="花が枯れた日"
            type="date"
            value={wiltedDate}
            onChange={(e) => setWiltedDate(e.target.value)}
          />
          <Input
            label="果実が熟した日"
            type="date"
            value={fruitRipeDate}
            onChange={(e) => setFruitRipeDate(e.target.value)}
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
          {editingRecord && (
            <Button variant="danger" onClick={handleDelete} className="w-full">
              削除
            </Button>
          )}
        </div>
      </Modal>
    </>
  )
}
