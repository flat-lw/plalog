import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Sprout } from 'lucide-react'
import { db } from '@/db/database'
import { ListItem, EmptyState } from '@/components/common'
import { formatRelativeTime } from '@/utils/date'
import type { WateringLog } from '@/db/models'

export function PlantList() {
  const navigate = useNavigate()

  const plants = useLiveQuery(() => db.plants.filter((p) => p.isActive).toArray())
  const locations = useLiveQuery(() => db.locations.toArray())
  const wateringLogs = useLiveQuery(() => db.wateringLogs.toArray())

  if (!plants) return null

  if (plants.length === 0) {
    return (
      <EmptyState
        icon={<Sprout size={48} />}
        title="植物がありません"
        description="右下の「＋ 追加」ボタンから植物を追加しましょう"
      />
    )
  }

  const getLocationName = (locationId?: string) => {
    if (!locationId || !locations) return null
    const location = locations.find((l) => l.id === locationId)
    return location?.name
  }

  const getLastWatering = (plantId: string): WateringLog | undefined => {
    if (!wateringLogs) return undefined
    const logs = wateringLogs
      .filter((l) => l.plantId === plantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return logs[0]
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      {plants.map((plant) => {
        const locationName = getLocationName(plant.currentLocationId)
        const lastWatering = getLastWatering(plant.id)
        const subtitle = [
          locationName,
          lastWatering ? `💧 ${formatRelativeTime(lastWatering.timestamp)}` : null,
        ]
          .filter(Boolean)
          .join('  ')

        return (
          <ListItem
            key={plant.id}
            title={plant.name}
            subtitle={subtitle || undefined}
            icon={<Sprout size={20} />}
            onClick={() => navigate(`/plants/${plant.id}`)}
          />
        )
      })}
    </div>
  )
}
