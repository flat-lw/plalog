import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Droplets, Flower2, Calendar, ChevronRight } from 'lucide-react'
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

type TabType = 'watering' | 'flowering' | 'events'

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('watering')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const plant = useLiveQuery(() => (id ? db.plants.get(id) : undefined), [id])
  const location = useLiveQuery(
    () => (plant?.currentLocationId ? db.locations.get(plant.currentLocationId) : undefined),
    [plant?.currentLocationId]
  )

  if (!plant) {
    return (
      <>
        <Header title="植物詳細" showBack />
        <PageLayout>
          <p className="text-center text-gray-500 py-8">植物が見つかりません</p>
        </PageLayout>
      </>
    )
  }

  const handleUpdate = async (data: PlantFormData) => {
    await plantRepository.update(plant.id, data)
    setIsEditModalOpen(false)
    showToast('植物を更新しました')
  }

  const handleDelete = async () => {
    if (confirm('この植物を削除しますか？')) {
      await plantRepository.delete(plant.id)
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
        title={plant.name}
        showBack
        rightAction={
          <Button size="sm" variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            編集
          </Button>
        }
      />
      <PageLayout noPadding>
        {/* 植物情報 */}
        <div className="p-4 bg-white border-b">
          {plant.species && (
            <button
              onClick={() => navigate(`/species/${encodeURIComponent(plant.species!)}`)}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              種名: {plant.species}
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
          {plant.acquiredAt && (
            <p className="text-sm text-gray-600">入手日: {formatDate(plant.acquiredAt)}</p>
          )}
          {plant.notes && (
            <p className="text-sm text-gray-600 mt-2">{plant.notes}</p>
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
          {activeTab === 'watering' && <WateringTab plantId={plant.id} />}
          {activeTab === 'flowering' && <FloweringTab plantId={plant.id} />}
          {activeTab === 'events' && <GrowthEventTab plantId={plant.id} />}
        </div>
      </PageLayout>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="植物を編集"
      >
        <PlantForm
          plant={plant}
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
