import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUserProfile } from '../hooks/useUserProfile'

interface UserProfileEditorProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileEditor({ isOpen, onClose }: UserProfileEditorProps) {
  const { profile, saveProfile } = useUserProfile()
  const [displayName, setDisplayName] = useState('')
  const [contact, setContact] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '')
      setContact(profile.contact || '')
    }
  }, [profile])

  const handleSave = async () => {
    setIsSaving(true)
    await saveProfile(displayName || undefined, contact || undefined)
    setIsSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="あなたの情報">
      <div className="space-y-4">
        <div>
          <Input
            label="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="園芸太郎"
          />
          <p className="text-xs text-gray-500 mt-1">
            植物をエクスポートする際にこの名前が表示されます
          </p>
        </div>

        <div>
          <Input
            label="連絡先（任意）"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="@engei_taro"
          />
          <p className="text-xs text-gray-500 mt-1">SNSアカウントなど</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
