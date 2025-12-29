import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Sprout, Thermometer, Flower2 } from 'lucide-react'
import { db } from '@/db/database'
import { Header, PageLayout } from '@/components/layout'
import { ListItem, EmptyState } from '@/components/common'
import { formatDate } from '@/utils/date'

export function SpeciesSummaryPage() {
  const { species } = useParams<{ species: string }>()
  const navigate = useNavigate()
  const decodedSpecies = species ? decodeURIComponent(species) : ''

  // 同じ種名の植物を取得
  const plants = useLiveQuery(async () => {
    if (!decodedSpecies) return []
    return db.plants
      .filter((p) => p.isActive && p.species === decodedSpecies)
      .toArray()
  }, [decodedSpecies])

  // 植物のIDリスト
  const plantIds = plants?.map((p) => p.id) || []

  // 植物の場所IDリスト
  const locationIds = plants
    ?.map((p) => p.currentLocationId)
    .filter((id): id is string => !!id) || []

  // 場所を取得
  const locations = useLiveQuery(() => db.locations.toArray())

  // 環境データから最低・最高気温を取得
  const environmentStats = useLiveQuery(async () => {
    if (locationIds.length === 0) return null

    const summaries = await db.dailyEnvironmentSummaries
      .where('locationId')
      .anyOf(locationIds)
      .toArray()

    if (summaries.length === 0) return null

    const minTemp = Math.min(...summaries.map((s) => s.tempMin))
    const maxTemp = Math.max(...summaries.map((s) => s.tempMax))

    return { minTemp, maxTemp, dataPoints: summaries.length }
  }, [locationIds.join(',')])

  // 開花記録を取得
  const floweringRecords = useLiveQuery(async () => {
    if (plantIds.length === 0) return []
    return db.floweringRecords
      .where('plantId')
      .anyOf(plantIds)
      .toArray()
      .then((records) =>
        records.sort((a, b) => {
          const dateA = a.floweringDate ?? a.budDate ?? a.createdAt
          const dateB = b.floweringDate ?? b.budDate ?? b.createdAt
          return dateB.getTime() - dateA.getTime()
        })
      )
  }, [plantIds.join(',')])

  const getPlantName = (plantId: string): string => {
    const plant = plants?.find((p) => p.id === plantId)
    return plant?.name || '不明'
  }

  const getLocationName = (locationId?: string): string | null => {
    if (!locationId || !locations) return null
    const location = locations.find((l) => l.id === locationId)
    return location?.name || null
  }

  if (!plants) return null

  if (plants.length === 0) {
    return (
      <>
        <Header title={decodedSpecies || '種名'} showBack />
        <PageLayout>
          <EmptyState
            icon={<Sprout size={48} />}
            title="該当する植物がありません"
            description="この種名の植物は見つかりませんでした"
          />
        </PageLayout>
      </>
    )
  }

  return (
    <>
      <Header title={decodedSpecies} showBack />
      <PageLayout>
        {/* 気温統計 */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Thermometer size={20} className="text-orange-500" />
            耐えた気温範囲
          </h2>
          {environmentStats ? (
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-sm text-gray-500">最低気温</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {environmentStats.minTemp.toFixed(1)}°C
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">最高気温</p>
                  <p className="text-2xl font-bold text-red-600">
                    {environmentStats.maxTemp.toFixed(1)}°C
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                {environmentStats.dataPoints}日分のデータから算出
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              環境データがありません
            </div>
          )}
        </section>

        {/* 開花記録 */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Flower2 size={20} className="text-pink-500" />
            開花記録
          </h2>
          {floweringRecords && floweringRecords.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 divide-y">
              {floweringRecords.map((record) => {
                const dates: string[] = []
                if (record.budDate) dates.push(`蕾: ${formatDate(record.budDate)}`)
                if (record.floweringDate) dates.push(`開花: ${formatDate(record.floweringDate)}`)
                if (record.wiltedDate) dates.push(`枯れ: ${formatDate(record.wiltedDate)}`)
                if (record.fruitRipeDate) dates.push(`結実: ${formatDate(record.fruitRipeDate)}`)

                return (
                  <div key={record.id} className="p-3">
                    <p className="font-medium text-sm">{getPlantName(record.plantId)}</p>
                    <p className="text-sm text-gray-600">{dates.join(' → ')}</p>
                    {record.notes && (
                      <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              開花記録がありません
            </div>
          )}
        </section>

        {/* 植物リスト */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sprout size={20} className="text-green-600" />
            この種の植物 ({plants.length}株)
          </h2>
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            {plants.map((plant) => {
              const locationName = getLocationName(plant.currentLocationId)
              const subtitle = [
                plant.isDead ? '☠️ 枯死済み' : null,
                locationName,
              ].filter(Boolean).join(' · ')
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
        </section>
      </PageLayout>
    </>
  )
}
