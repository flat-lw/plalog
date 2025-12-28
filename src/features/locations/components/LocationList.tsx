import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { db } from '@/db/database'
import { ListItem, EmptyState } from '@/components/common'

export function LocationList() {
  const navigate = useNavigate()

  const locations = useLiveQuery(() => db.locations.toArray())
  const plants = useLiveQuery(() => db.plants.filter((p) => p.isActive).toArray())
  const environmentLogs = useLiveQuery(() => db.environmentLogs.toArray())

  if (!locations) return null

  if (locations.length === 0) {
    return (
      <EmptyState
        icon={<MapPin size={48} />}
        title="場所がありません"
        description="右下の「＋ 追加」ボタンから場所を追加しましょう"
      />
    )
  }

  const getPlantCount = (locationId: string): number => {
    if (!plants) return 0
    return plants.filter((p) => p.currentLocationId === locationId).length
  }

  const getLatestTemperature = (locationId: string): number | undefined => {
    if (!environmentLogs) return undefined
    const logs = environmentLogs
      .filter((l) => l.locationId === locationId && l.temperature !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return logs[0]?.temperature
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      {locations.map((location) => {
        const plantCount = getPlantCount(location.id)
        const temperature = getLatestTemperature(location.id)
        const subtitleParts = [`${plantCount}株`]
        if (temperature !== undefined) {
          subtitleParts.push(`🌡 最終: ${temperature}℃`)
        } else {
          subtitleParts.push('🌡 未記録')
        }

        return (
          <ListItem
            key={location.id}
            title={location.name}
            subtitle={subtitleParts.join(' / ')}
            icon={<MapPin size={20} />}
            onClick={() => navigate(`/locations/${location.id}`)}
          />
        )
      })}
    </div>
  )
}
