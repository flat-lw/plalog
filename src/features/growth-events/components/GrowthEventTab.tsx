import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Calendar, Plus } from 'lucide-react'
import { db } from '@/db/database'
import { Button, Modal, Input, TextArea, RadioGroup } from '@/components/ui'
import { FAB, EmptyState } from '@/components/common'
import { growthEventRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatDateForInput } from '@/utils/date'
import { GROWTH_EVENT_LABELS, type GrowthEventType } from '@/db/models'

interface GrowthEventTabProps {
  plantId: string
}

const EVENT_ICONS: Record<GrowthEventType, string> = {
  seed: '🌰',
  germination: '🌱',
  transplant: '🔄',
  harvest: '🌾',
  dormancy_start: '💤',
  dormancy_end: '☀️',
  death: '💀',
  location_change: '📍',
  other: '📝',
}

export function GrowthEventTab({ plantId }: GrowthEventTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventType, setEventType] = useState<GrowthEventType>('transplant')
  const [timestamp, setTimestamp] = useState(formatDateForInput(new Date()))
  const [notes, setNotes] = useState('')
  const { showToast } = useToast()

  const growthEvents = useLiveQuery(async () => {
    const events = await db.growthEvents.where('plantId').equals(plantId).reverse().sortBy('timestamp')

    // 日付データをDateオブジェクトに変換（文字列の場合に対応）
    return events.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }, [plantId])

  const resetForm = () => {
    setEventType('transplant')
    setTimestamp(formatDateForInput(new Date()))
    setNotes('')
  }

  const handleSubmit = async () => {
    await growthEventRepository.create({
      plantId,
      timestamp: new Date(timestamp),
      eventType,
      notes: notes.trim() || undefined,
    })
    setIsModalOpen(false)
    resetForm()
    showToast('イベントを記録しました')
  }

  const eventOptions = Object.entries(GROWTH_EVENT_LABELS).map(([value, label]) => ({
    value,
    label: `${EVENT_ICONS[value as GrowthEventType]} ${label}`,
  }))

  return (
    <>
      {!growthEvents || growthEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title="成長イベントがありません"
          description="イベントを記録してみましょう"
        />
      ) : (
        <div className="space-y-2">
          {growthEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white p-3 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{EVENT_ICONS[event.eventType]}</span>
                <div>
                  <p className="font-medium">
                    {formatDate(event.timestamp)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {GROWTH_EVENT_LABELS[event.eventType]}
                  </p>
                </div>
              </div>
              {event.notes && (
                <p className="text-sm text-gray-500 mt-2 ml-8">{event.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <FAB onClick={() => setIsModalOpen(true)}>
        <Plus size={20} />
        イベント追加
      </FAB>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title="イベントを記録"
      >
        <div className="space-y-4">
          <RadioGroup
            name="eventType"
            label="イベント種別"
            options={eventOptions}
            value={eventType}
            onChange={(v) => setEventType(v as GrowthEventType)}
          />
          <Input
            label="日付"
            type="date"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            required
          />
          <TextArea
            label="メモ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例: 一回り大きい鉢へ"
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
        </div>
      </Modal>
    </>
  )
}
