import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const Icon = type === 'success' ? CheckCircle : XCircle
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50'
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800'
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500'

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 ${bgColor} ${textColor} p-4 rounded-lg shadow-lg flex items-center gap-3`}>
      <Icon size={20} className={iconColor} />
      <p className="flex-1">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/50 rounded">
        <X size={16} />
      </button>
    </div>
  )
}
