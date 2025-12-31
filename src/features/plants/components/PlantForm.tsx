import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { Button, Input, TextArea, Select } from '@/components/ui'
import { formatDateForInput } from '@/utils/date'
import { useImportPassport } from '@/features/plant-passport/hooks/useImportPassport'
import type { Plant, InheritedInfo } from '@/db/models'

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
  inheritedFrom?: InheritedInfo
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
  const [inheritedFrom, setInheritedFrom] = useState<InheritedInfo | undefined>(
    plant?.inheritedFrom
  )

  const locations = useLiveQuery(() => db.locations.toArray())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isImporting, error, importFromFile, clearError } = useImportPassport()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await importFromFile(file)
    if (result) {
      // インポートしたデータをフォームに反映
      if (result.formData.species) setSpecies(result.formData.species)
      if (result.formData.acquiredAt) {
        setAcquiredAt(formatDateForInput(result.formData.acquiredAt))
      }
      if (result.formData.notes) setNotes(result.formData.notes)
      setInheritedFrom(result.inheritedInfo)
    }

    // ファイル選択をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

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
      inheritedFrom,
    })
  }

  const locationOptions = (locations || []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Plant Passportインポート機能（新規作成時のみ） */}
      {!plant && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Plant Passportから追加</h3>
              <p className="text-xs text-gray-500 mt-1">
                エクスポートしたPlant PassportのJSONファイルから植物情報を読み込めます
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? '読込中...' : 'ファイルを選択'}
            </Button>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm relative">
              <button
                onClick={clearError}
                className="absolute top-1 right-1 text-red-400 hover:text-red-600"
                type="button"
              >
                ×
              </button>
              <p className="text-red-800 font-medium pr-6">{error.message}</p>
              {error.details && (
                <p className="text-red-600 text-xs mt-1">{error.details}</p>
              )}
            </div>
          )}

          {inheritedFrom && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="text-blue-800">
                <span className="font-medium">インポート元:</span>{' '}
                {inheritedFrom.displayName || '不明'}
                {inheritedFrom.contact && ` (${inheritedFrom.contact})`}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                管理日数: {inheritedFrom.managementDays}日
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

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
