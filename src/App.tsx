import { Router } from './Router'
import { BottomTab } from '@/components/layout'
import { ToastProvider } from '@/hooks/useToast'
import { AutoSyncNotification } from '@/features/settings/components/AutoSyncNotification'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <AutoSyncNotification />
        <Router />
        <BottomTab />
      </div>
    </ToastProvider>
  )
}

export default App
