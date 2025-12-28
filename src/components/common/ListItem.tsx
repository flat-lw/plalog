import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface ListItemProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClick?: () => void
  rightContent?: ReactNode
  showArrow?: boolean
}

export function ListItem({
  title,
  subtitle,
  icon,
  onClick,
  rightContent,
  showArrow = true,
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 bg-white border-b border-gray-100 ${
        onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
      }`}
    >
      {icon && <div className="text-gray-500">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {rightContent}
      {onClick && showArrow && (
        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
      )}
    </div>
  )
}
