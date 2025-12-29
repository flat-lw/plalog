import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { Button, Input, TextArea, Select } from '@/components/ui'
import { formatDateForInput } from '@/utils/date'
import type { Plant } from '@/db/models'

interface PlantFormProps {
  plant?: Plant
  onSubmit: (data: PlantFormData) => void
  onCancel: () => void
}

export interface PlantFormData {
  name: string
  species?: string
  currentLocationId?: string
  acquiredAt?: Date
  notes?: string
  isDead?: boolean
}

export function PlantForm({ plant, onSubmit, onCancel }: PlantFormProps) {
  const [name, setName] = useState(plant?.name || '')
  const [species, setSpecies] = useState(plant?.species || '')
  const [locationId, setLocationId] = useState(plant?.currentLocationId || '')
  const [acquiredAt, setAcquiredAt] = useState(
    plant?.acquiredAt ? formatDateForInput(plant.acquiredAt) : ''
  )
  const [notes, setNotes] = useState(plant?.notes || '')
  const [isDead, setIsDead] = useState(plant?.isDead || false)

  const locations = useLiveQuery(() => db.locations.toArray())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      species: species.trim() || undefined,
      currentLocationId: locationId || undefined,
      acquiredAt: acquiredAt ? new Date(acquiredAt) : undefined,
      notes: notes.trim() || undefined,
      isDead,
    })
  }

  const locationOptions = (locations || []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: モンステラ"
        required
      />

      <Input
        label="種名・品種名"
        value={species}
        onChange={(e) => setSpecies(e.target.value)}
        placeholder="例: Monstera deliciosa"
      />

      <Select
        label="場所"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        options={locationOptions}
        placeholder="選択してください"
      />

      <Input
        label="入手日"
        type="date"
        value={acquiredAt}
        onChange={(e) => setAcquiredAt(e.target.value)}
      />

      <TextArea
        label="メモ"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="メモを入力"
      />

      {plant && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDead}
            onChange={(e) => setIsDead(e.target.checked)}
            className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
          />
          <span className="text-sm text-gray-700">枯死済み</span>
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
        <Button type="submit" className="flex-1">
          保存する
        </Button>
      </div>
    </form>
  )
}
