import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplets, Flower2, Calendar, ChevronRight, FileDown } from 'lucide-react'
import { db } from '@/db/database'
import { Header, PageLayout } from '@/components/layout'
import { Button, Modal } from '@/components/ui'
import { PlantForm, type PlantFormData } from '@/features/plants'
import { WateringTab } from '@/features/watering/components/WateringTab'
import { FloweringTab } from '@/features/flowering/components/FloweringTab'
import { GrowthEventTab } from '@/features/growth-events/components/GrowthEventTab'
import { plantRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/date'
import type { Plant } from '@/db/models'

type TabType = 'watering' | 'flowering' | 'events'

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('watering')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [stablePlant, setStablePlant] = useState<Plant | null>(null)

  const plant = useLiveQuery(() => (id ? db.plants.get(id) : undefined), [id])
  const location = useLiveQuery(
    () => (stablePlant?.currentLocationId ? db.locations.get(stablePlant.currentLocationId) : undefined),
    [stablePlant?.currentLocationId]
  )

  // plantが有効な値の時のみstablePlantを更新
  useEffect(() => {
    console.log('[PlantDetailPage] plant changed:', plant ? 'valid object' : plant)
    if (plant) {
      setStablePlant(plant)
      console.log('[PlantDetailPage] stablePlant updated')
    } else if (plant === null) {
      // データが存在しない場合はstablePlantもnullにする
      setStablePlant(null)
      console.log('[PlantDetailPage] plant is null, cleared stablePlant')
    }
  }, [plant])

  // useLiveQueryの初期undefined状態と、データが存在しない状態を区別
  // plantがundefinedでない（nullまたは有効なオブジェクト）場合、クエリは完了している
  const isLoading = plant === undefined && stablePlant === null

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

  // データが存在しない場合（plantがnullまたはstablePlantがnull）
  if (!stablePlant) {
    return (
      <>
        <Header title="植物詳細" showBack />
        <PageLayout>
          <div className="text-center text-gray-500 py-8">植物が見つかりません</div>
        </PageLayout>
      </>
    )
  }

  const handleUpdate = async (data: PlantFormData) => {
    await plantRepository.update(stablePlant.id, data)
    setIsEditModalOpen(false)
    showToast('植物を更新しました')
  }

  const handleDelete = async () => {
    if (confirm('この植物を削除しますか？')) {
      await plantRepository.delete(stablePlant.id)
      showToast('植物を削除しました')
      navigate('/plants')
    }
  }

  const tabs = [
    { id: 'watering' as const, label: '水やり', icon: Droplets },
    { id: 'flowering' as const, label: '開花', icon: Flower2 },
    { id: 'events' as const, label: 'イベント', icon: Calendar },
  ]

  return (
    <>
      <Header
        title={stablePlant.name}
        showBack
        rightAction={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(`/plants/${stablePlant.id}/passport`)}
            >
              <FileDown size={16} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsEditModalOpen(true)}>
              編集
            </Button>
          </div>
        }
      />
      <PageLayout noPadding>
        {/* 植物情報 */}
        <div className="p-4 bg-white border-b">
          {stablePlant.isDead && (
            <p className="text-sm text-gray-500 mb-1">☠️ 枯死済み</p>
          )}
          {stablePlant.species && (
            <button
              onClick={() => navigate(`/species/${encodeURIComponent(stablePlant.species!)}`)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              種名: {stablePlant.species}
              <ChevronRight size={16} className="ml-1" />
            </button>
          )}
          {location && (
            <button
              onClick={() => navigate(`/locations/${location.id}`)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              場所: {location.name}
              <ChevronRight size={16} className="ml-1" />
            </button>
          )}
          {stablePlant.acquiredAt && (
            <p className="text-sm text-gray-600">入手日: {formatDate(stablePlant.acquiredAt)}</p>
          )}
          {stablePlant.notes && (
            <p className="text-sm text-gray-600 mt-2">{stablePlant.notes}</p>
          )}
        </div>

        {/* タブ */}
        <div className="flex border-b bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="p-4">
          {activeTab === 'watering' && <WateringTab plantId={stablePlant.id} />}
          {activeTab === 'flowering' && <FloweringTab plantId={stablePlant.id} />}
          {activeTab === 'events' && <GrowthEventTab plantId={stablePlant.id} />}
        </div>
      </PageLayout>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="植物を編集"
      >
        <PlantForm
          plant={stablePlant}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditModalOpen(false)}
        />
        <div className="mt-4 pt-4 border-t">
          <Button variant="danger" onClick={handleDelete} className="w-full">
            この植物を削除
          </Button>
        </div>
      </Modal>
    </>
  )
}
