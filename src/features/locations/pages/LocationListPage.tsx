import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Header, PageLayout, HamburgerMenu } from '@/components/layout'
import { Modal } from '@/components/ui'
import { FAB } from '@/components/common'
import { LocationList } from '../components/LocationList'
import { LocationForm, type LocationFormData } from '../components/LocationForm'
import { locationRepository } from '@/db/repositories'
import { useToast } from '@/hooks/useToast'

export function LocationListPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (data: LocationFormData) => {
    await locationRepository.create(data)
    setIsModalOpen(false)
    showToast('場所を追加しました')
  }

  return (
    <>
      <Header
        title="場所"
        showMenu
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <PageLayout>
        <LocationList />
        <FAB onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          追加
        </FAB>
      </PageLayout>

      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="場所を追加"
      >
        <LocationForm
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  )
}
