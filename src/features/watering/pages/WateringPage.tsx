import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MapPin, Sprout, Droplets, History } from 'lucide-react'
import { db } from '@/db/database'
import { Header, PageLayout, HamburgerMenu } from '@/components/layout'
import { Button, Input, Modal, TextArea } from '@/components/ui'
import { EmptyState } from '@/components/common'
import { wateringRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'
import { formatRelativeTime } from '@/utils/date'
import type { Plant, WateringLog } from '@/db/models'

type TabType = 'location' | 'select'

function getLocalDateTimeString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function WateringPage() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('location')
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalPlantIds, setModalPlantIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [selectedDateTime, setSelectedDateTime] = useState('')
  const { showToast } = useToast()

  const plants = useLiveQuery(() => db.plants.filter((p) => p.isActive).toArray())
  const locations = useLiveQuery(() => db.locations.toArray())
  const wateringLogs = useLiveQuery(() => db.wateringLogs.toArray())

  const getPlantsByLocation = (locationId: string): Plant[] => {
    if (!plants) return []
    return plants.filter((p) => p.currentLocationId === locationId)
  }

  const getLastWatering = (plantId: string): WateringLog | undefined => {
    if (!wateringLogs) return undefined
    const logs = wateringLogs
      .filter((l) => l.plantId === plantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return logs[0]
  }

  const getLocationLastWatering = (locationId: string): Date | undefined => {
    const locationPlants = getPlantsByLocation(locationId)
    if (locationPlants.length === 0) return undefined

    const lastWaterings = locationPlants
      .map((p) => getLastWatering(p.id))
      .filter((w): w is WateringLog => w !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return lastWaterings[0]?.timestamp
  }

  const openModal = (plantIds: string[]) => {
    setModalPlantIds(plantIds)
    setSelectedDateTime(getLocalDateTimeString(new Date()))
    setIsModalOpen(true)
  }

  const handleLocationClick = (locationId: string) => {
    const locationPlants = getPlantsByLocation(locationId)
    if (locationPlants.length === 0) return
    openModal(locationPlants.map((p) => p.id))
  }

  const handleSelectSubmit = () => {
    if (selectedPlantIds.length === 0) return
    openModal(selectedPlantIds)
  }

  const handleWateringSubmit = async () => {
    const timestamp = selectedDateTime ? new Date(selectedDateTime) : new Date()
    await wateringRepository.createBatch(modalPlantIds, timestamp, notes.trim() || undefined)
    setIsModalOpen(false)
    setNotes('')
    setSelectedDateTime('')
    setSelectedPlantIds([])
    showToast(`${modalPlantIds.length}株に水やりを記録しました`)
  }

  const togglePlantSelection = (plantId: string) => {
    setSelectedPlantIds((prev) =>
      prev.includes(plantId)
        ? prev.filter((id) => id !== plantId)
        : [...prev, plantId]
    )
  }

  const selectedPlantsForModal = plants?.filter((p) => modalPlantIds.includes(p.id)) || []

  return (
    <>
      <Header title="水やり" showMenu onMenuClick={() => setIsMenuOpen(true)} />
      <PageLayout noPadding>
        {/* タブ */}
        <div className="flex border-b bg-white">
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'location'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            場所ごと
          </button>
          <button
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'select'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            植物選択
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'location' ? (
            <>
              {!locations || locations.length === 0 ? (
                <EmptyState
                  icon={<MapPin size={48} />}
                  title="場所がありません"
                  description="まず場所を登録してください"
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-4">
                    場所をタップすると、その場所の全植物に水やりを記録します
                  </p>
                  {locations.map((location) => {
                    const locationPlants = getPlantsByLocation(location.id)
                    const lastWatering = getLocationLastWatering(location.id)
                    return (
                      <button
                        key={location.id}
                        onClick={() => handleLocationClick(location.id)}
                        disabled={locationPlants.length === 0}
                        className="w-full text-left p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={20} className="text-gray-500" />
                          <span className="font-medium">{location.name}</span>
                          <span className="text-sm text-gray-500 ml-auto">
                            {locationPlants.length}株
                          </span>
                        </div>
                        {lastWatering && (
                          <p className="text-sm text-gray-500 mt-1 ml-7">
                            💧 最終: {formatRelativeTime(lastWatering)}
                          </p>
                        )}
                      </button>
                    )
                  })}

                  {/* 過去の水やり一覧へのリンク */}
                  <button
                    onClick={() => navigate('/watering/history')}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 mt-4"
                  >
                    <div className="flex items-center gap-2">
                      <History size={20} className="text-gray-500" />
                      <span className="font-medium text-gray-700">過去の水やり一覧</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      すべての水やり履歴を確認・編集
                    </p>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {!plants || plants.length === 0 ? (
                <EmptyState
                  icon={<Sprout size={48} />}
                  title="植物がありません"
                  description="まず植物を登録してください"
                />
              ) : (
                <>
                  <div className="space-y-2 mb-20">
                    {plants.map((plant) => {
                      const lastWatering = getLastWatering(plant.id)
                      const location = locations?.find((l) => l.id === plant.currentLocationId)
                      return (
                        <label
                          key={plant.id}
                          className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-100 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlantIds.includes(plant.id)}
                            onChange={() => togglePlantSelection(plant.id)}
                            className="mt-1 w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{plant.name}</p>
                            <p className="text-sm text-gray-500">
                              {location?.name}
                              {lastWatering && ` 💧 ${formatRelativeTime(lastWatering.timestamp)}`}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  {selectedPlantIds.length > 0 && (
                    <div className="fixed bottom-20 left-4 right-4">
                      <Button onClick={handleSelectSubmit} className="w-full">
                        <Droplets size={20} className="mr-2" />
                        {selectedPlantIds.length}株に水やりを記録
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </PageLayout>

      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="水やり確認"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              以下の植物に水やりを記録しますか？
            </p>
            <ul className="list-disc list-inside text-gray-800">
              {selectedPlantsForModal.map((plant) => (
                <li key={plant.id}>{plant.name}</li>
              ))}
            </ul>
          </div>
          <Input
            label="日時"
            type="datetime-local"
            value={selectedDateTime}
            onChange={(e) => setSelectedDateTime(e.target.value)}
          />
          <TextArea
            label="メモ（任意）"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例: たっぷり"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button onClick={handleWateringSubmit} className="flex-1">
              <Droplets size={20} className="mr-2" />
              記録する
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
