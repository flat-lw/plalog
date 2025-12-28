import { useState } from 'react'
import { Button, Input, TextArea } from '@/components/ui'
import type { Location } from '@/db/models'

interface LocationFormProps {
  location?: Location
  onSubmit: (data: LocationFormData) => void
  onCancel: () => void
}

export interface LocationFormData {
  name: string
  description?: string
}

export function LocationForm({ location, onSubmit, onCancel }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '')
  const [description, setDescription] = useState(location?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="場所名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: ベランダ"
        required
      />

      <TextArea
        label="説明"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="例: 南向き、日当たり良好"
      />

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
