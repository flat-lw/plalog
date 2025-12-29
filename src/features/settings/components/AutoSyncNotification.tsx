import { useEffect } from 'react'
import { useAutoSync } from '../hooks/useAutoSync'
import { useToast } from '@/hooks/useToast'

export function AutoSyncNotification() {
  const { status, message } = useAutoSync()
  const { showToast } = useToast()

  useEffect(() => {
    if (status === 'success' && message) {
      showToast(message)
    } else if (status === 'auth_required' && message) {
      showToast(message, 'error')
    } else if (status === 'error' && message) {
      showToast(message, 'error')
    }
  }, [status, message, showToast])

  // 同期中のインジケーター表示
  if (status === 'checking' || status === 'authenticating' || status === 'comparing' || status === 'downloading') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary-500 text-white text-center py-1 text-sm">
        {message}
      </div>
    )
  }

  return null
}
