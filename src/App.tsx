import { Router } from './Router'
import { BottomTab } from '@/components/layout'
import { ToastProvider } from '@/hooks/useToast'

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Router />
        <BottomTab />
      </div>
    </ToastProvider>
  )
}

export default App
