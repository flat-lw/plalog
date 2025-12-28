import { NavLink } from 'react-router-dom'
import { Sprout, Droplets, MapPin } from 'lucide-react'

const tabs = [
  { path: '/plants', label: '植物', icon: Sprout },
  { path: '/watering', label: '水やり', icon: Droplets },
  { path: '/locations', label: '場所', icon: MapPin },
]

export function BottomTab() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 ${
                isActive ? 'text-primary-500' : 'text-gray-500'
              }`
            }
          >
            <tab.icon size={24} />
            <span className="text-xs mt-1">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
