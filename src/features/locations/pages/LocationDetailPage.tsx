import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Thermometer } from 'lucide-react'
import { db } from '@/db/database'
import { Header, PageLayout } from '@/components/layout'
import { Button, Modal, Input, TextArea } from '@/components/ui'
import { FAB, EmptyState } from '@/components/common'
import { LocationForm, type LocationFormData } from '../components/LocationForm'
import { locationRepository, environmentRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, formatDateTimeForInput } from '@/utils/date'
import type { Location } from '@/db/models'

export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false)
  const [timestamp, setTimestamp] = useState(formatDateTimeForInput(new Date()))
  const [temperature, setTemperature] = useState('')
  const [humidity, setHumidity] = useState('')
  const [notes, setNotes] = useState('')
  const [stableLocation, setStableLocation] = useState<Location | null>(null)

  const location = useLiveQuery(async () => {
    if (!id) return undefined
    const loc = await db.locations.get(id)
    if (!loc) return null

    // 日付データをDateオブジェクトに変換（文字列の場合に対応）
    return {
      ...loc,
      createdAt: new Date(loc.createdAt),
      updatedAt: new Date(loc.updatedAt),
    }
  }, [id])

  const plants = useLiveQuery(async () => {
    if (!id) return []
    const plantList = await db.plants.filter((p) => p.isActive && p.currentLocationId === id).toArray()

    // 日付データをDateオブジェクトに変換（文字列の場合に対応）
    return plantList.map(p => ({
      ...p,
      plantedAt: p.plantedAt ? new Date(p.plantedAt) : undefined,
      acquiredAt: p.acquiredAt ? new Date(p.acquiredAt) : undefined,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      inheritedFrom: p.inheritedFrom ? {
        ...p.inheritedFrom,
        importedAt: new Date(p.inheritedFrom.importedAt),
      } : undefined,
    }))
  }, [id])
  const environmentLogs = useLiveQuery(async () => {
    if (!id) return []
    const logs = await db.environmentLogs.where('locationId').equals(id).reverse().sortBy('timestamp')

    // 日付データをDateオブジェクトに変換（文字列の場合に対応）
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
      createdAt: log.createdAt ? new Date(log.createdAt) : undefined,
      updatedAt: log.updatedAt ? new Date(log.updatedAt) : undefined,
    }))
  }, [id])

  // locationが有効な値の時のみstableLocationを更新
  useEffect(() => {
    console.log('[LocationDetailPage] location changed:', location ? 'valid object' : location)
    if (location) {
      setStableLocation(location)
      console.log('[LocationDetailPage] stableLocation updated')
    } else if (location === null) {
      // データが存在しない場合はstableLocationもnullにする
      setStableLocation(null)
      console.log('[LocationDetailPage] location is null, cleared stableLocation')
    }
  }, [location])

  // useLiveQueryの初期undefined状態と、データが存在しない状態を区別
  const isLoading = location === undefined && stableLocation === null

  if (isLoading) {
    return (
      <>
        <Header title="読み込み中..." showBack />
        <PageLayout>
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        </PageLayout>
      </>
    )
  }

  // データが存在しない場合
  if (!stableLocation) {
    return (
      <>
        <Header title="場所詳細" showBack />
        <PageLayout>
          <div className="text-center text-gray-500 py-8">場所が見つかりません</div>
        </PageLayout>
      </>
    )
  }

  const handleUpdate = async (data: LocationFormData) => {
    await locationRepository.update(stableLocation.id, data)
    setIsEditModalOpen(false)
    showToast('場所を更新しました')
  }

  const handleDelete = async () => {
    if (confirm('この場所を削除しますか？')) {
      await locationRepository.delete(stableLocation.id)
      showToast('場所を削除しました')
      navigate('/locations')
    }
  }

  const resetEnvForm = () => {
    setTimestamp(formatDateTimeForInput(new Date()))
    setTemperature('')
    setHumidity('')
    setNotes('')
  }

  const handleEnvSubmit = async () => {
    if (!temperature && !humidity) {
      showToast('気温または湿度を入力してください', 'error')
      return
    }

    await environmentRepository.create({
      locationId: stableLocation.id,
      timestamp: new Date(timestamp),
      temperature: temperature ? parseFloat(temperature) : undefined,
      humidity: humidity ? parseFloat(humidity) : undefined,
      notes: notes.trim() || undefined,
    })
    setIsEnvModalOpen(false)
    resetEnvForm()
    showToast('環境データを記録しました')
  }

  return (
    <>
      <Header
        title={stableLocation.name}
        showBack
        rightAction={
          <Button size="sm" variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            編集
          </Button>
        }
      />
      <PageLayout noPadding>
        {/* 場所情報 */}
        {stableLocation.description && (
          <div className="p-4 bg-white border-b">
            <p className="text-sm text-gray-600">説明: {stableLocation.description}</p>
          </div>
        )}

        {/* この場所の植物 */}
        <div className="p-4 bg-white border-b">
          <h3 className="font-medium mb-2">この場所の植物 ({plants?.length || 0})</h3>
          {plants && plants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plants.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => navigate(`/plants/${plant.id}`)}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100"
                >
                  {plant.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">植物がありません</p>
          )}
        </div>

        {/* 環境データ */}
        <div className="p-4">
          <h3 className="font-medium mb-4">環境データ</h3>
          {!environmentLogs || environmentLogs.length === 0 ? (
            <EmptyState
              icon={<Thermometer size={48} />}
              title="環境データがありません"
              description="環境データを記録してみましょう"
            />
          ) : (
            <div className="space-y-2">
              {environmentLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-3 rounded-lg border border-gray-100"
                >
                  <p className="text-sm font-medium">{formatDateTime(log.timestamp)}</p>
                  <div className="flex gap-4 mt-1">
                    {log.temperature !== undefined && (
                      <span className="text-sm text-gray-600">🌡 {log.temperature}℃</span>
                    )}
                    {log.humidity !== undefined && (
                      <span className="text-sm text-gray-600">💧 {log.humidity}%</span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-sm text-gray-500 mt-1">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <FAB onClick={() => setIsEnvModalOpen(true)}>
          <Thermometer size={20} />
          環境を記録
        </FAB>
      </PageLayout>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="場所を編集"
      >
        <LocationForm
          location={stableLocation}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
        />
        <div className="mt-4 pt-4 border-t">
          <Button variant="danger" onClick={handleDelete} className="w-full">
            この場所を削除
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isEnvModalOpen}
        onClose={() => {
          setIsEnvModalOpen(false)
          resetEnvForm()
        }}
        title="環境データを記録"
      >
        <div className="space-y-4">
          <Input
            label="日時"
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            required
          />
          <Input
            label="気温（℃）"
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="例: 25.5"
          />
          <Input
            label="湿度（%）"
            type="number"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            placeholder="例: 60"
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
                setIsEnvModalOpen(false)
                resetEnvForm()
              }}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleEnvSubmit} className="flex-1">
              保存する
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
