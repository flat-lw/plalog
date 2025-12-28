import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Header, PageLayout, HamburgerMenu } from '@/components/layout'
import { Modal } from '@/components/ui'
import { FAB } from '@/components/common'
import { PlantList, PlantForm, type PlantFormData } from '@/features/plants'
import { plantRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'

export function PlantListPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        <PlantList />
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
