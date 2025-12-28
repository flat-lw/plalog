import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Header, PageLayout, HamburgerMenu } from '@/components/layout'
import { Modal } from '@/components/ui'
import { FAB } from '@/components/common'
import { PlantList, PlantForm, type PlantFormData } from '@/features/plants'
import { plantRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'

export function PlantListPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { showToast } = useToast()

  const handleSubmit = async (data: PlantFormData) => {
    await plantRepository.create(data)
    setIsModalOpen(false)
    showToast('植物を追加しました')
  }

  return (
    <>
      <Header
        title="植物"
        showMenu
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <PageLayout>
        {/* 検索フィールド */}
        <div className="relative mb-4">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="植物を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <PlantList searchQuery={searchQuery} />
        <FAB onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          追加
        </FAB>
      </PageLayout>

      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="植物を追加"
      >
        <PlantForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  )
}
