import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  rightAction?: ReactNode
}

export function Header({
  title,
  showBack = false,
  showMenu = false,
  onMenuClick,
  rightAction,
}: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
