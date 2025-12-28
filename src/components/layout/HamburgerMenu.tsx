import { Link } from 'react-router-dom'
import { X, Download, Upload, Cloud, Info } from 'lucide-react'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  { path: '/settings/export', label: 'データエクスポート', icon: Download },
  { path: '/settings/import', label: 'データインポート', icon: Upload },
  { path: '/settings/google-drive', label: 'Google Drive 同期', icon: Cloud },
  { path: '/about', label: 'このアプリについて', icon: Info },
]

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">メニュー</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="py-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <item.icon size={20} className="text-gray-500" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
